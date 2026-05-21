const { z } = require('zod');
const { sendOrderCancelledEmail, sendOrderReadyEmail } = require('../services/email.service');
const { checkAndCancelLowStockOrders } = require('../lib/stockChecker');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');

const SaleStatus = {
  REGISTERED: 'REGISTERED',
  READY:      'READY',       // listo para recoger en tienda
  COMPLETED:  'COMPLETED',
  CANCELLED:  'CANCELLED',
  ANNULED:    'ANNULED',
};

const moneyRound2 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
};

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
};

const itemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z
    .union([z.number().positive(), z.string().regex(/^[0-9]+(\.[0-9]{1,2})?$/)])
    .optional(),
});

const createSaleSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum([SaleStatus.REGISTERED, SaleStatus.COMPLETED, SaleStatus.CANCELLED, SaleStatus.ANNULED]).optional(),
  items: z.array(itemSchema).min(1),
});

const addItemsSchema = z.object({
  items: z.array(itemSchema).min(1),
});

const removeItemsSchema = z.object({
  productIds: z.array(z.coerce.number().int().positive()).min(1),
});

const changeStatusSchema = z.object({
  status: z.enum([SaleStatus.REGISTERED, SaleStatus.READY, SaleStatus.COMPLETED, SaleStatus.CANCELLED, SaleStatus.ANNULED]),
});

const setClientSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

const getReqUserId = (req) => {
  const userId = Number(req.user?.id);
  if (!userId || Number.isNaN(userId)) throw new Error('No autorizado');
  return userId;
};

const computeTotal = (items) => {
  return moneyRound2(items.reduce((sum, it) => sum + toNumber(it.lineTotal), 0));
};

const create = async (req, res) => {
  try {
    const parsed = validate(createSaleSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const userId = getReqUserId(req);
    const { clientId, employeeId, notes, status, items } = parsed.data;
    const saleStatus = status ?? SaleStatus.REGISTERED;

    // Validar que no haya productos duplicados en el mismo pedido
    const uniqueProductIds = new Set(items.map((i) => i.productId));
    if (uniqueProductIds.size !== items.length) {
      return res.status(400).json({ success: false, message: 'No puedes agregar el mismo producto dos veces en un pedido' });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, isActive: true } });
    if (!client || !client.isActive) return res.status(400).json({ success: false, message: 'El cliente no existe o está inactivo' });

    if (employeeId) {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, isActive: true } });
      if (!employee || !employee.isActive) return res.status(400).json({ success: false, message: 'El empleado no existe o está inactivo' });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true, stock: true, name: true },
    });
    if (products.length !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: 'Uno o más productos no existen o están inactivos' });
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const normalizedItems = items.map((it) => {
      const product = productById.get(it.productId);
      const unitPrice = it.unitPrice !== undefined ? Number(it.unitPrice) : toNumber(product.price);
      const lineTotal = moneyRound2(unitPrice * it.quantity);
      return { ...it, unitPrice: moneyRound2(unitPrice), lineTotal };
    });
    const totalPrice = computeTotal(normalizedItems);

    const created = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          clientId,
          employeeId: employeeId ?? undefined,
          status: saleStatus,
          notes: notes ?? undefined,
          saleDate: new Date(),
          totalPrice,
          createdByUserId: userId,
        },
        select: { id: true, status: true, totalPrice: true },
      });

      await tx.saleItem.createMany({
        data: normalizedItems.map((it) => ({
          saleId: sale.id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineTotal: it.lineTotal,
        })),
      });

      // SIEMPRE DESCONTAR STOCK AL CREAR (si no es cancelado de entrada)
      if (saleStatus !== SaleStatus.CANCELLED && saleStatus !== SaleStatus.ANNULED) {
        // Verificar stock suficiente y descontar
        const productStates = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true, name: true },
        });
        const stockById = new Map(productStates.map((p) => [p.id, p]));

        for (const it of normalizedItems) {
          const prod = stockById.get(it.productId);
          const stock = prod?.stock ?? 0;
          if (stock < it.quantity) {
            throw new Error(`Stock insuficiente para "${prod?.name || it.productId}": disponible ${stock}, requerido ${it.quantity}`);
          }
        }

        await Promise.all(
          normalizedItems.map((it) =>
            tx.product.update({
              where: { id: it.productId },
              data: { stock: { decrement: it.quantity } },
            }),
          ),
        );

        await tx.transaction.createMany({
          data: normalizedItems.map((it) => ({
            type: 'STOCK_OUT',
            amount: it.lineTotal,
            userId,
            saleId: sale.id,
            metadata: { productId: it.productId, quantity: it.quantity, reason: 'Sale creation' },
          })),
        });
      }

      return sale;
    });

    const saleFull = await prisma.sale.findUnique({
      where: { id: created.id },
      include: {
        client: true,
        employee: true,
        items: { include: { product: { include: { category: true } } } },
      },
    });

    return res.status(201).json({ success: true, message: 'Venta/pedido registrado correctamente', data: saleFull });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const list = async (req, res) => {
  try {
    const { status, clientId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = Number(clientId);

    // Si es cliente (rol user/cliente), filtrar solo sus propias ventas
    const userRole = (typeof req.user?.role === 'object' ? req.user?.role?.name : req.user?.role || '').toLowerCase();
    if (userRole === 'user' || userRole === 'cliente') {
      const client = await prisma.client.findFirst({
        where: { email: req.user.email },
        select: { id: true },
      });
      if (!client) return res.status(200).json({ success: true, total: 0, data: [] });
      where.clientId = client.id;
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      include: {
        client: true,
        employee: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, image: true } },
          },
        },
      },
    });

    return res.status(200).json({ success: true, total: sales.length, data: sales });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        client: true,
        employee: true,
        items: { include: { product: { include: { category: true } } } },
      },
    });

    if (!sale) return res.status(404).json({ success: false, message: 'Pedido/venta no encontrada' });
    return res.status(200).json({ success: true, data: sale });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const setClient = async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const parsed = validate(setClientSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { clientId } = parsed.data;
    const sale = await prisma.sale.findUnique({ where: { id: saleId }, select: { id: true, status: true } });
    if (!sale) return res.status(404).json({ success: false, message: 'Pedido/venta no encontrada' });

    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, isActive: true } });
    if (!client || !client.isActive) return res.status(400).json({ success: false, message: 'El cliente no existe o está inactivo' });

    const updated = await prisma.sale.update({
      where: { id: saleId },
      data: { clientId },
    });

    return res.status(200).json({ success: true, message: 'Cliente actualizado en el pedido', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addItems = async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const parsed = validate(addItemsSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });
    const { items } = parsed.data;

    const sale = await prisma.sale.findUnique({ where: { id: saleId }, select: { id: true, status: true } });
    if (!sale) return res.status(404).json({ success: false, message: 'Pedido/venta no encontrada' });
    // Solo se pueden agregar items si el pedido está REGISTERED
    if (sale.status !== SaleStatus.REGISTERED) {
      return res.status(409).json({ success: false, message: `No se pueden agregar productos a un pedido ${sale.status}. Solo pedidos REGISTERED pueden modificarse.` });
    }

    const userId = getReqUserId(req);

    // Validar que las cantidades sean positivas
    for (const it of items) {
      if (it.quantity <= 0) return res.status(400).json({ success: false, message: 'Las cantidades deben ser mayores a 0' });
      if (it.unitPrice !== undefined && Number(it.unitPrice) <= 0) return res.status(400).json({ success: false, message: 'Los precios deben ser mayores a 0' });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true, stock: true, name: true },
    });

    if (products.length !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: 'Uno o más productos no existen o están inactivos' });
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const normalizedItems = items.map((it) => {
      const product = productById.get(it.productId);
      const unitPrice = it.unitPrice !== undefined ? Number(it.unitPrice) : toNumber(product.price);
      const lineTotal = moneyRound2(unitPrice * it.quantity);
      return { ...it, unitPrice: moneyRound2(unitPrice), lineTotal };
    });

    await prisma.$transaction(async (tx) => {
      for (const it of normalizedItems) {
        // Verificar stock para el nuevo item
        const prod = productById.get(it.productId);
        if (prod.stock < it.quantity) throw new Error(`Stock insuficiente para "${prod.name}": disponible ${prod.stock}, requerido ${it.quantity}`);

        const existing = await tx.saleItem.findUnique({
          where: { saleId_productId: { saleId, productId: it.productId } },
        });

        if (existing) {
          const newQuantity = existing.quantity + it.quantity;
          const newLineTotal = moneyRound2(it.unitPrice * newQuantity);
          await tx.saleItem.update({
            where: { saleId_productId: { saleId, productId: it.productId } },
            data: { quantity: newQuantity, unitPrice: it.unitPrice, lineTotal: newLineTotal },
          });
        } else {
          await tx.saleItem.create({
            data: {
              saleId,
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              lineTotal: it.lineTotal,
            },
          });
        }

        // DESCONTAR STOCK (porque ahora descontamos al crear)
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });

        await tx.transaction.create({
          data: {
            type: 'STOCK_OUT',
            amount: it.lineTotal,
            userId,
            saleId,
            metadata: { productId: it.productId, quantity: it.quantity, reason: 'Item added to sale' },
          }
        });
      }

      const allItems = await tx.saleItem.findMany({ where: { saleId }, select: { lineTotal: true } });
      const newTotal = computeTotal(allItems);
      await tx.sale.update({ where: { id: saleId }, data: { totalPrice: newTotal } });
    });

    const saleFull = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { client: true, employee: true, items: { include: { product: { include: { category: true } } } } },
    });

    return res.status(200).json({ success: true, message: 'Productos agregados correctamente', data: saleFull });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeItems = async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const parsed = validate(removeItemsSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });
    const { productIds } = parsed.data;

    const sale = await prisma.sale.findUnique({ where: { id: saleId }, select: { id: true, status: true } });
    if (!sale) return res.status(404).json({ success: false, message: 'Pedido/venta no encontrada' });
    if (sale.status !== SaleStatus.REGISTERED) {
      return res.status(409).json({ success: false, message: `No se pueden eliminar productos de un pedido ${sale.status}. Solo pedidos REGISTERED pueden modificarse.` });
    }

    const userId = getReqUserId(req);

    await prisma.$transaction(async (tx) => {
      const itemsToRemove = await tx.saleItem.findMany({
        where: { saleId, productId: { in: productIds } },
        select: { productId: true, quantity: true, lineTotal: true }
      });

      for (const it of itemsToRemove) {
        // DEVOLVER STOCK (porque ahora descontamos al crear/agregar)
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity } },
        });

        await tx.transaction.create({
          data: {
            type: 'STOCK_IN',
            amount: it.lineTotal,
            userId,
            saleId,
            metadata: { productId: it.productId, quantity: it.quantity, reason: 'Item removed from sale' },
          }
        });
      }

      await tx.saleItem.deleteMany({ where: { saleId, productId: { in: productIds } } });
      const allItems = await tx.saleItem.findMany({ where: { saleId }, select: { lineTotal: true } });
      const newTotal = computeTotal(allItems);
      await tx.sale.update({ where: { id: saleId }, data: { totalPrice: newTotal } });
    });

    const saleFull = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { client: true, employee: true, items: { include: { product: { include: { category: true } } } } },
    });

    return res.status(200).json({ success: true, message: 'Productos eliminados correctamente', data: saleFull });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changeStatus = async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const parsed = validate(changeStatusSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });
    const { status: targetStatus } = parsed.data;

    const userId = getReqUserId(req);

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { id: true, status: true, totalPrice: true }
    });
    if (!sale) return res.status(404).json({ success: false, message: 'Pedido/venta no encontrada' });

    if (sale.status === targetStatus) {
      return res.status(200).json({ success: true, message: 'Estado sin cambios', data: { id: saleId, status: targetStatus } });
    }

    const current = sale.status;

    // Solo REGISTERED o READY pueden cambiar de estado
    if (current !== SaleStatus.REGISTERED && current !== SaleStatus.READY) {
      return res.status(400).json({ success: false, message: `Un pedido ${current} no puede cambiar de estado.` });
    }

    const items = await prisma.saleItem.findMany({
      where: { saleId },
      select: { productId: true, quantity: true, lineTotal: true },
    });
    if (items.length === 0) return res.status(400).json({ success: false, message: 'El pedido no tiene productos' });

    await prisma.$transaction(async (tx) => {
      // 1. Verificar si el stock ya fue descontado (buscando transacciones STOCK_OUT para este saleId)
      const outTransactions = await tx.transaction.findMany({
        where: { saleId, type: 'STOCK_OUT' }
      });
      const stockAlreadyDeducted = outTransactions.length > 0;

      // Caso A: Cancelación o Anulación -> Devolver stock si ya se descontó
      if ((targetStatus === SaleStatus.CANCELLED || targetStatus === SaleStatus.ANNULED) && stockAlreadyDeducted) {
        await Promise.all(
          items.map((it) => tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity } }
          }))
        );
        await tx.transaction.createMany({
          data: items.map((it) => ({
            type: 'STOCK_IN',
            amount: it.lineTotal,
            userId,
            saleId,
            metadata: { productId: it.productId, quantity: it.quantity, reason: 'Sale cancelled/annulled' }
          })),
        });
      }

      // Caso B: Completar -> Asegurar que el stock se descuente (si no se hizo al crear - legacy)
      if (targetStatus === SaleStatus.COMPLETED && !stockAlreadyDeducted) {
        // Verificar stock y descontar
        const productStates = await tx.product.findMany({
          where: { id: { in: items.map((i) => i.productId) } },
          select: { id: true, stock: true, name: true },
        });
        const stockById = new Map(productStates.map((p) => [p.id, p]));

        for (const it of items) {
          const prod = stockById.get(it.productId);
          const stock = prod?.stock ?? 0;
          if (stock < it.quantity) throw new Error(`Stock insuficiente para "${prod?.name || it.productId}": disponible ${stock}, requerido ${it.quantity}`);
        }

        await Promise.all(items.map((it) => tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } })));
        
        await tx.transaction.createMany({
          data: items.map((it) => ({
            type: 'STOCK_OUT',
            amount: it.lineTotal,
            userId,
            saleId,
            metadata: { productId: it.productId, quantity: it.quantity, reason: 'Legacy sale completion' }
          })),
        });
      }

      // 2. Actualizar estado del pedido
      await tx.sale.update({ where: { id: saleId }, data: { status: targetStatus } });
    });

    const saleFull = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { client: true, employee: true, items: { include: { product: { include: { category: true } } } } },
    });

    // Enviar email al cliente si el pedido fue cancelado y tiene email
    if (targetStatus === SaleStatus.CANCELLED && saleFull?.client?.email) {
      sendOrderCancelledEmail({
        to: saleFull.client.email,
        clientName: saleFull.client.name,
        orderId: saleId,
        items: (saleFull.items || []).map(i => ({
          name: i.product?.name || 'Producto',
          quantity: i.quantity,
          lineTotal: i.lineTotal,
        })),
        total: saleFull.totalPrice,
      }).catch(err => console.warn('[EMAIL CANCELACIÓN]', err?.message));
    }

    // Si se completó la venta (stock descontado), revisar otros pedidos pendientes
    if (targetStatus === SaleStatus.COMPLETED) {
      checkAndCancelLowStockOrders().catch(err => console.warn('[STOCK CHECKER]', err?.message));
    }

    return res.status(200).json({ success: true, message: 'Estado de pedido actualizado', data: saleFull });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const pdf = async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const sale = await prisma.sale.findUnique({ where: { id: saleId }, select: { id: true, pdfUrl: true } });
    if (!sale) return res.status(404).json({ success: false, message: 'Pedido/venta no encontrada' });
    if (!sale.pdfUrl) return res.status(404).json({ success: false, message: 'PDF no disponible para esta venta' });
    return res.status(200).json({ success: true, data: { pdfUrl: sale.pdfUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/sales/my-order — cliente autenticado crea su propio pedido ─────
// El cliente envía sus productos y datos de retiro; el backend busca su clientId
// por email. Si no existe como cliente, lo crea automáticamente.
const myOrderSchema = z.object({
  pickupDate: z.string().optional().nullable(),
  pickupTime: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
});

const createMyOrder = async (req, res) => {
  try {
    const parsed = validate(myOrderSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const userId = getReqUserId(req);
    const userEmail = req.user?.email;
    const userName = req.user?.name;

    if (!userEmail) return res.status(400).json({ success: false, message: 'No se pudo identificar el usuario' });

    // Buscar o crear el cliente asociado al usuario
    let client = await prisma.client.findFirst({ where: { email: userEmail, isActive: true } });
    if (!client) {
      client = await prisma.client.create({
        data: { name: userName || userEmail, email: userEmail, isActive: true },
      });
    }

    const { pickupDate, pickupTime, notes, items } = parsed.data;

    // Construir nota con info de retiro
    const pickupNote = [
      pickupDate ? `Fecha retiro: ${pickupDate}` : null,
      pickupTime ? `Hora retiro: ${pickupTime}` : null,
      notes || null,
    ].filter(Boolean).join(' | ');

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true, stock: true, name: true },
    });
    if (products.length !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: 'Uno o más productos no existen o están inactivos' });
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const normalizedItems = items.map((it) => {
      const product = productById.get(it.productId);
      const unitPrice = moneyRound2(toNumber(product.price));
      const lineTotal = moneyRound2(unitPrice * it.quantity);
      return { productId: it.productId, quantity: it.quantity, unitPrice, lineTotal };
    });
    const totalPrice = computeTotal(normalizedItems);

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Validar stock (INDISPENSABLE para pedidos web)
      for (const it of normalizedItems) {
        const prod = productById.get(it.productId);
        if (prod.stock < it.quantity) {
          throw new Error(`Stock insuficiente para "${prod.name}": disponible ${prod.stock}, requerido ${it.quantity}`);
        }
      }

      // 2. Crear pedido
      const s = await tx.sale.create({
        data: {
          clientId: client.id,
          status: SaleStatus.REGISTERED,
          notes: pickupNote || undefined,
          saleDate: new Date(),
          totalPrice,
          createdByUserId: userId,
        },
        select: { id: true },
      });

      await tx.saleItem.createMany({
        data: normalizedItems.map((it) => ({ saleId: s.id, ...it })),
      });

      // 3. DESCONTAR STOCK INMEDIATAMENTE
      await Promise.all(
        normalizedItems.map((it) =>
          tx.product.update({
            where: { id: it.productId },
            data: { stock: { decrement: it.quantity } },
          }),
        )
      );

      // 4. Registrar transacción
      await tx.transaction.createMany({
        data: normalizedItems.map((it) => ({
          type: 'STOCK_OUT',
          amount: it.lineTotal,
          userId,
          saleId: s.id,
          metadata: { productId: it.productId, quantity: it.quantity, reason: 'Web order creation' },
        })),
      });

      return s;
    });

    const saleFull = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: { client: true, items: { include: { product: true } } },
    });

    return res.status(201).json({ success: true, message: 'Pedido registrado correctamente. Tienes 24 horas para recogerlo en tienda.', data: saleFull });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/sales/:id/ready — admin marca pedido como listo para recoger ──
