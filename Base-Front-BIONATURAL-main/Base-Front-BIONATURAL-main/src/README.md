# 🌿 Bionatural - Sistema de Gestión Integral

Sistema completo de gestión para tienda naturista con roles diferenciados, CRUD completo, y experiencia de cliente online.

## 🚀 Inicio Rápido

### Usuarios de Prueba

```
👨‍💼 Administrador:  admin@naturista.com     / admin123
👨‍💻 Vendedor:      vendedor@naturista.com  / vendedor123  
📦 Bodega:         bodega@naturista.com    / bodega123
💰 Contador:       contador@naturista.com  / contador123
🛍️  Cliente:        cliente@naturista.com   / cliente123
```

## 📋 Características Principales

### ✅ Gestión Completa (CRUD)
- **Usuarios** - Administración de usuarios del sistema
- **Roles** - Gestión de permisos por rol
- **Productos** - Catálogo completo con imágenes
- **Categorías** - Organización de productos
- **Proveedores** - Gestión de proveedores
- **Clientes** - Base de datos de clientes
- **Compras** - Gestión de compras a proveedores
- **Pedidos** - Gestión de pedidos de clientes
- **Ventas** - Registro de ventas
  

  
### 🛒 Tienda Online para Clientes
- Catálogo de productos
- Carrito de compras
- Proceso de checkout
- Mis pedidos
- Perfil de usuario
- Métodos de pago

### 🎯 Características Técnicas
- ✅ Paginación de 5 elementos por página
- ✅ Switches animados para estados
- ✅ Botón de anular en Ventas, Pedidos y Compras
- ✅ IVA del 19% correctamente aplicado
- ✅ Recolección en tienda (sin domicilios)
- ✅ Persistencia con localStorage
- ✅ Validaciones completas
- ✅ Responsive design

## 🔐 Roles y Permisos

### Administrador 👨‍💼
Acceso completo a todos los módulos:
- Dashboard y Reportes
- Gestión de Usuarios
- Gestión de Roles
- Proveedores
- Productos
- Categorías
- Compras
- Clientes ⭐
- Pedidos
- Ventas

### Vendedor 👨‍💻
- Dashboard y Reportes
- Productos
- Clientes ⭐
- Pedidos
- Ventas

### Bodega 📦
- Dashboard y Reportes
- Productos
- Compras

### Contador 💰
- Dashboard y Reportes
- Compras

### Cliente 🛍️
Vista completamente diferente sin sidebar:
- Tienda Online
- Carrito de Compras
- Checkout
- Mis Pedidos
- Mi Perfil
- Notificaciones
- Métodos de Pago

## 📁 Estructura del Proyecto

```
/
├── App.tsx                          # Componente principal
├── components/
│   ├── AuthLogin.tsx               # Login y registro
│   ├── AppHeader.tsx               # Encabezado
│   ├── UserSidebar.tsx             # Panel de usuario
│   ├── Footer.tsx                  # Pie de página
│   │
│   ├── UserManagement.tsx          # Gestión de usuarios
│   ├── RoleManagement.tsx          # Gestión de roles
│   ├── ProductManagement.tsx       # Gestión de productos
│   ├── CategoryManagement.tsx      # Gestión de categorías
│   ├── ProviderManagement.tsx      # Gestión de proveedores
│   ├── ClientManagement.tsx        # Gestión de clientes ⭐
│   ├── PurchaseManagement.tsx      # Gestión de compras
│   ├── OrderManagement.tsx         # Gestión de pedidos
│   ├── SalesManagement.tsx         # Gestión de ventas
│   ├── ReportsAnalytics.tsx        # Dashboard y reportes
│   │
│   ├── ClientProfile.tsx           # Perfil de cliente
│   ├── ClientOrders.tsx            # Pedidos del cliente
│   ├── ClientNotifications.tsx     # Notificaciones
│   ├── ClientPaymentMethods.tsx    # Métodos de pago
│   ├── CheckoutFlow.tsx            # Proceso de checkout
│   ├── ShoppingCartSidebar.tsx     # Carrito de compras
│   ├── ProductDetailModal.tsx      # Detalle de producto
│   │
│   └── ui/                         # Componentes Shadcn UI
│
├── utils/
│   └── storage.ts                  # Utilidades de localStorage
│
└── styles/
    └── globals.css                 # Estilos globales
```

## 🛠️ Módulo de Clientes (Destacado)

### Acceso
- Solo visible para roles: **Administrador** y **Vendedor**
- Ubicación en sidebar: Icono 🛍️ "Clientes"

### Funcionalidades
1. **Crear Cliente**
   - Nombre y apellido
   - Email (único)
   - Celular
   - Tipo y número de documento (único)
   - Dirección completa
   - Estado (Activo/Inactivo)
   - Notas

