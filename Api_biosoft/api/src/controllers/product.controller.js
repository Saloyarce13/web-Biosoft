// src/controllers/product.controller.js
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');

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
    const { category, provider, search, minPrice, maxPrice, all } = req.query;
    const where = all === 'true' ? {} : { isActive: true };

    if (category) where.categoryId = Number(category);
    if (provider) where.providerId = Number(provider);
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (search) where.name = { contains: String(search), mode: 'insensitive' };

    const products = await prisma.product.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, total: products.length, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/products/:id ─────────────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: INCLUDE,
    });
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
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

    return res.status(201).json({ success: true, message: 'Producto creado correctamente', data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const parsed = validate(updateProductSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, select: { id: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    const { name, description, price, stock, minStock, sku, image, cost, weight, barcode, categoryId, providerId, providerIds, isActive } = parsed.data;

    // No se puede desactivar un producto con stock disponible
    if (isActive === false) {
      const current = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, select: { stock: true } });
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
        where: { id: Number(req.params.id) },
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

    return res.status(200).json({ success: true, message: 'Producto actualizado correctamente', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/products/:id/stock ────────────────────────────────────────────
const updateStock = async (req, res) => {
  try {
    const parsed = validate(updateStockSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { quantity } = parsed.data;
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, name: true, stock: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    const newStock = product.stock + Number(quantity);
    if (newStock < 0) return res.status(400).json({ success: false, message: `Stock insuficiente. Stock actual: ${product.stock}` });

    // Auto-desactivar si el stock llega a 0
    const autoDeactivate = newStock === 0;
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: newStock, ...(autoDeactivate && { isActive: false }) },
    });
    return res.status(200).json({
      success: true,
      message: autoDeactivate
        ? `Stock actualizado. Producto desactivado automáticamente por stock agotado.`
        : 'Stock actualizado',
      data: { id: product.id, name: product.name, previousStock: product.stock, newStock, autoDeactivated: autoDeactivate },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, stock: true, name: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    if (product.stock > 0) {
      return res.status(409).json({ success: false, message: `No puedes eliminar "${product.name}" porque tiene ${product.stock} unidades en stock` });
    }
    await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
    return res.status(200).json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, updateStock, remove };
