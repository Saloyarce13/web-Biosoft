# Biosoft 2 - AI Development Guidelines

## Project Overview

**Biosoft 2** is a natural products e-commerce platform with inventory management and staff administration.

### Architecture

```
api/                        # Express.js + Prisma backend
│   ├── src/
│   │   ├── controllers/    # Business logic per entity
│   │   ├── routes/         # API endpoints
│   │   ├── models/         # Prisma model interfaces
│   │   ├── validators/     # Zod input validation
│   │   ├── middlewares/    # Auth & custom middleware
│   │   ├── services/       # Email, external integrations
│   │   ├── lib/            # Utilities (Prisma, validation, codes)
│   │   └── config/         # Database configuration
│   ├── prisma/
│   │   └── schema.prisma   # Data model (PostgreSQL)
│   └── package.json

Base-Front-BIONATURAL-main/
└── src/                    # React 18 + TypeScript + Vite
    ├── components/         # UI components
    ├── features/           # Feature modules
    ├── lib/                # Utilities
    ├── shared/             # Shared resources
    └── styles/             # Global styles
```

---

## Backend Development

### Key Technologies

- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT (jsonwebtoken, bcryptjs)
- **Validation**: Zod schemas
- **Email**: Nodemailer
- **Development**: Nodemon for hot-reload

### Database Entities

Primary models in Prisma schema:

- **User**: Authentication, roles, email verification
- **Role / Permission / RolePermission**: RBAC system
- **Employee / Provider / Client**: People management
- **Product / Category**: Catalog
- **Purchase / PurchaseItem**: Incoming stock
- **Sale / SaleItem**: Sales transactions
- **Transaction**: Audit log for stock changes

### Development Commands (API)

```bash
# Install dependencies
npm install

# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Code Organization Patterns

**Controllers** (`src/controllers/`):
- One file per entity (e.g., `user.controller.js`, `product.controller.js`)
- Export individual async functions for each action
- Should handle validation via middleware and delegate to models
- Return standardized responses: `{ success: boolean, message: string, data?: any }`

**Routes** (`src/routes/`):
- Mount handlers from controllers
- Apply authentication middleware (`auth.middleware.js`) where needed
- Follow REST conventions: `GET /api/entity`, `POST /api/entity`, etc.

**Validators** (`src/validators/`):
- Use Zod schemas (e.g., `registerSchema`, `loginSchema`)
- Group related schemas by entity
- Export validators for reuse in controllers

**Models** (`src/models/`):
- Define Node class/function wrappers for Prisma models if needed
- Generally, interact with Prisma directly in controllers

**Middleware** (`src/middlewares/`):
- `auth.middleware.js`: Validates JWT, attaches user to request
- Check for role/permission gates in controllers or create additional middleware

### Authentication Flow

1. User **registers** → Email verification code sent → JWT issued
2. User **logs in** → Email/password verified → JWT issued
3. JWT contains: `id`, `name`, `email`, `role`, `permissions`
4. Requests to protected endpoints require valid JWT in `Authorization: Bearer <token>`

### Key Configuration

Environment variables (set in `.env`):
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret for signing tokens
- `JWT_EXPIRES_IN`: Token expiration (e.g., "7d")
- `DATABASE_URL`: PostgreSQL connection string
- `EMAIL_CODE_TTL_MINUTES`: Verification code TTL
- `PASSWORD_RESET_TTL_MINUTES`: Password reset code TTL

---

## Frontend Development

### Key Technologies

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI (unstyled, headless components)
- **Styling**: Tailwind CSS + class-variance-authority
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Notifications**: Sonner (toast library)

### Development Commands (Frontend)

```bash
# Navigate to frontend directory
cd Base-Front-BIONATURAL-main/Base-Front-BIONATURAL-main

# Install dependencies
npm install

# Development server (hot reload)
npm run dev

# Build for production
npm run build
```

### File Structure

```
src/
├── components/         # Reusable UI components
├── features/          # Business logic modules (auth, products, etc.)
├── lib/               # Utilities and helpers
├── shared/            # Shared types, constants, icons
├── styles/            # Global CSS
├── App.tsx            # Main component
├── main.tsx           # Entry point
└── routes.tsx         # Route definitions
```

### Code Organization Patterns

**Components** (`components/`):
- Functional React components with TypeScript
- Props interface naming: `{ComponentName}Props`
- Use Radix UI primitives for accessibility

**Features** (`features/`):
- Group related business logic by feature (e.g., `features/auth/`, `features/products/`)
- Include local state, hooks, and feature-specific components

**Utilities** (`lib/`):
- Helper functions, API clients, validation
- Type definitions and constants

### API Communication

- Base URL: `http://localhost:3000/api` (development)
- Use fetch or axios wrapper in `lib/` for API calls
- Attach JWT token from localStorage in request headers

### Styling Approach

- **Tailwind CSS**: Utility-first for styling
- **class-variance-authority**: Component variant management
- **Radix UI**: Unstyled, accessible primitives
- **clsx**: Conditional class concatenation

---

## Common Development Tasks

### Adding a New Entity (Backend)

1. Define model in `prisma/schema.prisma`
2. Run Prisma migration: `npx prisma migrate dev --name add_entity`
3. Create controller: `src/controllers/entity.controller.js`
4. Create routes: `src/routes/entity.routes.js`
5. Create validators: `src/validators/entity.validators.js`
6. Mount routes in `src/index.js`

### Adding API Authentication to a Route

```javascript
// In the route file
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { getEntity } = require('../controllers/entity.controller');

router.get('/', authenticate, getEntity);
```

### Adding a Frontend Page

1. Create feature folder: `src/features/entity/`
2. Define types in `types.ts`
3. Create components and logic
4. Add route to `src/routes.tsx`
5. Link in navigation

---

## Common Pitfalls & Tips

### Backend

- ✅ Always use Zod validation for user input
- ✅ Check user permissions in controllers before database operations
- ✅ Use `.env` for secrets; never commit sensitive data
- ❌ Don't directly parse JSON from requests without validation
- ❌ Don't expose database errors to clients; return generic messages

### Frontend

- ✅ Use TypeScript for type safety
- ✅ Fetch user permissions from token on login; cache in state
- ✅ Use React Hook Form for complex forms
- ❌ Don't make direct fetch calls across components; centralize in `lib/`
- ❌ Don't store sensitive data in localStorage; use secure cookies if possible

---

## Quick Reference

### Start Development (Both Services)

**Terminal 1 - Backend:**
```bash
cd api
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd Base-Front-BIONATURAL-main/Base-Front-BIONATURAL-main
npm run dev
# Runs on http://localhost:5173 (Vite default)
```

### Database Operations

```bash
# View database in Prisma Studio
cd api
npx prisma studio

# Create migration after schema changes
npx prisma migrate dev --name describe_change

# Reset database (development only!)
npx prisma migrate reset
```

---

## Useful API Endpoints

- `GET /api/health` - Server health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users` - List users (admin)
- `GET /api/products` - List products
- `GET /api/sales` - List sales
- `GET /api/purchases` - List purchases
- `GET /api/stats` - Dashboard statistics

See individual route files in `api/src/routes/` for complete endpoint documentation.

---

## When to Ask for Help

Ask me for assistance with:
- ✅ Implementing new features or fixing bugs
- ✅ Understanding project structure or conventions
- ✅ Database schema changes or migrations
- ✅ API endpoint design
- ✅ Component reusability questions
- ✅ Performance or security concerns

Mention "backend" or "frontend" when asking so I can focus the right area.
