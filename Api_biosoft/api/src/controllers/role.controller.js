// src/controllers/role.controller.js

const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');

const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional().nullable(),
});

const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(200).optional().nullable(),
});

// ─── GET /api/roles ────────────────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });

    const rolesWithActive = await Promise.all(
      roles.map(async (role) => {
        const activeUsers = await prisma.user.count({
          where: { roleId: role.id, isActive: true },
        });
        return { ...role, activeUsers };
      })
    );

    return res.status(200).json({ success: true, total: rolesWithActive.length, data: rolesWithActive });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/roles/:id ────────────────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const roleId = Number(req.params.id);

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        users: { select: { id: true, name: true, email: true } },
        permissions: {
          select: {
            permission: { select: { id: true, name: true, resource: true, action: true, description: true } },
          },
        },
      },
    });

    if (!role) return res.status(404).json({ success: false, message: 'Rol no encontrado' });

    // Aplanar permisos para facilitar el uso en el frontend
    const data = {
      ...role,
      // Mantener rolePermissions en el formato que espera el frontend
      rolePermissions: role.permissions.map(rp => ({ permission: rp.permission })),
      permissions: role.permissions.map(rp => rp.permission),
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/roles/:id/status ──────────────────────────────────────────────
const toggleStatus = async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, isActive: true, _count: { select: { users: true } } },
    });
    if (!role) return res.status(404).json({ success: false, message: 'Rol no encontrado' });

    if (role.name.toLowerCase() === 'administrador') {
      return res.status(403).json({ success: false, message: 'El rol administrador no puede ser modificado' });
    }

    // No se puede desactivar un rol que tiene usuarios asignados
    if (role.isActive && role._count.users > 0) {
      return res.status(409).json({ success: false, message: `No se puede desactivar un rol que tiene ${role._count.users} usuario(s) asignado(s)` });
    }

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: { isActive: !role.isActive },
      select: { id: true, name: true, isActive: true },
    });

    const msg = updated.isActive ? 'Rol activado correctamente' : 'Rol desactivado correctamente';
    return res.status(200).json({ success: true, message: msg, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/roles ───────────────────────────────────────────────────────────
const create = async (req, res) => {
  try {
    const parsed = validate(createRoleSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, description } = parsed.data;
    const normalizedName = name.toLowerCase().trim();

    const existing = await prisma.role.findFirst({ where: { name: { equals: normalizedName, mode: 'insensitive' } } });
    if (existing) return res.status(409).json({ success: false, message: `El rol "${normalizedName}" ya existe` });

    const role = await prisma.role.create({
      data: { name: normalizedName, description: description ?? undefined },
    });

    return res.status(201).json({
      success: true,
      message: 'Rol creado correctamente',
      data: role,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/roles/:id ────────────────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const parsed = validate(updateRoleSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, description } = parsed.data;

    const role = await prisma.role.findUnique({ where: { id: Number(req.params.id) } });
    if (!role) return res.status(404).json({ success: false, message: 'Rol no encontrado' });

    if (role.name.toLowerCase() === 'administrador') {
      return res.status(403).json({ success: false, message: 'El rol administrador no puede ser modificado' });
    }

    if (!role.isActive) {
      return res.status(403).json({ success: false, message: 'No puedes editar un rol inactivo' });
    }

    if (name && name.toLowerCase().trim() !== role.name.toLowerCase()) {
      const existing = await prisma.role.findFirst({ where: { name: { equals: name.trim(), mode: 'insensitive' } } });
      if (existing) return res.status(409).json({ success: false, message: `El rol "${name.trim()}" ya existe` });
    }

    const updated = await prisma.role.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name ? name.toLowerCase().trim() : undefined,
        description: description ?? undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Rol actualizado correctamente',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/roles/:id ────────────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) return res.status(404).json({ success: false, message: 'Rol no encontrado' });

    if (role.name.toLowerCase() === 'administrador') {
      return res.status(403).json({ success: false, message: 'El rol administrador no puede ser eliminado' });
    }

    const usersCount = await prisma.user.count({ where: { roleId } });
    if (usersCount > 0) {
      return res.status(409).json({
        success: false,
        message: `No puedes eliminar este rol porque tiene ${usersCount} usuario(s) asignado(s)`,
      });
    }

    await prisma.role.delete({ where: { id: roleId } });
    return res.status(200).json({ success: true, message: 'Rol eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const assignPermission = async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);
    const permissionId = Number(req.body.permissionId);

    if (!permissionId || Number.isNaN(permissionId)) {
      return res.status(400).json({ success: false, message: 'permissionId es requerido' });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, isActive: true } });
    if (!role) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    if (!role.isActive) return res.status(403).json({ success: false, message: 'No puedes modificar permisos de un rol inactivo' });

    const permission = await prisma.permission.findUnique({ where: { id: permissionId }, select: { id: true } });
    if (!permission) return res.status(404).json({ success: false, message: 'Permiso no encontrado' });

    await prisma.rolePermission.create({ data: { roleId, permissionId } });

    return res.status(201).json({ success: true, message: 'Permiso asignado al rol correctamente' });
  } catch (error) {
    if (error && error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'El permiso ya está asignado a este rol' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removePermission = async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);
    const permissionId = Number(req.params.permissionId);

    if (!roleId || !permissionId) {
      return res.status(400).json({ success: false, message: 'roleId y permissionId son requeridos' });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, isActive: true } });
    if (!role) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    if (!role.isActive) return res.status(403).json({ success: false, message: 'No puedes modificar permisos de un rol inactivo' });

    await prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });

    return res.status(200).json({ success: true, message: 'Permiso quitado del rol correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, toggleStatus, assignPermission, removePermission };