const markReady = async (req, res) => {
  try {
    const saleId = Number(req.params.id);

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        client: true,
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    if (!sale) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    if (sale.status !== SaleStatus.REGISTERED) {
      return res.status(400).json({ success: false, message: `Solo se pueden marcar como listos los pedidos REGISTERED. Estado actual: ${sale.status}` });
    }

    // Las 24h empiezan ahora
    const readyAt = new Date();
    const expiresAt = new Date(readyAt.getTime() + 24 * 60 * 60 * 1000);

    await prisma.sale.update({
      where: { id: saleId },
      data: { status: SaleStatus.READY, readyAt },
    });

    // Enviar email al cliente
    if (sale.client?.email) {
      sendOrderReadyEmail({
        to: sale.client.email,
        clientName: sale.client.name,
        orderId: saleId,
        items: (sale.items || []).map(i => ({
          name: i.product?.name || 'Producto',
          quantity: i.quantity,
          lineTotal: i.lineTotal,
        })),
        total: sale.totalPrice,
        expiresAt,
      }).catch(err => console.warn('[EMAIL LISTO]', err?.message));
    }

    const saleFull = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { client: true, employee: true, items: { include: { product: { include: { category: true } } } } },
    });

    return res.status(200).json({
      success: true,
      message: `Pedido #${saleId} marcado como listo. Se notificó al cliente por email. Expira: ${expiresAt.toISOString()}`,
      data: saleFull,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { create, createMyOrder, list, getOne, setClient, addItems, removeItems, changeStatus, markReady, pdf };

