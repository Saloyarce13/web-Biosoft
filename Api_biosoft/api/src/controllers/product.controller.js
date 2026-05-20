// src/controllers/product.controller.js
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const productFields = {
  name:        z.string().min(2).max(150),
  description: z.string().optional().nullable(),
  price:       z.union([z.number().positive(), z.string().regex(/^[0-9]+(\.[0-9]{1,2})?$/)]),
  stock:       z.coerce.number().int().min(0).optional(),
  minStock:    z.coerce.number().int().min(0).optional(),
  sku:         z.string().max(50).optional().nullable(),
  image:       z.string().max(500).optional().nullable(),
  cost:        z.coerce.number().nonnegative().optional().nullable(),
  weight:      z.coerce.number().nonnegative().optional().nullable(),
  barcode:     z.string().max(100).optional().nullable(),
  categoryId:  z.coerce.number().int().positive(),
  providerId:  z.coerce.number().int().positive().optional().nullable(),
  providerIds: z.array(z.coerce.number().int().positive()).optional(), // múltiples proveedores
  isActive:    z.coerce.boolean().optional(),
};

const createProductSchema = z.object(productFields);
const updateProductSchema = z.object(
  Object.fromEntries(
    Object.entries(productFields).map(([k, v]) => [k, v.optional()])
  )
);
const updateStockSchema = z.object({ quantity: z.coerce.number().int() });

const toDecimal = (v) => (v == null ? undefined : typeof v === 'string' ? Number(v) : v);

const INCLUDE = {
  category: { select: { id: true, name: true } },
  provider: { select: { id: true, name: true } },
  providers: { include: { provider: { select: { id: true, name: true } } } },
};

