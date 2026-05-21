# Convenciones y Estándares - Biosoft 2

## Propósito

Este documento asegura consistencia en el código y facilita la revisión y mantenimiento por parte del equipo y agentes de AI.

---

## Naming Conventions

### Backend (JavaScript/Node.js)

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Archivos | `camelCase.js` o `kebab-case.js` | `auth.controller.js`, `auth-middleware.js` |
| Carpetas | `kebab-case` | `src/middlewares`, `src/lib` |
| Variables | `camelCase` | `userData`, `isActive` |
| Constantes (config) | `UPPER_SNAKE_CASE` | `JWT_SECRET`, `MAX_ATTEMPTS` |
| Funciones | `camelCase` | `getUserById()`, `hashPassword()` |
| Clases | `PascalCase` | `UserController`, `AuthService` |
| Modelos Prisma | `PascalCase` | `User`, `Product`, `Purchase` |
| Enum Prisma | `UPPER_SNAKE_CASE` | `EMAIL_VERIFICATION`, `PENDING` |
| Rutas API | `kebab-case` | `/api/users`, `/api/purchase-items` |

### Frontend (TypeScript/React)

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Archivos | `PascalCase.tsx/.ts` | `Button.tsx`, `UserContext.ts` |
| Carpetas | `kebab-case` | `src/features/auth`, `src/components/ui` |
| Variables | `camelCase` | `userData`, `isLoading` |
| Constantes | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_RETRIES` |
| Funciones | `camelCase` | `handleSubmit()`, `fetchUsers()` |
| Componentes | `PascalCase` | `Button`, `UserProfile`, `ProductCard` |
| Hooks | `useXxx` | `useAuth()`, `useProducts()` |
| Types/Interfaces | `PascalCase` | `UserProps`, `AuthState` |
| Store | `useXxxStore` | `useAuthStore`, `useAppStore` |

### Base de Datos

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Tablas | `snake_case` (plural) | `users`, `products`, `purchase_items` |
| Columnas | `snake_case` | `user_id`, `created_at`, `is_active` |
| Índices | `idx_table_column` | `idx_users_email`, `idx_products_category_id` |
| Claves foráneas | `fk_table_referenced_table` | `fk_products_category` |

---

## Estructura de Archivos

### Backend

```
api/src/
├── controllers/
│   ├── auth.controller.js         # Lógica de autenticación
│   ├── user.controller.js
│   ├── product.controller.js
│   └── [entity].controller.js
│
├── routes/
│   ├── auth.routes.js             # Endpoints de +/auth
│   ├── user.routes.js
│   └── [entity].routes.js
│
├── validators/
│   ├── auth.validators.js         # Esquemas Zod para auth
│   ├── user.validators.js
│   └── [entity].validators.js
│
├── middlewares/
│   ├── auth.middleware.js         # JWT + attach user
│   └── [custom].middleware.js
│
├── services/
│   ├── email.service.js           # Nodemailer
│   └── [external-api].service.js
│
├── lib/
│   ├── prisma.js                  # Instancia de Prisma
│   ├── validate.js                # Helper de validación
│   ├── code.js                    # Generar códigos
│   └── initialData.js             # Seeds
│
└── index.js                        # Entry point
```

### Frontend

```
Base-Front-BIONATURAL-main/src/
├── components/
│   ├── ui/                        # Radix + Tailwind
│   │   ├── Button.tsx
│   │   ├── Dialog.tsx
│   │   └── [Primitive].tsx
│   └── [feature-specific]/
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   ├── api.ts
│   │   └── store.ts
│   │
│   ├── products/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   ├── api.ts
│   │   └── [feature structure]
│   │
│   └── [module]/
│
├── lib/
│   ├── api-client.ts              # Fetch wrapper
│   ├── validation.ts              # Zod schemas (frontend)
│   ├── utils.ts                   # Helpers generales
│   └── constants.ts               # URLs, magic numbers
│
├── shared/
│   ├── types.ts                   # Tipos globales
│   ├── constants.ts               # Constantes app-wide
│   └── icons.tsx                  # Icon library
│
└── App.tsx
```

---

## Respuestas API

Todas las respuestas API deben seguir este formato:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "timestamp": ISO8601
}
```

### Ejemplos

**Success (200):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 1,
    "name": "Juan",
    "email": "juan@example.com"
  }
}
```

**Error (4xx):**
```json
{
  "success": false,
  "message": "El email ya está registrado",
  "data": null
}
```

**Error de validación (400):**
```json
{
  "success": false,
  "message": "Error de validación",
  "data": {
    "errors": [
      { "field": "email", "message": "Email inválido" },
      { "field": "password", "message": "Mínimo 8 caracteres" }
    ]
  }
}
```

---

## Validación (Zod)

### Backend

```javascript
// ✅ BIEN
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  name: z.string().min(3).max(100),
});

// ❌ MAL
const userSchema = z.object({
  email: z.string(),
  password: z.string(),
  name: z.string(),
});
```

### Frontend

```typescript
// ✅ BIEN
const LoginFormSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'Contraseña muy corta'),
});

