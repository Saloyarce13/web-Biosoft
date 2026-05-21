// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');
const { generateToken } = require('../middleware/auth');
const { generateNumericCode, hashCodeSha256 } = require('../lib/code');
const { sendEmailWithCode, sendWelcomeEmail } = require('../services/email.service');
const { validateEmailExists } = require('../lib/validateEmail');
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

// Regex de validaciones
const DOC_NUMBER_REGEX = /^\d{8,15}$/; // 8-15 dígitos numéricos
const PHONE_REGEX      = /^\+?\d{10,20}$/; // 10-20 dígitos, permite '+' al inicio

// Schemas de validación
const registerSchema = z.object({
  name:           z.string().min(2).max(100),
  email:          z.string().email(),
  password:       z.string().min(6).max(100),
  phone:          z.string().regex(PHONE_REGEX, 'El teléfono debe tener entre 10 y 20 dígitos (puede incluir +)').max(20).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  address:        z.string().optional(),
  documentType:   z.enum(['CC', 'CE', 'PAS', 'NIT', 'TI', 'PA'], { message: 'Tipo de documento inválido' }).optional(),
  documentNumber: z.string()
    .regex(DOC_NUMBER_REGEX, 'El número de documento debe tener entre 1 y 15 dígitos numéricos')
    .optional()
    .or(z.literal(''))
    .transform(v => v === '' ? undefined : v),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100)
});

