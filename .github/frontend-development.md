# Guía de Desarrollo Frontend - Biosoft 2

## Scope

Esta guía se aplica al desarrollo en **Base-Front-BIONATURAL-main/** y proporciona instrucciones detalladas para:
- Crear componentes reutilizables
- Organizar features por dominio
- Comunicarse con la API
- Gestionar autenticación y estado

---

## Estructura de Código Frontend

### Componentes (`src/components/`)

**Patrón obligatorio:**
```typescript
// ui/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      },
      size: {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Reglas:**
- Usar TypeScript con interfaces `{ComponentName}Props`
- Usar `class-variance-authority` para variantes
- Usar `clsx` para clases condicionales
- Exportar el componente y las variantes

### Features (`src/features/`)

**Patrón obligatorio:**
```
src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── hooks/
│   └── useAuth.ts
├── types.ts
└── api.ts
```

```typescript
// src/features/auth/types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}
```

```typescript
// src/features/auth/api.ts
const API_BASE = 'http://localhost:3000/api';

export const loginAPI = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) throw new Error('Login failed');
  return response.json();
};

export const registerAPI = async (name: string, email: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
};
```

```typescript
// src/features/auth/hooks/useAuth.ts
import { create } from 'zustand';
import { User } from '../types';
import { loginAPI, registerAPI } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const data = await loginAPI(email, password);
      set({ user: data.user, token: data.token });
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
}));
```

```typescript
// src/features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirigir a dashboard
    } catch (error) {
      // Mostrar error con toast
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </Button>
    </form>
  );
};
```

### Utilities (`src/lib/`)

**Patrón obligatorio:**
```typescript
// src/lib/api-client.ts
export const createAuthHeader = (token: string | null) => {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la API');
  }
  return response.json();
};

export const apiFetch = async (
  url: string,
  options: RequestInit & { token?: string } = {}
) => {
  const { token, ...init } = options;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeader(token),
      ...init.headers,
    },
  });
  return handleApiResponse(response);
};
```

---

## Flujo Completo: Agregar Nueva Página/Feature

### 1. Crear Feature

```bash
mkdir -p src/features/products/{components,hooks,types}
```

### 2. Definir Tipos

```typescript
// src/features/products/types.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  categoryId: number;
}

export interface ProductFilters {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
}
```

### 3. Crear API Client

```typescript
// src/features/products/api.ts
import { apiFetch } from '../../lib/api-client';
import { Product, ProductFilters } from './types';

export const getProducts = (filters?: ProductFilters) => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category.toString());
  if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  
  return apiFetch(`http://localhost:3000/api/products?${params}`);
};

export const getProduct = (id: number, token: string) =>
  apiFetch(`http://localhost:3000/api/products/${id}`, { token });

export const createProduct = (data: Partial<Product>, token: string) =>
  apiFetch('http://localhost:3000/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
```

### 4. Crear Hook

```typescript
// src/features/products/hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { Product, ProductFilters } from '../types';
import { getProducts } from '../api';

export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts(filters);
        setProducts(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return { products, loading, error };
};
```

### 5. Crear Componentes

```typescript
// src/features/products/components/ProductList.tsx
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';

export const ProductList = () => {
  const { products, loading, error } = useProducts();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

### 6. Agregar Ruta

```typescript
// src/routes.tsx (o src/App.tsx)
import { ProductList } from './features/products/components/ProductList';

const routes = [
  { path: '/', component: Home },
  { path: '/products', component: ProductList },
];
```

---

## Gestión de Estado

**Usar Zustand para estado global:**

```typescript
// src/store/appStore.ts
import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

---

## Styling Patterns

**Tailwind + CVA para componentes:**

```typescript
// src/components/Card.tsx
import { cva } from 'class-variance-authority';

const cardVariants = cva('rounded border p-4', {
  variants: {
    variant: {
      default: 'border-gray-300 bg-white',
      elevated: 'border-none shadow-lg',
    },
  },
});

export const Card = ({ variant = 'default', ...props }) => (
  <div className={cardVariants({ variant })} {...props} />
);
```

---

## Errores Comunes

❌ **Fetch directo en componentes:**
```typescript
// ❌ MAL
export const ProductList = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch('/api/products').then(r => setProducts(r));
  }, []);
};

// ✅ BIEN
export const ProductList = () => {
  const { products } = useProducts();
};
```

❌ **Guardar token en localStorage:**
```typescript
// ❌ MAL
localStorage.setItem('token', token);

// ✅ MEJOR (pero localStorage es aceptable para MVP)
// Usar httpOnly cookies si es posible
```

❌ **No manejar errores de API:**
```typescript
// ❌ MAL
const data = await fetch(...).then(r => r.json());

// ✅ BIEN
try {
  const data = await apiFetch(...);
} catch (error) {
  toast.error(error.message);
}
```

---

## Checklist para Nuevas Features

- [ ] ¿Creé la estructura `features/entity/`?
- [ ] ¿Definí tipos en `types.ts`?
- [ ] ¿Creé funciones de API en `api.ts`?
- [ ] ¿Creé hooks para lógica compartida?
- [ ] ¿Manejé loading y error states?
- [ ] ¿Usé TypeScript en todos los archivos?
- [ ] ¿Agregué la ruta en `routes.tsx`?
- [ ] ¿Probé con la API real?
