const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');

// Regex de validaciones
const PHONE_REGEX = /^\d+$/;                                      // solo dígitos, sin espacios
const DOC_REGEX   = /^\d{1,15}$/;                                 // 1-15 dígitos numéricos
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/; // mayúscula + número + especial

const isAdult = (val) => {
  const birth = new Date(val);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  return age >= 18;
};

const createEmployeeSchema = z.object({
  fullName:       z.string().min(2).max(120),
  email:          z.string().email(),
  phone:          z.string().regex(PHONE_REGEX, 'El teléfono solo acepta números sin espacios').max(30),
  documentType:   z.enum(['CC', 'CE', 'PAS', 'NIT'], { message: 'Tipo de documento inválido' }),
  documentNumber: z.string()
    .min(1, 'El número de documento es obligatorio')
    .max(15, 'Máximo 15 caracteres')
    .regex(/^\d+$/, 'Solo se aceptan caracteres numéricos'),
  address:        z.string().max(250).optional().nullable(),
  birthDate:      z.string()
    .min(1, 'La fecha de nacimiento es obligatoria')
    .refine(isAdult, 'El empleado debe ser mayor de 18 años'),
  position:       z.string().max(80).optional().nullable(),
  salary:         z.coerce.number().positive('El sueldo es obligatorio y debe ser mayor a 0'),
  hireDate:       z.string().optional().nullable(),
  password:       z.string().min(1, 'La contraseña es obligatoria'),
});

const updateEmployeeSchema = z.object({
  fullName:       z.string().min(2).max(120).optional(),
  email:          z.string().email().optional(),
  phone:          z.string().regex(PHONE_REGEX, 'El teléfono solo acepta números sin espacios').max(30).optional().nullable(),
  documentType:   z.enum(['CC', 'CE', 'PAS', 'NIT']).optional().nullable(),
  documentNumber: z.string()
    .min(1).max(15)
    .regex(/^\d+$/, 'Solo se aceptan caracteres numéricos')
    .optional().nullable(),
  address:        z.string().max(250).optional().nullable(),
  birthDate:      z.string()
    .refine(val => !val || isAdult(val), 'El empleado debe ser mayor de 18 años')
    .optional().nullable(),
  position:       z.string().max(80).optional().nullable(),
  salary:         z.coerce.number().nonnegative().optional().nullable(),
  hireDate:       z.string().optional().nullable(),
  isActive:       z.coerce.boolean().optional(),
  password:       z.string().min(1).optional(),
});

