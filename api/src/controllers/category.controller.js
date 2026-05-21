// src/controllers/category.controller.js

const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional().nullable(),
});

const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(300).optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

// ─── GET /api/categories ───────────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { all } = req.query;
    const where = all === 'true' ? {} : { isActive: true };

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    const data = categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      productCount: c._count.products,
    }));

    return res.status(200).json({ success: true, total: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/categories/:id ───────────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        products: {
          where: { isActive: true },
          select: {
            id: true, name: true, price: true, stock: true, image: true, isActive: true, sku: true,
            provider: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!category || !category.isActive) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/categories ──────────────────────────────────────────────────────
const create = async (req, res) => {
  try {
    const parsed = validate(createCategorySchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, description } = parsed.data;

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) return res.status(409).json({ success: false, message: 'Esta categoría ya existe' });

    const category = await prisma.category.create({
      data: { name, description: description ?? undefined, isActive: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Categoría creada correctamente',
      data: category,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/categories/:id ───────────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const parsed = validate(updateCategorySchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, description, isActive } = parsed.data;

    const category = await prisma.category.findUnique({ where: { id: Number(req.params.id) } });
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });

    if (name && name !== category.name) {
      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing) return res.status(409).json({ success: false, message: 'Este nombre de categoría ya existe' });
    }

    const updated = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        isActive: isActive ?? undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Categoría actualizada correctamente',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },  
    });

    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });

    const activeProductsCount = await prisma.product.count({
      where: { categoryId },
    });

    if (activeProductsCount > 0) {
      return res.status(409).json({
        success: false,
        message: `No puedes eliminar esta categoría porque tiene ${activeProductsCount} producto(s) asignado(s)`,
      });
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return res.status(200).json({ success: true, message: 'Categoría eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/categories/:id/status ─────────────────────────────────────────
const toggleStatus = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, isActive: true } });
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });

    // Si se va a inhabilitar, verificar que no tenga productos activos
    if (category.isActive) {
      const activeCount = await prisma.product.count({ where: { categoryId, isActive: true } });
      if (activeCount > 0) {
        return res.status(409).json({ success: false, message: `No puedes inhabilitar esta categoría porque tiene ${activeCount} producto(s) activo(s)` });
      }
    }

    const updated = await prisma.category.update({ where: { id: categoryId }, data: { isActive: !category.isActive } });
    const msg = updated.isActive ? 'Categoría activada' : 'Categoría desactivada';
    return res.status(200).json({ success: true, message: msg, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, toggleStatus, remove };