// ─── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const parsed = validate(registerSchema, req.body);
    if (!parsed.ok) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { name, email, password, phone, address, documentType, documentNumber } = parsed.data;

    // Verificar que el dominio del email existe (tiene registros MX)
    const emailCheck = await validateEmailExists(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, message: emailCheck.message });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta con este correo electrónico'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buscar rol de cliente por defecto
    let clientRole = await prisma.role.findFirst({
      where: { name: 'Cliente' }
    });

    // Si no existe el rol Cliente, crearlo
    if (!clientRole) {
      clientRole = await prisma.role.create({
        data: {
          name: 'Cliente',
          description: 'Rol para clientes del sistema',
          isActive: true
        }
      });
    }

    // Crear usuario + registro en clients (en transacción)
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone:   phone   || null,
          address: address || null,
          roleId:  clientRole.id,
          isActive:      true,
          emailVerified: false,
        },
        select: {
          id: true, name: true, email: true, phone: true, address: true,
          isActive: true, emailVerified: true, createdAt: true,
          role: { select: { id: true, name: true } },
        },
      });

      // Crear registro en clients con el documento
      const existingClient = await tx.client.findFirst({ where: { email } });
      if (!existingClient) {
        await tx.client.create({
          data: {
            name,
            email,
            phone:          phone          || null,
            address:        address        || null,
            documentType:   documentType   || null,
            documentNumber: documentNumber || null,
            isActive: true,
          },
        });
      }

      return newUser;
    });

    // Generar token
    const token = generateToken(user.id);

    logger.info(`New user registered: ${user.email}`);

    // Enviar email de bienvenida (sin bloquear la respuesta)
    sendWelcomeEmail({ to: user.email, name: user.name }).catch(err =>
      logger.warn(`Welcome email failed for ${user.email}: ${err.message}`)
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const parsed = validate(loginSchema, req.body);
    if (!parsed.ok) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { email, password } = parsed.data;

    // Buscar usuario con rol
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        phone: true,
        address: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                    resource: true,
                    action: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacta al administrador'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generar token
    const token = generateToken(user.id);

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                    resource: true,
                    action: true,
                    description: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ─── PUT /api/auth/profile ─────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      phone: z.string().optional(),
      address: z.string().optional()
    });

    const parsed = validate(updateSchema, req.body);
    if (!parsed.ok) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { name, phone, address } = parsed.data;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    logger.info(`Profile updated for user: ${updatedUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedUser
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ─── POST /api/auth/change-password ───────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const parsed = validate(changePasswordSchema, req.body);
    if (!parsed.ok) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, password: true, email: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    logger.info(`Password changed for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ─── POST /api/auth/demo-login ─────────────────────────────────────────────────
const demoLogin = async (req, res) => {
  try {
    const { type = 'client' } = req.body;

    let demoUser;
    
    if (type === 'admin') {
      // Buscar o crear usuario admin demo
      demoUser = await prisma.user.findFirst({
        where: { email: 'admin@bionatural.com' }
      });

      if (!demoUser) {
        // Crear rol admin si no existe
        let adminRole = await prisma.role.findFirst({
          where: { name: 'Administrador' }
        });

        if (!adminRole) {
          adminRole = await prisma.role.create({
            data: {
              name: 'Administrador',
              description: 'Administrador del sistema',
              isActive: true
            }
          });
        }

        demoUser = await prisma.user.create({
          data: {
            name: 'Administrador Demo',
            email: 'admin@bionatural.com',
            password: await bcrypt.hash('admin123', 12),
            roleId: adminRole.id,
            isActive: true,
            emailVerified: true
          }
        });
      }
    } else {
      // Usuario cliente demo
      demoUser = await prisma.user.findFirst({
        where: { email: 'cliente@bionatural.com' }
      });

      if (!demoUser) {
        let clientRole = await prisma.role.findFirst({
          where: { name: 'Cliente' }
        });

        if (!clientRole) {
          clientRole = await prisma.role.create({
            data: {
              name: 'Cliente',
              description: 'Cliente del sistema',
              isActive: true
            }
          });
        }

        demoUser = await prisma.user.create({
          data: {
            name: 'Cliente Demo',
            email: 'cliente@bionatural.com',
            password: await bcrypt.hash('cliente123', 12),
            roleId: clientRole.id,
            isActive: true,
            emailVerified: true
          }
        });
      }
    }

    // Obtener usuario completo con rol
    const fullUser = await prisma.user.findUnique({
      where: { id: demoUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        emailVerified: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                    resource: true,
                    action: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Generar token
    const token = generateToken(fullUser.id);

    logger.info(`Demo login: ${fullUser.email} (${type})`);

    return res.status(200).json({
      success: true,
      message: `Acceso demo como ${type} exitoso`,
      data: {
        user: fullUser,
        token,
        expiresIn: '24h',
        isDemoUser: true
      }
    });

  } catch (error) {
    logger.error('Demo login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ─── POST /api/auth/password-reset/request ────────────────────────────────────
const passwordResetRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'El email es requerido' });

    // Siempre responder OK para no revelar si el email existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      const code = generateNumericCode(6);
      const codeHash = hashCodeSha256(code);
      const ttl = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 15);
      const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

      // Invalidar códigos anteriores
      await prisma.passwordResetCode.updateMany({
        where: { email, used: false },
        data: { used: true },
      });

      await prisma.passwordResetCode.create({
        data: { email, codeHash, expiresAt },
      });

      await sendEmailWithCode({
        to: email,
        code,
        subject: 'Código de recuperación — Bionatural',
        text: `Usa este código para restablecer tu contraseña. Expira en ${ttl} minutos.`,
      });

      logger.info(`Password reset code sent to: ${email}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Si el correo existe, recibirás un código de recuperación.',
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── POST /api/auth/password-reset/verify-code ────────────────────────────────
const passwordResetVerifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email y código son requeridos' });

    const codeHash = hashCodeSha256(String(code));
    const record = await prisma.passwordResetCode.findFirst({
      where: { email, codeHash, used: false, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Código inválido o expirado' });
    }

    return res.status(200).json({ success: true, message: 'Código válido' });
  } catch (error) {
    logger.error('Verify code error:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── POST /api/auth/password-reset/confirm ────────────────────────────────────
const passwordResetConfirm = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, código y nueva contraseña son requeridos' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const codeHash = hashCodeSha256(String(code));
    const record = await prisma.passwordResetCode.findFirst({
      where: { email, codeHash, used: false, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Código inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { email }, data: { password: hashedPassword } }),
      prisma.passwordResetCode.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    logger.info(`Password reset confirmed for: ${email}`);
    return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('Password reset confirm error:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  demoLogin,
  passwordResetRequest,
  passwordResetVerifyCode,
  passwordResetConfirm,
};