2. **Editar Cliente**
   - Modificar cualquier campo
   - Validación de email y documento únicos
   - Actualización de fecha de modificación

3. **Ver Detalle**
   - Modal con información completa
   - Avatar con iniciales
   - Información de contacto
   - Dirección
   - Última compra
   - Fechas de creación y actualización

4. **Eliminar Cliente**
   - Confirmación con AlertDialog
   - Eliminación permanente

5. **Cambiar Estado**
   - Switch animado en la tabla
   - Toggle entre Activo/Inactivo

6. **Buscar y Filtrar**
   - Búsqueda por: nombre, email, teléfono, documento, ciudad
   - Filtro por estado
   - Ordenamiento múltiple

7. **Paginación**
   - 5 clientes por página
   - Navegación anterior/siguiente

### Datos de Prueba
El sistema incluye 8 clientes de ejemplo:
- María González (Activo)
- Carlos Mendoza (Activo)
- Ana López (Activo)
- Roberto Silva (Activo)
- Lucía Ramírez (Activo)
- Fernando Castro (Inactivo)
- Patricia Torres (Inactivo)
- Diego Herrera (Activo)

## 🐛 Troubleshooting

### No puedo acceder al módulo de Clientes

**Solución 1: Verificar Rol**
- Asegúrate de estar logueado como Administrador o Vendedor
- Otros roles no tienen acceso a este módulo

**Solución 2: Limpiar Cache**
```
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. Busca "Local Storage"
4. Elimina todas las entradas que empiezan con "bionatural_"
5. Recarga la página (Ctrl+R o Cmd+R)
6. Vuelve a iniciar sesión
```

**Solución 3: Hard Refresh**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Solución 4: Verificar Consola**
```
1. Abre consola del navegador (F12)
2. Ve a pestaña "Console"
3. Busca errores en rojo
4. Si hay errores de importación, reporta el problema
```

### La página está en blanco

**Solución:**
```
1. Verifica la consola del navegador (F12)
2. Busca errores JavaScript
3. Limpia el localStorage
4. Recarga la página
```

### Los datos no se guardan

**Solución:**
```
1. Verifica que localStorage esté habilitado en tu navegador
2. Revisa el espacio disponible en localStorage
3. Limpia datos antiguos si es necesario
```

## 💾 Persistencia de Datos

Todos los datos se guardan en localStorage del navegador con las siguientes keys:

```typescript
bionatural_users         // Usuarios
bionatural_products      // Productos
bionatural_categories    // Categorías
bionatural_providers     // Proveedores
bionatural_clients       // Clientes ⭐
bionatural_purchases     // Compras
bionatural_orders        // Pedidos
bionatural_sales         // Ventas
```

### Resetear Datos
Para volver a los datos iniciales:

```javascript
// En la consola del navegador
Object.keys(localStorage)
  .filter(key => key.startsWith('bionatural_'))
  .forEach(key => localStorage.removeItem(key));

// Luego recarga la página
location.reload();
```

## 📊 IVA y Precios

- **IVA configurado al 19%** (Colombia)
- Se aplica en:
  - Compras
  - Ventas
  - Pedidos
  - Checkout de clientes

## 🏪 Recolección en Tienda

El sistema está configurado para **recolección en tienda únicamente**:
- No se manejan domicilios
- Cliente selecciona fecha y hora de recolección
- Se solicita teléfono de contacto para coordinación

## 📚 Documentación Adicional

- `ESTADO_SISTEMA_COMPLETO.md` - Estado general del sistema
- `TEST_INTEGRIDAD_SISTEMA.md` - Pruebas y verificaciones
- `CAMBIOS_APLICADOS.md` - Historial de cambios
- `REPORTE_FINAL.md` - Reporte final de implementación

## 🎨 UI/UX

- Diseño responsivo
- Tema personalizado con colores naturales
- Componentes Shadcn UI
- Iconos Lucide React
- Animaciones suaves
- Feedback visual en todas las acciones

## ⚡ Rendimiento

- Paginación para manejar grandes cantidades de datos
- Lazy loading de componentes
- Optimización de re-renders
- localStorage para persistencia rápida

## 🔮 Próximos Pasos

1. Integración con backend real
2. Sistema de reportes avanzados
3. Exportación a PDF
4. Notificaciones push
5. Sistema de inventario automático
6. Modo oscuro

## 📞 Soporte

Si encuentras algún problema:

1. Revisa la sección de Troubleshooting
2. Verifica los documentos de estado y pruebas
3. Revisa la consola del navegador para errores
4. Limpia el localStorage y recarga

---

## 🎯 Estado Actual

**✅ SISTEMA COMPLETAMENTE FUNCIONAL**

Todos los módulos están implementados, probados y funcionando correctamente.

### Última Actualización
5 de noviembre de 2025

### Versión
1.0.0 - Producción Ready

---

**Desarrollado con ❤️ para Bionatural**
