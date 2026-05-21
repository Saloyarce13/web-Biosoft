const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');
const { validateEmailExists } = require('../lib/validateEmail');

const updateUserSchema = z.object({
  name:           z.string().min(2).max(100).optional(),
  email:          z.string().email().optional(),
  roleId:         z.coerce.number().int().positive().optional(),
  isActive:       z.coerce.boolean().optional(),
  documentType:   z.enum(['CC', 'CE', 'PAS', 'NIT', 'TI', 'PA'], { message: 'Tipo de documento inválido' }).optional().nullable(),
  documentNumber: z.string()
    .regex(/^\d{8,15}$/, 'El número de documento debe tener entre 8 y 15 dígitos numéricos')
    .optional()
    .nullable(),
  phone:          z.string().regex(/^\+?\d{10,20}$/, 'El teléfono debe tener entre 10 y 20 dígitos (puede incluir +)').max(20).optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72),
});

// POST /api/users — crear usuario directamente (solo admin, activo sin verificación de email)
const create = async (req, res) => {
  try {
    const { name, email, password, roleId, phone, documentType, documentNumber, position, salary, hireDate, birthDate, address } = req.body;
    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ success: false, message: 'name, email, password y roleId son requeridos' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'El email ya está registrado' });

    // Validar que el dominio del email existe
    const emailCheck = await validateEmailExists(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, message: emailCheck.message });
    }

    const role = await prisma.role.findUnique({ where: { id: Number(roleId) } });
    if (!role) return res.status(400).json({ success: false, message: 'El rol no existe' });
    if (!role.isActive) return res.status(409).json({ success: false, message: `El rol "${role.name}" está desactivado y no puede ser asignado` });

    const passwordHash = await bcrypt.hash(password, 10);
    const roleName = role.name.toLowerCase();

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, password: passwordHash, roleId: Number(roleId), isActive: true, emailVerified: true },
        select: { id: true, name: true, email: true, isActive: true, role: { select: { id: true, name: true } } },
      });

      // Si el rol es cliente o user → crear registro en Client
      if (['user', 'cliente'].includes(roleName)) {
        const existingClient = await tx.client.findUnique({ where: { email } });
        if (!existingClient) {
          await tx.client.create({
            data: {
              name,
              email,
              phone: phone || undefined,
              documentType: documentType || undefined,
              documentNumber: documentNumber || undefined,
              isActive: true,
            },
          });
        }
      }

      // Si el rol es de empleado (vendedor, bodega, contador, etc.) → crear registro en Employee
      const employeeRoles = ['vendedor', 'bodega', 'contador', 'administrador'];
      if (employeeRoles.includes(roleName)) {
        const existingEmp = await tx.employee.findUnique({ where: { email } });
        if (!existingEmp) {
          await tx.employee.create({
            data: {
              fullName: name,
              email,
              phone: phone || undefined,
              documentType: documentType || undefined,
              documentNumber: documentNumber || undefined,
              address: address || undefined,
              birthDate: birthDate ? new Date(birthDate) : undefined,
              position: position || role.name,
              salary: salary ? Number(salary) : undefined,
              hireDate: hireDate ? new Date(hireDate) : undefined,
              password: passwordHash,
              isActive: true,
            },
          });
        }
      }

      return newUser;
    });

    return res.status(201).json({ success: true, message: 'Usuario creado correctamente', data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/consolidated — todos: usuarios del sistema + empleados + clientes + proveedores
const getConsolidated = async (req, res) => {
  try {
    const [users, employees, clients, providers] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        where: { role: { isActive: true } },
        // Incluir phone directamente de users
        select: { id: true, name: true, email: true, phone: true, isActive: true, role: { select: { name: true } }, createdAt: true },
      }),
      prisma.employee.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, phone: true, documentType: true, documentNumber: true, position: true, isActive: true, createdAt: true },
      }),
      prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, documentType: true, documentNumber: true, isActive: true, createdAt: true },
      }),
      prisma.provider.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true },
      }),
    ]);

    // Índices por email para cruzar documentos
    const empByEmail = new Map(employees.map(e => [e.email, e]));
    const cliByEmail = new Map(clients.map(c => [c.email, c]));

    // Emails de usuarios con rol activo
    const activeRoleUserEmails = new Set(users.map(u => u.email).filter(Boolean));

    // Empleados SIN usuario en el sistema (para no duplicar)
    const filteredEmployees = employees.filter(e => e.email && !activeRoleUserEmails.has(e.email));

    // Clientes SIN usuario en el sistema (para no duplicar)
    const filteredClients = clients.filter(c => !c.email || !activeRoleUserEmails.has(c.email));

    const EMPLOYEE_ROLES = ['administrador', 'vendedor', 'bodega', 'contador', 'empleado'];

    const result = [
      ...users.map(u => {
        // Buscar documento y teléfono en Employee o Client por email
        const emp = u.email ? empByEmail.get(u.email) : null;
        const cli = u.email ? cliByEmail.get(u.email) : null;
        const docSource = emp || cli;

        // Teléfono: prioridad → employees/clients → users directamente
        const rawPhone = docSource?.phone || u.phone || '';
        const phone = rawPhone && !rawPhone.includes('@') ? rawPhone : '';
        // Determinar origen: si el rol es de empleado, mostrar como Empleado
        const roleName = (u.role?.name || '').toLowerCase();
        const origin = EMPLOYEE_ROLES.includes(roleName) ? 'Empleado' : 'Usuario';
        return {
          id: `user-${u.id}`,
          name: u.name,
          email: u.email || '',
          phone,
          documentType: docSource?.documentType || '',
          documentNumber: docSource?.documentNumber || '',
          role: u.role?.name || 'Sin rol',
          origin,
          isActive: u.isActive,
          createdAt: u.createdAt,
        };
      }),
      ...filteredEmployees.map(e => ({
        id: `emp-${e.id}`,
        name: e.fullName,
        email: e.email || '',
        phone: e.phone || '',
        documentType: e.documentType || '',
        documentNumber: e.documentNumber || '',
        role: e.position || 'Empleado',
        origin: 'Empleado',
        isActive: e.isActive,
        createdAt: e.createdAt,
      })),
      ...filteredClients.map(c => ({
        id: `cli-${c.id}`,
        name: c.name,
        email: c.email || '',
        phone: c.phone || '',
        documentType: c.documentType || '',
        documentNumber: c.documentNumber || '',
        role: 'Cliente',
        origin: 'Cliente',
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
      ...providers.map(p => ({
        id: `prov-${p.id}`,
        name: p.name,
        email: p.email || '',
        phone: p.phone || '',
        documentType: '',
        documentNumber: '',
        role: 'Proveedor',
        origin: 'Proveedor',
        isActive: p.isActive,
        createdAt: p.createdAt,
      })),
    ];

    return res.status(200).json({ success: true, total: result.length, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users
const getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        role: { isActive: true }, // solo usuarios con rol activo
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({ success: true, total: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id
const getOne = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
        role: { select: { id: true, name: true, description: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id — editar nombre, email, rol, estado
const update = async (req, res) => {
  try {
    const parsed = validate(updateUserSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { name, email, roleId, isActive, documentType, documentNumber, phone } = parsed.data;

    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({ success: false, message: 'No se enviaron campos para actualizar' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      include: { role: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    if (email && email !== user.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) return res.status(409).json({ success: false, message: 'El email ya está en uso' });
    }

    let newRole = user.role;
    if (roleId) {
      const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
      if (!roleExists) return res.status(400).json({ success: false, message: 'El rol no existe' });
      if (!roleExists.isActive) return res.status(409).json({ success: false, message: `El rol "${roleExists.name}" está desactivado y no puede ser asignado` });
      newRole = roleExists;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: Number(req.params.id) },
        data: {
          name: name ?? undefined,
          email: email ?? undefined,
          roleId: roleId ?? undefined,
          isActive: isActive ?? undefined,
        },
        select: {
          id: true, name: true, email: true, isActive: true, emailVerified: true,
          role: { select: { id: true, name: true } }, createdAt: true, updatedAt: true,
        },
      });

      const effectiveEmail = email || user.email;
      const effectiveName = name || user.name;
      const roleName = newRole.name.toLowerCase();

      // Sincronizar documento/teléfono en Employee o Client si existen
      const docUpdate = {};
      if (documentType  !== undefined) docUpdate.documentType  = documentType;
      if (documentNumber !== undefined) docUpdate.documentNumber = documentNumber;
      if (phone          !== undefined) docUpdate.phone          = phone;

      if (Object.keys(docUpdate).length > 0) {
        await tx.employee.updateMany({ where: { email: effectiveEmail }, data: docUpdate });
        await tx.client.updateMany({ where: { email: effectiveEmail }, data: docUpdate });
      }

      // Sincronizar estado en Client si existe
      if (isActive !== undefined) {
        await tx.client.updateMany({ where: { email: effectiveEmail }, data: { isActive } });
        await tx.employee.updateMany({ where: { email: effectiveEmail }, data: { isActive } });
      }

      // Si cambió a rol cliente → crear Client si no existe
      if (roleId && ['user', 'cliente'].includes(roleName)) {
        const existingClient = await tx.client.findUnique({ where: { email: effectiveEmail } });
        if (!existingClient) {
          await tx.client.create({ data: { name: effectiveName, email: effectiveEmail, isActive: true } });
        }
      }

      // Si cambió a rol empleado → crear Employee si no existe
      const employeeRoles = ['vendedor', 'bodega', 'contador', 'administrador'];
      if (roleId && employeeRoles.includes(roleName)) {
        const existingEmp = await tx.employee.findUnique({ where: { email: effectiveEmail } });
        if (!existingEmp) {
          await tx.employee.create({
            data: { fullName: effectiveName, email: effectiveEmail, position: newRole.name, isActive: true, password: user.password },
          });
        }
      }

      return updatedUser;
    });

    return res.status(200).json({ success: true, message: 'Usuario actualizado correctamente', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/status — alternar activo/inactivo
const toggleStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, isActive: true, name: true, email: true, role: { select: { name: true } } },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    // Prevenir desactivar el último administrador activo
    if (user.isActive && user.role?.name?.toLowerCase() === 'administrador') {
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

    const newStatus = !user.isActive;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: Number(req.params.id) },
        data: { isActive: newStatus },
        select: {
          id: true, name: true, email: true, isActive: true, emailVerified: true,
          role: { select: { id: true, name: true } }, createdAt: true, updatedAt: true,
        },
      });
      // Sincronizar con Employee y Client por email
      if (user.email) {
        await tx.employee.updateMany({ where: { email: user.email }, data: { isActive: newStatus } });
        await tx.client.updateMany({ where: { email: user.email }, data: { isActive: newStatus } });
      }
      return u;
    });

    const msg = updated.isActive ? 'Usuario activado correctamente' : 'Usuario desactivado correctamente';
    return res.status(200).json({ success: true, message: msg, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/password — cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const parsed = validate(changePasswordSchema, req.body);
    if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, password: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: Number(req.params.id) }, data: { password: hashedNew } });

    return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/:id/reset-password — reset de contraseña por admin (sin requerir contraseña actual)
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { password: passwordHash, isActive: true, emailVerified: true },
    });

    return res.status(200).json({ success: true, message: 'Contraseña reseteada correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id — eliminación permanente (solo admin)
const remove = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    // Verificar si tiene ventas o compras asociadas
    const [salesCount, purchasesCount] = await Promise.all([
      prisma.sale.count({ where: { createdByUserId: user.id } }),
      prisma.purchase.count({ where: { createdByUserId: user.id } }),
    ]);

    if (salesCount > 0 || purchasesCount > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar a "${user.name}" porque tiene ${salesCount} venta(s) y ${purchasesCount} compra(s) registradas. Puedes desactivarlo en su lugar.`,
      });
    }

    await prisma.user.delete({ where: { id: Number(req.params.id) } });

    return res.status(200).json({ success: true, message: `Usuario "${user.name}" eliminado correctamente` });
  } catch (error) {
    if (error.code === 'P2003' || error.message?.includes('foreign key')) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar este usuario porque tiene registros asociados. Desactívalo en su lugar.',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/users/me/profile — el usuario actualiza su propio nombre (sin requerir rol admin)
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'No autorizado' });
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    const updated = await prisma.user.update({
      where: { id: Number(userId) },
      data: { name: String(name).trim() },
      select: { id: true, name: true, email: true },
    });
    // Sincronizar nombre en Client si existe
    await prisma.client.updateMany({ where: { email: updated.email }, data: { name: updated.name } });
    return res.status(200).json({ success: true, message: 'Perfil actualizado', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, getConsolidated, create, update, updateMyProfile, toggleStatus, changePassword, resetPassword, remove };