const getAll = async (req, res) => {
  try {
    // Obtener empleados cuyo usuario asociado tiene rol activo
    // (o empleados sin usuario asociado, que se muestran siempre)
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Filtrar: si el empleado tiene email y usuario, verificar que el rol esté activo
    const activeRoleEmails = new Set(
      (await prisma.user.findMany({
        where: { role: { isActive: true } },
        select: { email: true },
      })).map(u => u.email)
    );

    const filtered = employees.filter(e => {
      if (!e.email) return true; // sin usuario asociado, mostrar siempre
      return activeRoleEmails.has(e.email);
    });

    return res.status(200).json({ success: true, total: filtered.length, data: filtered });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: Number(req.params.id) } });
    if (!employee) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    return res.status(200).json({ success: true, data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const parsed = validate(createEmployeeSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { fullName, email, phone, documentType, documentNumber, address, birthDate, position, salary, hireDate, password } = parsed.data;

    if (email) {
      const existing = await prisma.employee.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ success: false, message: 'Este email de empleado ya existe' });
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(409).json({ success: false, message: 'Ya existe un usuario con este email' });
    }

    // Validar documento duplicado
    if (documentNumber) {
      const existingDoc = await prisma.employee.findFirst({ where: { documentNumber } });
      if (existingDoc) return res.status(409).json({ success: false, message: 'Ya existe un empleado con este número de documento' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Buscar o crear el rol que corresponde al cargo del empleado
    const positionLower = (position || 'vendedor').toLowerCase();
    let roleName = positionLower; // vendedor, bodega, contador, etc.
    let role = await prisma.role.findFirst({ where: { name: { equals: roleName, mode: 'insensitive' } } });
    if (!role) {
      // Si no existe el rol, crearlo sin permisos (el admin los asigna después)
      role = await prisma.role.create({ data: { name: roleName, description: `Rol ${position}` } });
    }

    // Crear empleado y usuario en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          fullName,
          email,
          phone: phone ?? undefined,
          documentType: documentType ?? undefined,
          documentNumber: documentNumber ?? undefined,
          address: address ?? undefined,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          position: position ?? undefined,
          salary: salary ?? undefined,
          hireDate: hireDate ? new Date(hireDate) : undefined,
          password: passwordHash,
          isActive: true,
        },
      });

      // Crear User para que el empleado pueda iniciar sesión
      if (email) {
        await tx.user.create({
          data: {
            name: fullName,
            email,
            passwordHash,
            roleId: role.id,
            isActive: true,
            emailVerified: true,
          },
        });
      }

      return employee;
    });

    return res.status(201).json({ success: true, message: 'Empleado registrado correctamente', data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const parsed = validate(updateEmployeeSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const employeeId = Number(req.params.id);
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });

    const { fullName, email, phone, documentType, documentNumber, address, birthDate, position, salary, hireDate, isActive, password } = parsed.data;

    if (email && email !== employee.email) {
      const existing = await prisma.employee.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ success: false, message: 'Este email de empleado ya existe' });
    }

    // Validar documento duplicado al editar (ignorar el propio registro)
    if (documentNumber && documentNumber !== employee.documentNumber) {
      const existingDoc = await prisma.employee.findFirst({ where: { documentNumber, NOT: { id: employeeId } } });
      if (existingDoc) return res.status(409).json({ success: false, message: 'Ya existe un empleado con este número de documento' });
    }

    const updateData = {
      fullName:       fullName ?? undefined,
      email:          email ?? undefined,
      phone:          phone ?? undefined,
      documentType:   documentType ?? undefined,
      documentNumber: documentNumber ?? undefined,
      address:        address ?? undefined,
      birthDate:      birthDate ? new Date(birthDate) : undefined,
      position:       position ?? undefined,
      salary:         salary ?? undefined,
      hireDate:       hireDate ? new Date(hireDate) : undefined,
      isActive:       isActive ?? undefined,
    };

    let newPasswordHash;
    if (password) {
      newPasswordHash = await bcrypt.hash(password, 10);
      updateData.password = newPasswordHash;
    }

    const updated = await prisma.employee.update({ where: { id: employeeId }, data: updateData });

    // Sincronizar el User asociado si existe
    const userEmail = email || employee.email;
    if (userEmail) {
      const linkedUser = await prisma.user.findUnique({ where: { email: userEmail } });
      if (linkedUser) {
        const userUpdate = {};
        if (fullName) userUpdate.name = fullName;
        if (isActive !== undefined) userUpdate.isActive = isActive;
        if (newPasswordHash) userUpdate.passwordHash = newPasswordHash;
        // Si cambió el cargo, actualizar el rol del usuario
        if (position) {
          const positionLower = position.toLowerCase();
          const role = await prisma.role.findFirst({ where: { name: { equals: positionLower, mode: 'insensitive' } } });
          if (role) userUpdate.roleId = role.id;
        }
        if (Object.keys(userUpdate).length > 0) {
          await prisma.user.update({ where: { email: userEmail }, data: userUpdate });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Empleado actualizado correctamente', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, isActive: true, email: true } });
    if (!employee) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });

    // Si se va a desactivar, verificar si es el último admin
    if (employee.isActive && employee.email) {
      const linkedUser = await prisma.user.findUnique({
        where: { email: employee.email },
        select: { id: true, role: { select: { name: true } } },
      });
      if (linkedUser?.role?.name?.toLowerCase() === 'administrador') {
        const activeAdmins = await prisma.user.count({
          where: { isActive: true, role: { name: { equals: 'administrador', mode: 'insensitive' } } },
        });
        if (activeAdmins <= 1) {
          return res.status(409).json({
            success: false,
            message: 'No puedes desactivar al único administrador activo del sistema.',
          });
        }
      }
    }

    const newStatus = !employee.isActive;
    const updated = await prisma.employee.update({ where: { id: employeeId }, data: { isActive: newStatus } });
    // Sincronizar el User
    if (employee.email) {
      await prisma.user.updateMany({ where: { email: employee.email }, data: { isActive: newStatus } });
    }
    const msg = newStatus ? 'Empleado activado correctamente' : 'Empleado desactivado correctamente';
    return res.status(200).json({ success: true, message: msg, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
    if (!employee) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    await prisma.employee.delete({ where: { id: employeeId } });
    return res.status(200).json({ success: true, message: 'Empleado eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, toggleStatus, remove };