// ─── GET /api/products ─────────────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { 
      category, 
      provider, 
      search, 
      minPrice, 
      maxPrice, 
      all,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured = false
    } = req.query;

    // Validar parámetros de paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // máximo 100 items por página
    const skip = (pageNum - 1) * limitNum;

    // Validar ordenamiento
    const validSortFields = ['name', 'price', 'stock', 'createdAt', 'updatedAt'];
    const validSortOrders = ['asc', 'desc'];
    const orderBy = {};
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const where = all === 'true' ? {} : { isActive: true };

    // Featured products filter
    if (featured === 'true') {
      where.stock = { gt: 0 };
      // Add additional featured criteria if needed
    }

    if (category) where.categoryId = Number(category);
    if (provider) where.providerId = Number(provider);
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
        { barcode: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({ 
        where, 
        include: INCLUDE, 
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    logger.info(`Products fetched: ${products.length} of ${totalCount} total`);

    return res.status(200).json({ 
      success: true, 
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        category,
        provider,
        search,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/products/search ──────────────────────────────────────────────────
const searchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'La búsqueda debe tener al menos 2 caracteres' 
      });
    }

    const searchTerm = q.trim();
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
          { barcode: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        category: { select: { id: true, name: true } }
      },
      take: limitNum,
      orderBy: [
        { name: 'asc' }
      ]
    });

    return res.status(200).json({
      success: true,
      data: products,
      query: searchTerm,
      count: products.length
    });
  } catch (error) {
    logger.error('Error searching products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/products/featured ───────────────────────────────────────────────
const getFeatured = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 }
      },
      include: INCLUDE,
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limitNum
    });

    return res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    logger.error('Error fetching featured products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/products/low-stock ──────────────────────────────────────────────
const getLowStock = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: 5 }
      },
      include: INCLUDE,
      orderBy: [{ stock: 'asc' }]
    });

    return res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    logger.error('Error fetching low stock products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/products/:id ─────────────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de producto inválido' 
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        ...INCLUDE,
        _count: {
          select: {
            saleItems: true,
            purchaseItems: true
          }
        }
      }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    // Agregar productos relacionados de la misma categoría
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
        stock: { gt: 0 }
      },
      include: {
        category: { select: { id: true, name: true } }
      },
      take: 4,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ 
      success: true, 
      data: {
        ...product,
        relatedProducts
      }
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/products ────────────────────────────────────────────────────────
const create = async (req, res) => {
  try {
    const parsed = validate(createProductSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, description, price, stock, minStock, sku, image, cost, weight, barcode, categoryId, providerId, providerIds, isActive } = parsed.data;

    // Validar que el precio de venta no sea menor que el costo
    if (cost !== undefined && cost !== null && Number(price) <= Number(cost)) {
      return res.status(400).json({ success: false, message: 'El precio de venta debe ser mayor al costo de compra' });
    }

    // Validar SKU único si se proporciona
    if (sku) {
      const existingSku = await prisma.product.findFirst({
        where: { sku, isActive: true }
      });
      if (existingSku) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ya existe un producto con este SKU' 
        });
      }
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, isActive: true } });
    if (!category || !category.isActive) return res.status(400).json({ success: false, message: 'La categoría no existe o está inactiva' });

    // Validar todos los proveedores
    const allProviderIds = [...new Set([...(providerIds || []), ...(providerId ? [providerId] : [])])];
    for (const pid of allProviderIds) {
      const provider = await prisma.provider.findUnique({ where: { id: pid }, select: { id: true, isActive: true } });
      if (!provider || !provider.isActive) return res.status(400).json({ success: false, message: `El proveedor ${pid} no existe o está inactivo` });
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name, description: description ?? undefined,
          price: toDecimal(price), stock: stock ?? 0, minStock: minStock ?? 0,
          sku: sku ?? undefined, image: image ?? undefined,
          cost: toDecimal(cost), weight: toDecimal(weight), barcode: barcode ?? undefined,
          categoryId,
          providerId: allProviderIds[0] ?? undefined, // primer proveedor como principal
          isActive: isActive ?? true,
        },
        include: INCLUDE,
      });
      // Guardar relación muchos a muchos
      if (allProviderIds.length > 0) {
        await tx.productProvider.createMany({
          data: allProviderIds.map(pid => ({ productId: p.id, providerId: pid })),
          skipDuplicates: true,
        });
      }
      return tx.product.findUnique({ where: { id: p.id }, include: INCLUDE });
    });

    logger.info(`Product created: ${product.name} (ID: ${product.id})`);
    return res.status(201).json({ success: true, message: 'Producto creado correctamente', data: product });
  } catch (error) {
    logger.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const parsed = validate(updateProductSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de producto inválido' 
      });
    }

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, sku: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    const { name, description, price, stock, minStock, sku, image, cost, weight, barcode, categoryId, providerId, providerIds, isActive } = parsed.data;

    // Validar SKU único si se está actualizando
    if (sku && sku !== product.sku) {
      const existingSku = await prisma.product.findFirst({
        where: { 
          sku, 
          isActive: true,
          id: { not: productId }
        }
      });
      if (existingSku) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ya existe un producto con este SKU' 
        });
      }
    }

    // No se puede desactivar un producto con stock disponible
    if (isActive === false) {
      const current = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
      if (current && current.stock > 0) {
        return res.status(409).json({ success: false, message: `No puedes desactivar este producto porque tiene ${current.stock} unidades en stock` });
      }
    }

    // Validar precio > costo al actualizar
    if (price !== undefined && cost !== undefined && cost !== null && Number(price) <= Number(cost)) {
      return res.status(400).json({ success: false, message: 'El precio de venta debe ser mayor al costo de compra' });
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, isActive: true } });
      if (!category || !category.isActive) return res.status(400).json({ success: false, message: 'La categoría no existe o está inactiva' });
    }

    // Calcular lista final de proveedores
    const allProviderIds = providerIds !== undefined
      ? [...new Set([...providerIds, ...(providerId ? [providerId] : [])])]
      : providerId !== undefined ? (providerId ? [providerId] : []) : null;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: productId },
        data: {
          name: name ?? undefined, description: description ?? undefined,
          price: price !== undefined ? toDecimal(price) : undefined,
          stock: stock !== undefined ? stock : undefined,
          minStock: minStock !== undefined ? minStock : undefined,
          sku: sku ?? undefined, image: image ?? undefined,
          cost: cost !== undefined ? toDecimal(cost) : undefined,
          weight: weight !== undefined ? toDecimal(weight) : undefined,
          barcode: barcode ?? undefined,
          categoryId: categoryId ?? undefined,
          providerId: allProviderIds && allProviderIds.length > 0 ? allProviderIds[0] : (providerId !== undefined ? (providerId ?? null) : undefined),
          isActive: isActive ?? undefined,
        },
        include: INCLUDE,
      });

      // Sincronizar tabla ProductProvider si se enviaron proveedores
      if (allProviderIds !== null) {
        await tx.productProvider.deleteMany({ where: { productId: p.id } });
        if (allProviderIds.length > 0) {
          await tx.productProvider.createMany({
            data: allProviderIds.map(pid => ({ productId: p.id, providerId: pid })),
            skipDuplicates: true,
          });
        }
      }

      return tx.product.findUnique({ where: { id: p.id }, include: INCLUDE });
    });

    logger.info(`Product updated: ${updated.name} (ID: ${updated.id})`);
    return res.status(200).json({ success: true, message: 'Producto actualizado correctamente', data: updated });
  } catch (error) {
    logger.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/products/:id/stock ────────────────────────────────────────────
const updateStock = async (req, res) => {
  try {
    const parsed = validate(updateStockSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de producto inválido' 
      });
    }

    const { quantity } = parsed.data;
    const product = await prisma.product.findUnique({ 
      where: { id: productId }, 
      select: { id: true, name: true, stock: true, minStock: true } 
    });
    
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    const newStock = product.stock + Number(quantity);
    if (newStock < 0) return res.status(400).json({ success: false, message: `Stock insuficiente. Stock actual: ${product.stock}` });

    // Auto-desactivar si el stock llega a 0
    const autoDeactivate = newStock === 0;
    const isLowStock = newStock <= product.minStock && newStock > 0;
    
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: newStock, ...(autoDeactivate && { isActive: false }) },
    });

    let message = 'Stock actualizado';
    if (autoDeactivate) {
      message = 'Stock actualizado. Producto desactivado automáticamente por stock agotado.';
    } else if (isLowStock) {
      message = `Stock actualizado. ⚠️ Stock bajo: ${newStock} unidades (mínimo: ${product.minStock})`;
    }

    logger.info(`Stock updated for product ${product.name}: ${product.stock} -> ${newStock}`);
    
    return res.status(200).json({
      success: true,
      message,
      data: { 
        id: product.id, 
        name: product.name, 
        previousStock: product.stock, 
        newStock, 
        autoDeactivated: autoDeactivate,
        isLowStock
      },
    });
  } catch (error) {
    logger.error('Error updating stock:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'ID de producto inválido' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    // Verificar pedidos PENDIENTES (REGISTERED o READY) — esos sí bloquean la eliminación
    const pendingOrders = await prisma.saleItem.count({
      where: {
        productId,
        sale: { status: { in: ['REGISTERED', 'READY'] } },
      },
    });

    if (pendingOrders > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar "${product.name}" porque tiene ${pendingOrders} pedido(s) pendiente(s) de entrega. Espera a que se completen o cancelen.`,
      });
    }

    // Sin pedidos pendientes — eliminar definitivamente
    await prisma.$transaction(async (tx) => {
      // Desvincular de proveedores
      await tx.productProvider.deleteMany({ where: { productId } });
      // Eliminar items de ventas completadas/canceladas (historial)
      await tx.saleItem.deleteMany({ where: { productId } });
      // Eliminar items de compras
      await tx.purchaseItem.deleteMany({ where: { productId } });
      // Eliminar el producto
      await tx.product.delete({ where: { id: productId } });
    });

    logger.info(`Product deleted: ${product.name} (ID: ${product.id})`);
    return res.status(200).json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    logger.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getAll, 
  getOne, 
  create, 
  update, 
  updateStock, 
  remove,
  searchProducts,
  getFeatured,
  getLowStock
};