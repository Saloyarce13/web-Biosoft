# Guía de Desarrollo Backend - Biosoft 2

## Scope

Esta guía se aplica al desarrollo en **api/** y proporciona instrucciones detalladas para:
- Implementar nuevas entidades en la BD
- Crear endpoints API
- Configurar autenticación y permisos
- Gestionar migraciones Prisma

---

## Estructura de Código Backend

### Controllers (`src/controllers/`)

**Patrón obligatorio:**
```javascript
// user.controller.js
const prisma = require('../lib/prisma');
const { validate } = require('../lib/validate');
const { userSchema } = require('../validators/user.validators');

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios' 
    });
  }
};

module.exports = { getUsers };
```

**Responsabilidades:**
- Validar entrada con Zod
- Llamar a servicios/modelos
- Retornar respuestas estandarizadas: `{ success, message, data? }`
- Manejar errores sin exponer detalles internos

### Routes (`src/routes/`)

**Patrón obligatorio:**
```javascript
// user.routes.js
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { getUsers, createUser } = require('../controllers/user.controller');

router.get('/', authenticate, getUsers);
router.post('/', authenticate, createUser);

module.exports = router;
```

**Reglas:**
- Aplicar `authenticate` en rutas protegidas
- Usar convenciones REST (GET, POST, PUT, DELETE)
- Montar en `src/index.js` con prefijo `/api/entity`

### Validators (`src/validators/`)

**Patrón obligatorio:**
```javascript
// user.validators.js
const { z } = require('zod');

const userSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER']),
});

module.exports = { userSchema };
```

**Reglas:**
- Agrupar esquemas por entidad
- Usar tipografías precisas (min, max, enum, etc.)
- Reutilizar en controllers mediante `validate(schema, data)`

### Middlewares (`src/middlewares/`)

**auth.middleware.js - Validar JWT:**
```javascript
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No autorizado' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};
```

**Crear middleware personalizado:**
```javascript
// src/middlewares/checkPermission.middleware.js
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ success: false, message: 'Permiso denegado' });
    }
    next();
  };
};

// Usar en rutas:
router.delete('/:id', authenticate, checkPermission('DELETE_USER'), deleteUser);
```

---

## Flujo Completo: Agregar Nueva Entidad

### 1. Definir en Prisma

```prisma
// prisma/schema.prisma
model Item {
  id    Int     @id @default(autoincrement())
  name  String  @unique @db.VarChar(100)
  price Decimal @db.Decimal(10, 2)
  stock Int     @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  purchases PurchaseItem[]
  
  @@map("items")
}
```

### 2. Migrar BD

```bash
cd api
npx prisma migrate dev --name add_item_entity
```

### 3. Crear Validator

```javascript
// src/validators/item.validators.js
const { z } = require('zod');

const createItemSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.number().positive(),
  stock: z.number().int().nonnegative().optional(),
});

module.exports = { createItemSchema };
```

### 4. Crear Controller

```javascript
// src/controllers/item.controller.js
const { createItemSchema } = require('../validators/item.validators');

const createItem = async (req, res) => {
  const parsed = validate(createItemSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ success: false, message: parsed.error });
  
  try {
    const item = await prisma.item.create({
      data: parsed.data,
    });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al crear item' });
  }
};

module.exports = { createItem };
```

### 5. Crear Routes

```javascript
// src/routes/item.routes.js
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { createItem, getItems } = require('../controllers/item.controller');

router.get('/', getItems);
router.post('/', authenticate, createItem);

module.exports = router;
```

### 6. Montar en src/index.js

```javascript
app.use('/api/items', require('./routes/item.routes'));
```

---

## Autenticación y Permisos

### JWT Token Payload

```javascript
{
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  permissions: ['CREATE_USER', 'DELETE_USER', 'EDIT_PRODUCT']
}
```

### Verificar Permisos en Controller

```javascript
const deleteUser = async (req, res) => {
  // req.user viene del middleware auth
  if (!req.user.permissions.includes('DELETE_USER')) {
    return res.status(403).json({ success: false, message: 'No tienes permiso' });
  }
  
  // Lógica del controlador...
};
```

---

## Variables de Entorno

```env
PORT=3000
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@localhost:5432/biosoft2
EMAIL_CODE_TTL_MINUTES=15
PASSWORD_RESET_TTL_MINUTES=30
NODEMAILER_EMAIL=tu_email@gmail.com
NODEMAILER_PASSWORD=tu_app_password
```

---

## Comandos Útiles

```bash
# Desarrollo con hot-reload
npm run dev

# Producción
npm start

# Ver BD en UI
npx prisma studio

# Reset BD (solo desarrollo)
npx prisma migrate reset

# Validar esquema
npx prisma validate
```

---

## Errores Comunes

❌ **No validar entrada:**
```javascript
// ❌ MAL
const user = await prisma.user.create({ data: req.body });

// ✅ BIEN
const parsed = validate(createUserSchema, req.body);
if (!parsed.ok) return res.status(400).json({ success: false });
```

❌ **Exponer errores internos:**
```javascript
// ❌ MAL
catch (e) { res.json({ error: e.message }); }

// ✅ BIEN
catch (e) { 
  console.error(e);
  res.status(500).json({ success: false, message: 'Error interno' }); 
}
```

❌ **No verificar permisos:**
```javascript
// ❌ MAL - Cualquiera puede eliminar usuarios
router.delete('/:id', deleteUser);

// ✅ BIEN - Solo admin puede eliminar
router.delete('/:id', authenticate, checkPermission('DELETE_USER'), deleteUser);
```

---

## Testing Manual con cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Obtener token from respuesta, luego:

# Crear item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Producto A","price":99.99}'

# Listar items
curl http://localhost:3000/api/items
```

---

## Checklist para Nuevas Rutas

- [ ] ¿Validé la entrada con Zod?
- [ ] ¿Verifiqué permisos si es necesario?
- [ ] ¿Manejé errores sin exponer detalles?
- [ ] ¿Retorné formato `{ success, message, data? }`?
- [ ] ¿Agregué la ruta en `src/index.js`?
- [ ] ¿Probé con cURL o Postman?
- [ ] ¿Documenté parámetros y respuestas?
