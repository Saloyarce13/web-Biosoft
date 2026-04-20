const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');

const createClientSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  phone: z.string().max(30).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  address: z.string().max(250).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  documentType: z.string().max(10).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  documentNumber: z.string().max(50).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
});

const updateClientSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  email: z.string().email().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  phone: z.string().max(30).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  address: z.string().max(250).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  documentType: z.string().max(10).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  documentNumber: z.string().max(50).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  isActive: z.coerce.boolean().optional(),
});

const getAll = async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};

    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { documentNumber: { contains: search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, total: clients.length, data: clients });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: Number(req.params.id) } });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    return res.status(200).json({ success: true, data: client });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const parsed = validate(createClientSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, email, phone, address, documentType, documentNumber } = parsed.data;

    if (email) {
      const existing = await prisma.client.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ success: false, message: 'Este email de cliente ya existe' });
    }

    // Validar documento duplicado
    if (documentNumber) {
      const existingDoc = await prisma.client.findFirst({ where: { documentNumber } });
      if (existingDoc) return res.status(409).json({ success: false, message: 'Ya existe un cliente con este número de documento' });
    }

    const client = await prisma.client.create({
      data: {
        name,
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(documentType && { documentType }),
        ...(documentNumber && { documentNumber }),
        isActive: true,
      },
    });

    return res.status(201).json({ success: true, message: 'Cliente registrado correctamente', data: client });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const parsed = validate(updateClientSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const clientId = Number(req.params.id);
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    const { name, email, phone, address, documentType, documentNumber, isActive } = parsed.data;

    if (email && email !== client.email) {
      const existing = await prisma.client.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ success: false, message: 'Este email de cliente ya existe' });
    }

    // Validar documento duplicado al actualizar
    if (documentNumber && documentNumber !== client.documentNumber) {
      const existingDoc = await prisma.client.findFirst({ where: { documentNumber, NOT: { id: clientId } } });
      if (existingDoc) return res.status(409).json({ success: false, message: 'Ya existe un cliente con este número de documento' });
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(documentType !== undefined && { documentType }),
        ...(documentNumber !== undefined && { documentNumber }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.status(200).json({ success: true, message: 'Cliente actualizado correctamente', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Cambiar estado activo/inactivo
const toggleStatus = async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { isActive: !client.isActive },
    });

    const msg = updated.isActive ? 'Cliente activado correctamente' : 'Cliente desactivado correctamente';
    return res.status(200).json({ success: true, message: msg, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    await prisma.client.delete({ where: { id: clientId } });
    return res.status(200).json({ success: true, message: 'Cliente eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, toggleStatus, remove };
