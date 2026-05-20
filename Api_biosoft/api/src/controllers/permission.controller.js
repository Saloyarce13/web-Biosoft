const { z } = require('zod');

const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');

const permissionCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(200).optional().nullable(),
});

const permissionUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(200).optional().nullable(),
});

const getAll = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, createdAt: true },
    });
    return res.status(200).json({ success: true, total: permissions.length, data: permissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const permission = await prisma.permission.findUnique({
      where: { id: Number(req.params.id) },
      include: { roles: { include: { role: true } } },
    });
    if (!permission) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
    return res.status(200).json({ success: true, data: permission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const parsed = validate(permissionCreateSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, description } = parsed.data;
    const existing = await prisma.permission.findUnique({ where: { name } });
    if (existing) return res.status(409).json({ success: false, message: 'Este permiso ya existe' });

    const permission = await prisma.permission.create({
      data: { name, description: description ?? undefined },
    });

    return res.status(201).json({ success: true, message: 'Permiso creado correctamente', data: permission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const parsed = validate(permissionUpdateSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, description } = parsed.data;

    const permission = await prisma.permission.findUnique({ where: { id: Number(req.params.id) } });
    if (!permission) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });

    if (name && name !== permission.name) {
      const existing = await prisma.permission.findUnique({ where: { name } });
      if (existing) return res.status(409).json({ success: false, message: 'Este permiso ya existe' });
    }

    const updated = await prisma.permission.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
      },
    });

    return res.status(200).json({ success: true, message: 'Permiso actualizado correctamente', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const permissionId = Number(req.params.id);
    const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });

    // No permitimos borrar si está asignado a roles
    const assignments = await prisma.rolePermission.count({ where: { permissionId } });
    if (assignments > 0) {
      return res.status(409).json({
        success: false,
        message: 'No puedes eliminar este permiso porque está asignado a roles',
      });
    }

    await prisma.permission.delete({ where: { id: permissionId } });
    return res.status(200).json({ success: true, message: 'Permiso eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };

