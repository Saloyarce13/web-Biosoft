// src/controllers/auth.controller.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} = require('../validators/auth.validators');
const { generateNumericCode, hashCodeSha256 } = require('../lib/code');
const { sendEmailWithCode, sendWelcomeEmail } = require('../services/email.service');

const generateToken = ({ user, permissions }) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const EMAIL_TTL_MINUTES = Number(process.env.EMAIL_CODE_TTL_MINUTES || 15);
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 15);
const CODE_MAX_ATTEMPTS = 5;

// ── Bloqueo de login por intentos fallidos (en memoria) ───────────────────────
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_MINUTES = 5;
const loginAttempts = new Map(); // email -> { count, blockedUntil }

const checkLoginBlock = (email) => {
  const entry = loginAttempts.get(email);
  if (!entry) return null;
  if (entry.blockedUntil && entry.blockedUntil > Date.now()) {
    const secsLeft = Math.ceil((entry.blockedUntil - Date.now()) / 1000);
    return { blocked: true, secsLeft };
  }
  return null;
};

const recordLoginFailure = (email) => {
  const entry = loginAttempts.get(email) || { count: 0, blockedUntil: null };
  entry.count += 1;
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + LOGIN_BLOCK_MINUTES * 60_000;
    entry.count = 0;
  }
  loginAttempts.set(email, entry);
  return entry;
};

const clearLoginAttempts = (email) => loginAttempts.delete(email);

const register = async (req, res) => {
  const parsed = validate(registerSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

  const { name, email, password, roleId, phone, documentType, documentNumber } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'El email ya está registrado' });
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return res.status(400).json({ success: false, message: 'El rol especificado no existe' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      roleId,
      isActive: true,
      emailVerified: true,
    },
    select: { id: true, name: true, email: true },
  });

  const isClientRole = ['user', 'cliente'].includes(role.name.toLowerCase());
  if (isClientRole) {
    await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || undefined,
        address: undefined,
        documentType: documentType || undefined,
        documentNumber: documentNumber || undefined,
        isActive: true,
      },
    });
  }

  // Solo enviar correo de bienvenida — sin código de verificación
  try {
    await sendWelcomeEmail({ to: email, name });
  } catch (emailErr) {
    console.warn('Email de bienvenida no enviado:', emailErr?.message || emailErr);
  }

  return res.status(201).json({
    success: true,
    message: 'Registro exitoso. ¡Bienvenido!',
    data: { id: user.id, name: user.name, email: user.email },
  });
};

const verifyEmail = async (req, res) => {
  const parsed = validate(verifyEmailSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

  const { email, code } = parsed.data;

  const now = new Date();
  const codeHash = hashCodeSha256(code);

  const latest = await prisma.emailCode.findFirst({
    where: {
      email,
      type: 'EMAIL_VERIFICATION',
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
    include: { user: { include: { role: true } } },
  });

  if (!latest) {
    return res.status(400).json({ success: false, message: 'Código inválido o expirado' });
  }
  if (!latest.userId) {
    return res.status(400).json({ success: false, message: 'Código no asociado a un usuario' });
  }

  if (latest.attempts >= CODE_MAX_ATTEMPTS) {
    return res.status(400).json({ success: false, message: 'Demasiados intentos. Solicita un nuevo código.' });
  }

  if (latest.codeHash !== codeHash) {
    await prisma.emailCode.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ success: false, message: 'Código incorrecto' });
  }

  await prisma.$transaction([
    prisma.emailCode.update({
      where: { id: latest.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: latest.userId },
      data: { emailVerified: true, isActive: true },
    }),
    prisma.client.updateMany({
      where: { email },
      data: { isActive: true },
    }),
  ]);

  return res.status(200).json({ success: true, message: 'Email verificado correctamente' });
};

