const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');
const { validateEmailExists } = require('../lib/validateEmail');

// Regex de validaciones
const DOC_NUMBER_REGEX = /^\d{8,15}$/; // 8-15 dígitos numéricos
const PHONE_REGEX      = /^\+?\d{10,20}$/; // 10-20 dígitos, permite '+' al inicio

// Tipos de documento válidos (alineados con el frontend)
const VALID_DOC_TYPES = ['CC', 'CE', 'PAS', 'NIT', 'TI', 'PA'];

const createClientSchema = z.object({
  name:           z.string().min(2).max(150),
  email:          z.string().email().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  phone:          z.string().regex(PHONE_REGEX, 'El teléfono debe tener entre 10 y 20 dígitos (puede incluir +)').max(20).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  address:        z.string().max(250).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  documentType:   z.enum(VALID_DOC_TYPES, { message: 'Tipo de documento inválido' }).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  documentNumber: z.string()
    .regex(DOC_NUMBER_REGEX, 'El número de documento debe tener entre 8 y 15 dígitos numéricos')
    .optional()
    .or(z.literal(''))
    .transform(v => v === '' ? undefined : v),
});

const updateClientSchema = z.object({
  name:           z.string().min(2).max(150).optional(),
  email:          z.string().email().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  phone:          z.string().regex(PHONE_REGEX, 'El teléfono debe tener entre 10 y 20 dígitos (puede incluir +)').max(20).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  address:        z.string().max(250).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  documentType:   z.enum(VALID_DOC_TYPES, { message: 'Tipo de documento inválido' }).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  documentNumber: z.string()
    .regex(DOC_NUMBER_REGEX, 'El número de documento debe tener entre 8 y 15 dígitos numéricos')
    .optional()
    .or(z.literal(''))
    .transform(v => v === '' ? undefined : v),
  isActive:       z.coerce.boolean().optional(),
});

// Obtener o crear el rol "Cliente"
const getClientRole = async () => {
  let role = await prisma.role.findFirst({ where: { name: 'Cliente' } });
  if (!role) {
    role = await prisma.role.create({
      data: { name: 'Cliente', description: 'Acceso al catálogo y gestión de sus propios pedidos', isActive: true },
    });
  }
  return role;
};

const getAll = async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};
    if (status === 'active')   where.isActive = true;
    else if (status === 'inactive') where.isActive = false;
    if (search) {
      where.OR = [
        { name:           { contains: search, mode: 'insensitive' } },
        { email:          { contains: search, mode: 'insensitive' } },
        { phone:          { contains: search } },
        { documentNumber: { contains: search } },
      ];
    }
    const clients = await prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } });
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
      const existingClient = await prisma.client.findUnique({ where: { email } });
      if (existingClient) return res.status(409).json({ success: false, message: 'Este email de cliente ya existe' });
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(409).json({ success: false, message: 'Ya existe un usuario con este email' });

      // Validar que el dominio del email existe
      const emailCheck = await validateEmailExists(email);
      if (!emailCheck.valid) {
        return res.status(400).json({ success: false, message: emailCheck.message });
      }
    }
    if (documentNumber) {
      const existingDoc = await prisma.client.findFirst({ where: { documentNumber } });
      if (existingDoc) return res.status(409).json({ success: false, message: 'Ya existe un cliente con este número de documento' });
    }

    const clientRole = await getClientRole();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear en tabla clients
      const client = await tx.client.create({
        data: {
          name,
          ...(email          && { email }),
          ...(phone          && { phone }),
          ...(address        && { address }),
          ...(documentType   && { documentType }),
          ...(documentNumber && { documentNumber }),
          isActive: true,
        },
      });

      // 2. Crear en tabla users (para que pueda iniciar sesión)
      if (email) {
        const tempPassword = await bcrypt.hash(documentNumber || 'Cliente2024*', 10);
        await tx.user.create({
          data: {
            name,
            email,
            password:      tempPassword,
            phone:         phone   || null,
            address:       address || null,
            roleId:        clientRole.id,
            isActive:      true,
            emailVerified: false,
          },
        });
      }

      return client;
    });

    return res.status(201).json({ success: true, message: 'Cliente registrado correctamente', data: result });
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
    if (documentNumber && documentNumber !== client.documentNumber) {
      const existingDoc = await prisma.client.findFirst({ where: { documentNumber, NOT: { id: clientId } } });
      if (existingDoc) return res.status(409).json({ success: false, message: 'Ya existe un cliente con este número de documento' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedClient = await tx.client.update({
        where: { id: clientId },
        data: {
          ...(name           !== undefined && { name }),
          ...(email          !== undefined && { email }),
          ...(phone          !== undefined && { phone }),
          ...(address        !== undefined && { address }),
          ...(documentType   !== undefined && { documentType }),
          ...(documentNumber !== undefined && { documentNumber }),
          ...(isActive       !== undefined && { isActive }),
        },
      });

      // Sincronizar usuario asociado
      const lookupEmail = client.email;
      if (lookupEmail) {
        const linkedUser = await tx.user.findUnique({ where: { email: lookupEmail } });
        if (linkedUser) {
          await tx.user.update({
            where: { email: lookupEmail },
            data: {
              ...(name     && { name }),
              ...(phone    !== undefined && { phone }),
              ...(address  !== undefined && { address }),
              ...(isActive !== undefined && { isActive }),
            },
          });
        }
      }

      return updatedClient;
    });

    return res.status(200).json({ success: true, message: 'Cliente actualizado correctamente', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    const newStatus = !client.isActive;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedClient = await tx.client.update({ where: { id: clientId }, data: { isActive: newStatus } });
      // Sincronizar usuario
      if (client.email) {
        await tx.user.updateMany({ where: { email: client.email }, data: { isActive: newStatus } });
      }
      return updatedClient;
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
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, email: true, name: true } });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    // Verificar si tiene ventas asociadas
    const salesCount = await prisma.sale.count({ where: { clientId } });
    if (salesCount > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar a "${client.name}" porque tiene ${salesCount} venta(s) registrada(s). Puedes desactivarlo en su lugar.`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.client.delete({ where: { id: clientId } });
      // Eliminar usuario asociado si existe
      if (client.email) {
        await tx.user.deleteMany({ where: { email: client.email } });
      }
    });

    return res.status(200).json({ success: true, message: 'Cliente eliminado correctamente' });
  } catch (error) {
    // Capturar error de FK por si acaso
    if (error.code === 'P2003' || error.message?.includes('foreign key')) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar este cliente porque tiene registros asociados (ventas, pedidos). Desactívalo en su lugar.',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, toggleStatus, remove };
