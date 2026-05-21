# Guía de Migraciones Prisma - Biosoft 2

## Conceptos Básicos

Prisma utiliza el sistema de migraciones para versionear cambios en el esquema de BD.

```
┌─ Cambios en schema.prisma
│
└─> npx prisma migrate dev --name description
    │
    └─> Crea archivo en prisma/migrations/
    └─> Aplica cambios a BD local
    └─> Regenera Prisma Client
```

---

## Workflow de Migraciones

### 1. Modificar `prisma/schema.prisma`

```prisma
// ANTES
model Product {
  id    Int     @id @default(autoincrement())
  name  String
  price Decimal
}

// DESPUÉS - Agregamos campo
model Product {
  id           Int     @id @default(autoincrement())
  name         String
  price        Decimal
  description  String? // Campo nuevo opcional
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 2. Validar Cambios

```bash
cd api

# Verificar que el esquema sea válido
npx prisma validate
```

### 3. Crear Migración

```bash
# Crear migración CON nombre descriptivo
npx prisma migrate dev --name add_product_description_and_timestamps

# Output:
# • Environment variables loaded from .env
# • Prisma schema loaded from prisma/schema.prisma
# • Datasource "db": PostgreSQL database at localhost
# 
# ✔ Enter a name for the new migration: … add_product_description_and_timestamps
# ✔ A migration has been created at prisma/migrations/20250406140522_add_product_description_and_timestamps/
# ✔ Run `npx prisma db push` to update your database schema in production
```

### 4. Verificar Cambios

```bash
# Ver BD en UI interactiva
npx prisma studio
```

---

## Tipos de Cambios Comunes

### Agregar Campo

```prisma
model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  phone     String? // Campo nuevo opcional
}
```

```bash
npx prisma migrate dev --name add_phone_to_user
```

### Agregar Relación

```prisma
// ANTES
model Post { id Int @id }

// DESPUÉS
model Post {
  id      Int  @id @default(autoincrement())
  userId  Int
  user    User @relation(fields: [userId], references: [id])
}
```

```bash
npx prisma migrate dev --name add_user_relation_to_post
```

### Cambiar Tipo de Campo

```prisma
// ANTES
model Price {
  amount Decimal @db.Decimal(5, 2)
}

// DESPUÉS
model Price {
  amount Decimal @db.Decimal(10, 2) // Aumenta precisión
}
```

```bash
npx prisma migrate dev --name increase_price_precision
```

### Renombrar Campo

```prisma
// ANTES
model Product {
  productName String
}

// DESPUÉS
model Product {
  name String @db.VarChar(100)
}
```

Prisma **no detecta automáticamente** renombres. Debes editar el archivo SQL:

```bash
# 1. Crear migración vacía
npx prisma migrate dev --name rename_product_name --create-only

# 2. Editar prisma/migrations/[timestamp]_rename_product_name/migration.sql
# 3. Reemplazar contenido generado con:
ALTER TABLE "products" RENAME COLUMN "productName" TO "name";

# 4. Aplicar
npx prisma migrate deploy
```

### Agregar Enum

```prisma
// ANTES
model Order {
  status String
}

// DESPUÉS
enum OrderStatus {
  PENDING
  COMPLETED
  CANCELLED
}

model Order {
  status OrderStatus @default(PENDING)
}
```

```bash
npx prisma migrate dev --name add_order_status_enum
```

---

## Migraciones en Producción

### Ambiente de Development

```bash
# Aplicar migraciones + hot reload
npm run dev

# O manualmente
npx prisma migrate dev
```

### Ambiente de Staging/Production

```bash
# NUNCA usar 'migrate dev' en producción
# En su lugar, usar 'migrate deploy'

npx prisma migrate deploy

# Esto aplicará todas las migraciones pendientes sin prompts
```

**Variables de entorno requeridas:**

```env
# .env (Staging/Production)
DATABASE_URL=postgresql://user:password@prod-db-host:5432/biosoft2_prod
```

---

## Resolver Problemas de Migraciones

### Migración se quedó atascada

```bash
# Ver estado de migraciones
npx prisma migrate status

# Si una migración falló, marcarla como resuelta manualmente (último recurso)
npx prisma migrate resolve --rolled-back "20250406_add_field"
```

### Borrar migración no aplicada

```bash
# Si aún NO se ha ejecutado:
rm -rf prisma/migrations/[timestamp]_name/

