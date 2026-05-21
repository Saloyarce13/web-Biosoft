const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');
const { checkAndCancelLowStockOrders } = require('../lib/stockChecker');

const PurchaseStatus = {
  REGISTERED: 'REGISTERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ANNULED: 'ANNULED',
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

// El frontend envía unitPrice; internamente lo mapeamos a unitCost (nombre del campo en BD)
const itemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity:  z.coerce.number().int().positive(),
  unitPrice: z
    .union([z.number().positive(), z.string().regex(/^[0-9]+(\.[0-9]{1,2})?$/)])
    .optional(),
});

const createPurchaseSchema = z.object({
  providerId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive().optional().nullable(),
  notes:  z.string().max(500).optional().nullable(),
  status: z.enum([PurchaseStatus.REGISTERED, PurchaseStatus.COMPLETED, PurchaseStatus.CANCELLED, PurchaseStatus.ANNULED]).optional(),
  items:  z.array(itemSchema).min(1),
});

const addItemsSchema = z.object({
  items: z.array(itemSchema).min(1),
});

const removeItemsSchema = z.object({
  productIds: z.array(z.coerce.number().int().positive()).min(1),
});

const changeStatusSchema = z.object({
  status: z.enum([PurchaseStatus.REGISTERED, PurchaseStatus.COMPLETED, PurchaseStatus.CANCELLED, PurchaseStatus.ANNULED]),
});

const getReqUserId = (req) => {
  const userId = Number(req.user?.id);
  if (!userId || Number.isNaN(userId)) throw new Error('No autorizado');
  return userId;
};

const computeTotal = (items) => {
  return moneyRound2(items.reduce((sum, it) => sum + toNumber(it.lineTotal), 0));
};

// Normaliza los items del request: resuelve unitCost y lineTotal
const normalizeItems = (items, productById) => {
  return items.map((it) => {
    const product = productById.get(it.productId);
    // El frontend puede enviar unitPrice; lo usamos como unitCost en la BD
    const unitCost = it.unitPrice !== undefined ? Number(it.unitPrice) : toNumber(product?.price ?? 0);
    const lineTotal = moneyRound2(unitCost * it.quantity);
    return { productId: it.productId, quantity: it.quantity, unitCost: moneyRound2(unitCost), lineTotal };
  });
};