// ❌ MAL
const schema = z.object({
  email: z.string(),
  password: z.string(),
});
```

---

## Comentarios y Documentación

### Backend

```javascript
// ✅ BIEN - Comentario descriptivo
const hashPassword = async (password) => {
  // Generar salt de 10 rondas
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// ❌ MAL - Redundante
const hashPassword = async (password) => {
  // hash the password
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// TODO: Indicar trabajo pendiente
// TODO: Agregar rate limiting en login

// FIXME: Señalar bugs conocidos
// FIXME: Esta función falla si el usuario no existe
```

### Frontend

```typescript
// ✅ BIEN
interface UserProps {
  /** ID único del usuario */
  id: number;
  /** Nombre completo */
  name: string;
}

// ❌ MAL
interface UserProps {
  id: number; // user id
  name: string; // user name
}
```

---

## Error Handling

### Backend

```javascript
// ✅ BIEN
const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.params.id }
    });
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'No se pudo obtener el usuario' 
    });
  }
};

// ❌ MAL
const getUser = async (req, res) => {
  const user = await prisma.user.findUnique({...});
  res.json(user); // ¿Qué pasa si no existe?
};
```

### Frontend

```typescript
// ✅ BIEN
const { data, error, loading } = useQuery(...);

if (loading) return <Spinner />;
if (error) return <Error message={error.message} />;
return <div>{data}</div>;

// ❌ MAL
const [users, setUsers] = useState([]);
useEffect(() => {
  fetch(...).then(r => setUsers(r)); // Sin manejo de errores
}, []);
```

---

## Tipos y Interfaces

### Backend

```javascript
// ✅ BIEN - Comentar tipos de retorno
/**
 * @param {string} email
 * @returns {Promise<Object>} Usuario creado con id
 */
const createUser = async (email) => {
  // ...
};

// ❌ MAL - Sin documentación
const createUser = async (email) => {
  // ...
};
```

### Frontend

```typescript
// ✅ BIEN
interface User {
  id: number;
  email: string;
  createdAt: Date;
}

interface UserListProps {
  users: User[];
  onSelect?: (user: User) => void;
}

// ❌ MAL
interface User {
  id: any;
  email: any;
}

interface Props {
  users: any;
  onSelect: any;
}
```

---

## Testing

### Backend

```bash
# Estructura recomendada (si se implementa)
tests/
├── unit/
│   └── [entity].test.js
├── integration/
│   └── [entity].integration.test.js
└── e2e/
    └── [scenario].test.js
```

```bash
npm test
```

### Frontend

```bash
# Estructura recomendada
src/
└── __tests__/
    ├── components/
    │   └── Button.test.tsx
    └── features/
        └── auth.test.ts
```

```bash
npm run test
```

---

## Git Commits

### Formato

```
<tipo>(<scope>): <descripción breve>

<descripción detallada si es necesario>

Fixes #<issue-number> (si aplica)
```

### Tipos

- `feat`: Nueva funcionalidad
- `fix`: Correción de bug
- `refactor`: Cambio sin efectos funcionales
- `docs`: Cambios en documentación
- `test`: Agregar/modificar tests
- `chore`: Cambios en build, deps, etc.

### Scope

- `backend` | `frontend` | `db` | `auth` | etc.

### Ejemplos

```
feat(auth): agregar verificación de email

- Implementar endpoint POST /api/auth/verify-email
- Generar código de 6 dígitos
- TTL de 15 minutos

fix(products): corregir filtro por categoría
refactor(frontend): optimizar useProducts hook
docs(backend): actualizar guía de migraciones
```

---

## Environmental Variables

### Backend (.env)

```env
# ────── Servidor
PORT=3000

# ────── Base de Datos
DATABASE_URL=postgresql://user:password@localhost:5432/biosoft2

# ────── JWT
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d

# ────── Email
EMAIL_CODE_TTL_MINUTES=15
PASSWORD_RESET_TTL_MINUTES=30
NODEMAILER_EMAIL=tu_email@gmail.com
NODEMAILER_PASSWORD=tu_app_password

# ────── Node
NODE_ENV=development
```

**Reglas:**
- ✅ Commits NO deben incluir `.env`
- ✅ Crear `.env.example` con placeholders
- ✅ Documentar todas las vars requeridas

---

## Checklist de Revisión de Código

### Backend

- [ ] ¿Validé entrada con Zod?
- [ ] ¿Verifiqué permisos de usuario?
- [ ] ¿Manejé todos los estados de error?
- [ ] ¿Retorno formato estándar `{ success, message, data }`?
- [ ] ¿Usé camelCase para variables?
- [ ] ¿Agregué comentarios en lógica compleja?
- [ ] ¿No expongo errores internos al cliente?

### Frontend

- [ ] ¿Usé TypeScript en todos lados?
- [ ] ¿Definí interfaces para props?
- [ ] ¿Manejé loading y error states?
- [ ] ¿Centralicé llamadas API en `lib/`?
- [ ] ¿Usé nombres descriptivos (camelCase)?
- [ ] ¿El componente es reutilizable?
- [ ] ¿Probé en navegador (dev tools)?

---

## Recursos Rápidos

- **Zod Docs:** https://zod.dev
- **Prisma Docs:** https://www.prisma.io/docs
- **React Docs:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