# Regenerar cliente
npx prisma generate
```

### Reset BD en desarrollo (​​​​CUIDADO)

```bash
# Borra toda la BD y reaplica todas las migraciones
npx prisma migrate reset

# Con confirmación
npx prisma migrate reset --force # Sin prompt
```

### Verificar que migraciones están aplicadas

```bash
# Ver lista de todas las migraciones
npx prisma migrate status

# Output:
# Migrations
#   [✓] 20250101_initial
#   [✓] 20250102_add_users
#   [✓] 20250103_add_products
#   [◇] 20250104_add_field  (pending)
```

---

## Prácticas Recomendadas

✅ **Nombres descriptivos:**
```bash
# ✅ BIEN
npx prisma migrate dev --name add_user_email_verification_code

# ❌ MAL
npx prisma migrate dev --name add_field
```

✅ **Migraciones pequeñas y atómicas:**
```bash
# ✅ BIEN - Una cosa por migración
npx prisma migrate dev --name add_category_description
npx prisma migrate dev --name add_category_icon_url

# ❌ MAL - Demasiados cambios juntos
npx prisma migrate dev --name add_description_icon_color_status
```

✅ **Revisar SQL generado:**
```bash
# Antes de confirmar, ver el archivo
cat prisma/migrations/[timestamp]_name/migration.sql
```

✅ **Documentar cambios complejos:**
```sql
-- prisma/migrations/20250406_complex_change/migration.sql

-- Agregar tabla temporal para migrar datos si es necesario
-- UPDATE users SET role_id = ... based on old_role field
-- DROP COLUMN old_role
```

❌ **No hacer modificaciones manuales en BD:**
```bash
# ❌ Evitar
psql -d biosoft2 -c "ALTER TABLE users ADD COLUMN role_id INT"

# ✅ Hacer siempre via Prisma
npx prisma migrate dev --name add_role_id_to_users
```

---

## Checklist para Cambios de esquema

- [ ] ¿Modifiqué `prisma/schema.prisma`?
- [ ] ¿Ejecuté `npx prisma validate`?
- [ ] ¿Corrí `npx prisma migrate dev --name [nombre_descriptivo]`?
- [ ] ¿Verifiqué en `npx prisma studio` que los cambios son correctos?
- [ ] ¿Actualicé los controllers/routes si es necesario?
- [ ] ¿Probé la API con datos reales?
- [ ] ¿Commitee la migración junto con el código?

---

## Ejemplos Prácticos

### Caso 1: Agregar tabla de auditoría

```prisma
model AuditLog {
  id        Int     @id @default(autoincrement())
  userId    Int
  action    String  @db.VarChar(50)
  entity    String  @db.VarChar(50)
  entityId  Int
  timestamp DateTime @default(now())
  
  @@index([userId])
  @@index([timestamp])
}
```

```bash
npx prisma migrate dev --name add_audit_log_table
```

### Caso 2: Agregar soft-delete

```prisma
model Product {
  id        Int      @id @default(autoincrement())
  name      String
  deletedAt DateTime? // null = activo, fecha = eliminado
}
```

```bash
npx prisma migrate dev --name add_soft_delete_to_product
```

Usar en controllers:

```javascript
// Listar solo activos
const products = await prisma.product.findMany({
  where: { deletedAt: null }
});

// Soft delete
await prisma.product.update({
  where: { id: 1 },
  data: { deletedAt: new Date() }
});
```

### Caso 3: Renombrar tabla

```prisma
// ANTES
model UserRole { ... }

// DESPUÉS
model StaffRole { 
  ...
  @@map("staff_roles")
}
```

```bash
# 1. Crear
npx prisma migrate dev --name rename_user_role_to_staff_role --create-only

# 2. Editar migration.sql
ALTER TABLE "user_roles" RENAME TO "staff_roles";

# 3. Aplicar
npx prisma migrate deploy
```

---

## Comandos de Referencia

```bash
# Crear migración (dev)
npx prisma migrate dev --name description

# Crear migración sin aplicar (para editar SQL)
npx prisma migrate dev --name description --create-only

# Aplicar migraciones pendientes (producción)
npx prisma migrate deploy

# Ver estado
npx prisma migrate status

# Reset (solo dev)
npx prisma migrate reset --force

# Resolver migración fallida
npx prisma migrate resolve --rolled-back name

# Regenerar Prisma Client
npx prisma generate

# UI interactiva
npx prisma studio
```