const login = async (req, res) => {
  const parsed = validate(loginSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

  const { email, password } = parsed.data;

  // Verificar bloqueo por intentos fallidos
  const block = checkLoginBlock(email);
  if (block) {
    const mins = Math.ceil(block.secsLeft / 60);
    return res.status(429).json({
      success: false,
      message: `Demasiados intentos fallidos. Intenta de nuevo en ${mins} minuto${mins !== 1 ? 's' : ''}.`,
      blockedSeconds: block.secsLeft,
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    recordLoginFailure(email);
    return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const entry = recordLoginFailure(email);
    const remaining = LOGIN_MAX_ATTEMPTS - entry.count;
    if (entry.blockedUntil) {
      return res.status(429).json({
        success: false,
        message: `Demasiados intentos fallidos. Intenta de nuevo en ${LOGIN_BLOCK_MINUTES} minutos.`,
        blockedSeconds: LOGIN_BLOCK_MINUTES * 60,
      });
    }
    return res.status(401).json({
      success: false,
      message: `Credenciales incorrectas. Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.`,
      attemptsLeft: remaining,
    });
  }

  clearLoginAttempts(email);
  const permissions = (user.role.rolePermissions || []).map((rp) => rp.permission.name);
  const token = generateToken({ user, permissions });

  return res.status(200).json({
    success: true,
    message: 'Login exitoso',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions,
      },
    },
  });
};

const me = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'No autorizado' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: { rolePermissions: { include: { permission: true } } },
      },
    },
  });

  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  const permissions = (user.role.rolePermissions || []).map((rp) => rp.permission.name);

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      permissions,
      createdAt: user.createdAt,
    },
  });
};

const passwordResetRequest = async (req, res) => {
  const parsed = validate(passwordResetRequestSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } });
  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, message: 'No existe una cuenta registrada con ese correo electrónico.' });
  }

  const code = generateNumericCode(6);
  const codeHash = hashCodeSha256(code);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60_000);

  await prisma.emailCode.create({
    data: {
      type: 'PASSWORD_RESET',
      email,
      codeHash,
      expiresAt,
      userId: user.id,
      attempts: 0,
    },
  });

  await sendEmailWithCode({
    to: email,
    code,
    subject: 'Código de recuperación - Bionatural',
    text: `Tu código de recuperación de contraseña es: ${code}. Expira en ${PASSWORD_RESET_TTL_MINUTES} minutos. Si no solicitaste este código, ignora este mensaje.`,
  });

  return res.status(200).json({ success: true, message: 'Código enviado por correo.' });
};

const passwordResetVerifyCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ success: false, message: 'Email y código son requeridos' });

  const now = new Date();
  const codeHash = hashCodeSha256(String(code));

  const latest = await prisma.emailCode.findFirst({
    where: { email, type: 'PASSWORD_RESET', usedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) return res.status(400).json({ success: false, message: 'Código inválido o expirado' });
  if (latest.attempts >= CODE_MAX_ATTEMPTS) {
    return res.status(400).json({ success: false, message: 'Demasiados intentos. Solicita un nuevo código.' });
  }
  if (latest.codeHash !== codeHash) {
    await prisma.emailCode.update({ where: { id: latest.id }, data: { attempts: { increment: 1 } } });
    return res.status(400).json({ success: false, message: 'Código incorrecto' });
  }

  return res.status(200).json({ success: true, message: 'Código válido' });
};

const passwordResetConfirm = async (req, res) => {
  const parsed = validate(passwordResetConfirmSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });

  const { email, code, newPassword } = parsed.data;

  const now = new Date();
  const codeHash = hashCodeSha256(code);

  const latest = await prisma.emailCode.findFirst({
    where: {
      email,
      type: 'PASSWORD_RESET',
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) return res.status(400).json({ success: false, message: 'Código inválido o expirado' });
  if (latest.attempts >= CODE_MAX_ATTEMPTS) {
    return res.status(400).json({ success: false, message: 'Demasiados intentos. Solicita un nuevo código.' });
  }

  if (latest.codeHash !== codeHash) {
    await prisma.emailCode.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ success: false, message: 'Código incorrecto' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { passwordHash, isActive: true },
    }),
    prisma.emailCode.update({
      where: { id: latest.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
};

module.exports = {
  register,
  verifyEmail,
  login,
  me,
  passwordResetRequest,
  passwordResetVerifyCode,
  passwordResetConfirm,
};