const create = async (req, res) => {
  try {
    const parsed = validate(createPurchaseSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const userId = getReqUserId(req);
    const { providerId, employeeId, notes, status, items } = parsed.data;
    const purchaseStatus = status ?? PurchaseStatus.REGISTERED;

    const provider = await prisma.provider.findUnique({ where: { id: providerId }, select: { id: true, isActive: true } });
    if (!provider || !provider.isActive) {
      return res.status(400).json({ success: false, message: 'El proveedor no existe o está inactivo' });
    }

    if (employeeId) {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, isActive: true } });
      if (!employee || !employee.isActive) {
        return res.status(400).json({ success: false, message: 'El empleado no existe o está inactivo' });
      }
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true },
    });
    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, message: 'Uno o más productos no existen o están inactivos' });
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const normalizedItems = normalizeItems(items, productById);
    const totalPrice = computeTotal(normalizedItems);

    const created = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          providerId,
          employeeId: employeeId ?? undefined,
          status: purchaseStatus,
          notes: notes ?? undefined,
          purchasedAt: new Date(),
          totalPrice,
          createdByUserId: userId,
        },
        select: { id: true, status: true, totalPrice: true },
      });

      await tx.purchaseItem.createMany({
        data: normalizedItems.map((it) => ({
          purchaseId: purchase.id,
          productId:  it.productId,
          quantity:   it.quantity,
          unitCost:   it.unitCost,   // ← campo correcto en BD
          lineTotal:  it.lineTotal,
        })),
      });

      if (purchaseStatus === PurchaseStatus.COMPLETED) {
        await Promise.all(
          normalizedItems.map((it) =>
            tx.product.update({
              where: { id: it.productId },
              data:  { stock: { increment: it.quantity } },
            }),
          ),
        );

        await tx.transaction.createMany({
          data: normalizedItems.map((it) => ({
            type:       'STOCK_IN',
            amount:     it.lineTotal,
            userId,
            purchaseId: purchase.id,
            metadata:   { productId: it.productId, quantity: it.quantity },
          })),
        });
      }

      return purchase;
    });

    const purchaseFull = await prisma.purchase.findUnique({
      where: { id: created.id },
      include: {
        provider: true,
        employee: true,
        items: { include: { product: { include: { category: true } } } },
      },
    });

    return res.status(201).json({ success: true, message: 'Compra registrada correctamente', data: purchaseFull });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const list = async (req, res) => {
  try {
    const { status, providerId } = req.query;
    const where = {};
    if (status)     where.status     = status;
    if (providerId) where.providerId = Number(providerId);

    const purchases = await prisma.purchase.findMany({
      where,
      orderBy: { purchasedAt: 'desc' },
      include: { provider: true, employee: true },
    });

    return res.status(200).json({ success: true, total: purchases.length, data: purchases });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        provider: true,
        employee: true,
        items: {
          include: { product: { include: { category: true } } },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    return res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addItems = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const parsed = validate(addItemsSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { items } = parsed.data;
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: { id: true, status: true },
    });
    if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    if (purchase.status !== PurchaseStatus.REGISTERED) {
      return res.status(409).json({ success: false, message: 'Solo puedes agregar productos cuando la compra está en estado REGISTERED' });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true },
    });
    if (products.length !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: 'Uno o más productos no existen o están inactivos' });
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const normalizedItems = normalizeItems(items, productById);

    await prisma.$transaction(async (tx) => {
      for (const it of normalizedItems) {
        const existing = await tx.purchaseItem.findUnique({
          where: { purchaseId_productId: { purchaseId, productId: it.productId } },
        });

        if (existing) {
          const newQuantity = existing.quantity + it.quantity;
          const newLineTotal = moneyRound2(it.unitCost * newQuantity);
          await tx.purchaseItem.update({
            where: { purchaseId_productId: { purchaseId, productId: it.productId } },
            data:  { quantity: newQuantity, unitCost: it.unitCost, lineTotal: newLineTotal },
          });
        } else {
          await tx.purchaseItem.create({
            data: {
              purchaseId,
              productId: it.productId,
              quantity:  it.quantity,
              unitCost:  it.unitCost,
              lineTotal: it.lineTotal,
            },
          });
        }
      }

      const allItems = await tx.purchaseItem.findMany({ where: { purchaseId }, select: { lineTotal: true } });
      const newTotal = computeTotal(allItems);
      await tx.purchase.update({ where: { id: purchaseId }, data: { totalPrice: newTotal } });
    });

    const purchaseFull = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { provider: true, employee: true, items: { include: { product: { include: { category: true } } } } },
    });

    return res.status(200).json({ success: true, message: 'Productos agregados correctamente', data: purchaseFull });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeItems = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const parsed = validate(removeItemsSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });
    const { productIds } = parsed.data;

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: { id: true, status: true },
    });
    if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    if (purchase.status !== PurchaseStatus.REGISTERED) {
      return res.status(409).json({ success: false, message: 'Solo puedes eliminar productos cuando la compra está en REGISTERED' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({ where: { purchaseId, productId: { in: productIds } } });
      const allItems = await tx.purchaseItem.findMany({ where: { purchaseId }, select: { lineTotal: true } });
      const newTotal = computeTotal(allItems);
      await tx.purchase.update({ where: { id: purchaseId }, data: { totalPrice: newTotal } });
    });

    const purchaseFull = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { provider: true, employee: true, items: { include: { product: { include: { category: true } } } } },
    });

    return res.status(200).json({ success: true, message: 'Productos eliminados correctamente', data: purchaseFull });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changeStatus = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const parsed = validate(changeStatusSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });
    const { status: targetStatus } = parsed.data;

    const userId = getReqUserId(req);

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: { id: true, status: true },
    });
    if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });

    if (purchase.status === targetStatus) {
      return res.status(200).json({ success: true, message: 'Estado sin cambios', data: { id: purchaseId, status: targetStatus } });
    }

    const current = purchase.status;

    const allowed =
      (current === PurchaseStatus.REGISTERED && targetStatus === PurchaseStatus.COMPLETED) ||
      (current === PurchaseStatus.REGISTERED && [PurchaseStatus.CANCELLED, PurchaseStatus.ANNULED].includes(targetStatus));

    if (!allowed) {
      return res.status(400).json({ success: false, message: 'Transición de estado no permitida. Una orden completada no puede anularse.' });
    }

    const items = await prisma.purchaseItem.findMany({
      where: { purchaseId },
      select: { productId: true, quantity: true, lineTotal: true },
    });
    if (items.length === 0) return res.status(400).json({ success: false, message: 'La compra no tiene productos' });

    await prisma.$transaction(async (tx) => {
      if (current === PurchaseStatus.REGISTERED && targetStatus === PurchaseStatus.COMPLETED) {
        await Promise.all(
          items.map((it) =>
            tx.product.update({
              where: { id: it.productId },
              data:  { stock: { increment: it.quantity } },
            }),
          ),
        );

        await tx.transaction.createMany({
          data: items.map((it) => ({
            type:       'STOCK_IN',
            amount:     it.lineTotal,
            userId,
            purchaseId,
            metadata:   { productId: it.productId, quantity: it.quantity },
          })),
        });
      }

      await tx.purchase.update({ where: { id: purchaseId }, data: { status: targetStatus } });
    });

    const purchaseFull = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        provider: true,
        employee: true,
        items: { include: { product: { include: { category: true } } } },
      },
    });

    if (targetStatus === PurchaseStatus.COMPLETED) {
      checkAndCancelLowStockOrders().catch(err => console.warn('[STOCK CHECKER]', err?.message));
    }

    return res.status(200).json({ success: true, message: 'Estado de compra actualizado', data: purchaseFull });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const pdf = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId }, select: { id: true, pdfUrl: true } });
    if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    if (!purchase.pdfUrl) return res.status(404).json({ success: false, message: 'PDF no disponible para esta compra' });
    return res.status(200).json({ success: true, data: { pdfUrl: purchase.pdfUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { create, list, getOne, addItems, removeItems, changeStatus, pdf };
