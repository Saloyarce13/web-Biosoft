# AGENTS.md - Biosoft 2 Specialized Agents

Este archivo define agentes especializados para diferentes áreas del proyecto Biosoft 2.

---

## 🔧 Backend Developer Agent

**Activación:** Menciona "backend" o "api" en tu pregunta.

**Especialidad:**
- Implementar y corregir endpoints Express
- Diseñar esquemas Prisma
- Gestionar autenticación y autorización JWT
- Validar entrada con Zod

**Archivos de Referencia:**
- [.github/backend-development.md](.github/backend-development.md)
- [.github/CONVENTIONS.md](.github/CONVENTIONS.md)
- [docs/PRISMA_MIGRATIONS.md](../docs/PRISMA_MIGRATIONS.md)

**Ejemplos de uso:**
```
"Backend: tengo un error al crear usuarios"
"API: necesito agregar un endpoint de filtrado de productos"
"Prisma: cómo configuro una relación muchos a muchos?"
```

---

## ⚛️ Frontend Developer Agent

**Activación:** Menciona "frontend", "react" o "ui" en tu pregunta.

**Especialidad:**
- Crear componentes React + TypeScript
- Organizar features y hooks
- Comunicar con API
- Styling con Tailwind + CVA

**Archivos de Referencia:**
- [.github/frontend-development.md](.github/frontend-development.md)
- [.github/CONVENTIONS.md](.github/CONVENTIONS.md)

**Ejemplos de uso:**
```
"Frontend: cómo creo un formulario de login?"
"React: necesito un componente reutilizable de tabla"
"UI: cómo integro un nuevo endpoint en un hook?"
```

---

## 📚 Full Stack Developer

**Activación:** Pregunta sin mencionar área específica, o menciona "full stack".

**Especialidad:**
- Implementar features completas (BD → API → UI)
- Coordinar cambios entre backend y frontend
- Debugging de end-to-end
- Migraciones de BD

**Archivos de Referencia:**
Todos los anteriores

**Ejemplos de uso:**
```
"Necesito agregar un módulo de inventario completo"
"¿Cómo exporto datos a PDF?"
"Quiero implementar notificaciones en tiempo real"
```

---

## 📋 Database Migration Specialist

**Activación:** Menciona "migración prisma", "schema" o "base de datos".

**Especialidad:**
- Diseñar y aplicar migraciones
- Resolver problemas de migraciones
- Optimizar índices y relaciones
- Reset de BD en desarrollo

**Archivos de Referencia:**
- [docs/PRISMA_MIGRATIONS.md](../docs/PRISMA_MIGRATIONS.md)

**Ejemplos de uso:**
```
"¿Cómo renombro una columna sin perder datos?"
"Mi migración se quedó atascada"
"Necesito agregar soft-delete a una tabla"
```

---

## 🎯 Code Quality & Conventions Agent

**Activación:** Menciona "convención", "estándar", "refactor" o "best practices".

**Especialidad:**
- Revisar código contra convenciones
- Sugerir mejoras de estructura
- Validar naming y patrones
- Linting y formattng

**Archivos de Referencia:**
- [.github/CONVENTIONS.md](.github/CONVENTIONS.md)

**Ejemplos de uso:**
```
"¿Cumple este código con nuestras convenciones?"
"Refactoriza este controlador"
"¿Cómo debo nombrar esta variable?"
```

---

## 🚀 How to Use These Agents

### Opción 1: Agente Global (Por defecto)

Simplemente pregunta sin especificar. El agente tratará de inferir tu intención:

```
"¿Cómo agrego autenticación a un endpoint?"
```

### Opción 2: Agente Específico

Menciona el área explícitamente:

```
"Backend: ¿cómo agrego autenticación a un endpoint?"
"Frontend: ¿cómo creo un componente de login?"
"BD: Necesito expandir la tabla de usuarios"
```

### Opción 3: Multi-agent (Full Stack)

Para features complejas que requieren múltiples áreas:

```
"Necesito agregar un módulo de reportes con:
- BD: tabla de reportes con filtros
- API: endpoints CRUD
- UI: página con gráficos"
```

---

## 📖 Documentation Structure

```
.github/
├── copilot-instructions.md          # Visión general del proyecto
├── backend-development.md           # Guía detallada backend
├── frontend-development.md          # Guía detallada frontend
├── CONVENTIONS.md                   # Estándares y naming
└── AGENTS.md                        # Este archivo

docs/
└── PRISMA_MIGRATIONS.md             # Guía de migraciones
```

---

## 🔗 Cross-Reference Examples

**Para agregar nueva entidad (Full Stack):**

1. Leer [docs/PRISMA_MIGRATIONS.md](../docs/PRISMA_MIGRATIONS.md) → Pasos 1-3
2. Leer [.github/backend-development.md](.github/backend-development.md) → "Flujo Completo"
3. Leer [.github/frontend-development.md](.github/frontend-development.md) → "Flujo Completo"
4. Validar contra [.github/CONVENTIONS.md](.github/CONVENTIONS.md)

**Para bugfix en controller:**

1. Leer [.github/backend-development.md](.github/backend-development.md) → "Controllers"
2. Validar naming en [.github/CONVENTIONS.md](.github/CONVENTIONS.md)

**Para crear nuevo componente React:**

1. Leer [.github/frontend-development.md](.github/frontend-development.md) → "Componentes"
2. Leer [.github/CONVENTIONS.md](.github/CONVENTIONS.md) → Naming conventions

---

## 💡 Tips

- Siempre menciona **backend** o **frontend** si necesitas respuesta específica
- Para preguntas complejas, describe el contexto completo
- Usa ejemplos de código para mayor precisión
- Consulta la documentation cuando tengas dudas

---

## 🤔 When in Doubt

Si no sabes a quién preguntar:

1. **¿Es sobre BD?** → Mención "Prisma" o "migración"
2. **¿Es sobre Express/Node?** → Mención "backend" o "api"
3. **¿Es sobre React/UI?** → Mención "frontend" o "react"
4. **¿Es sobre ambos?** → Describe el flujo completo
5. **¿Otro?** → Describe el problema en detalle
