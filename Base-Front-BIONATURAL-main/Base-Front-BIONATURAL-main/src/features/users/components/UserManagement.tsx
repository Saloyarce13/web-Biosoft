import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Separator } from '../../../components/ui/separator';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Checkbox } from '../../../components/ui/checkbox';
import { toast } from 'sonner';
import { usePersistedState, STORAGE_KEYS } from '../../../shared/utils/storage';
import { apiFetch, getUsers, getConsolidatedUsers, updateUser, deleteUser, getRoles, toggleUserStatus } from '../../../lib/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Eye, 
  EyeOff,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  CreditCard,
  Building2
} from 'lucide-react';

// Definición de tipos
interface User {
  id: string;
  name?: string;          // campo de la API
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  documentType: 'Cédula' | 'Pasaporte' | 'Tarjeta de identidad';
  documentNumber: string;
  role: string;
  origin?: string;        // 'Usuario' | 'Empleado' | 'Cliente' | 'Proveedor'
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  permissions?: string[];
}

// Tipos de documento
const DOCUMENT_TYPES = [
  { value: 'Cédula', label: 'Cédula' },
  { value: 'Pasaporte', label: 'Pasaporte' },
  { value: 'Tarjeta de identidad', label: 'Tarjeta de identidad' }
];

// Roles disponibles (fallback estático — se reemplaza con los de la API)
const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
  { value: 'user', label: 'Cliente', color: 'bg-gray-100 text-gray-800' },
];

// Usuarios de ejemplo
const SAMPLE_USERS: User[] = [
  {
    id: '1',
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@naturista.com',
    phone: '+57 300 123 4567',
    address: 'Calle Principal 123',
    city: 'Bogotá',
    documentType: 'Cédula',
    documentNumber: '1234567890',
    role: 'Administrador',
    isActive: true,
    lastLogin: '2024-01-20 10:30',
    createdAt: '2024-01-15',
    permissions: ['all']
  },
  {
    id: '2',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    email: 'carlos.mendoza@naturista.com',
    phone: '+57 310 234 5678',
    address: 'Avenida Verde 456',
    city: 'Medellín',
    documentType: 'Cédula',
    documentNumber: '2345678901',
    role: 'Vendedor',
    isActive: true,
    lastLogin: '2024-01-20 09:15',
    createdAt: '2024-01-16',
    permissions: ['sales', 'clients']
  },
  {
    id: '3',
    firstName: 'María',
    lastName: 'López',
    email: 'maria.lopez@naturista.com',
    phone: '+57 320 345 6789',
    address: 'Boulevard Eco 789',
    city: 'Cali',
    documentType: 'Cédula',
    documentNumber: '3456789012',
    role: 'Bodega',
    isActive: true,
    lastLogin: '2024-01-19 16:45',
    createdAt: '2024-01-17',
    permissions: ['inventory', 'products']
  },
  {
    id: '4',
    firstName: 'Roberto',
    lastName: 'Silva',
    email: 'roberto.silva@naturista.com',
    phone: '+57 330 456 7890',
    address: 'Calle Contador 321',
    city: 'Barranquilla',
    documentType: 'Cédula',
    documentNumber: '4567890123',
    role: 'Contador',
    isActive: true,
    lastLogin: '2024-01-19 11:20',
    createdAt: '2024-01-18',
    permissions: ['reports', 'financial']
  },
  {
    id: '5',
    firstName: 'Laura',
    lastName: 'Jiménez',
    email: 'laura.jimenez@gmail.com',
    phone: '+57 340 567 8901',
    address: 'Residencial Verde 654',
    city: 'Cartagena',
    documentType: 'Pasaporte',
    documentNumber: 'AB123456',
    role: 'Cliente',
    isActive: true,
    lastLogin: '2024-01-20 14:30',
    createdAt: '2024-01-19',
    permissions: ['profile']
  },
  {
    id: '6',
    firstName: 'José',
    lastName: 'Ramírez',
    email: 'jose.ramirez@email.com',
    phone: '+57 350 678 9012',
    address: 'Colonia Naturaleza 987',
    city: 'Bucaramanga',
    documentType: 'Cédula',
    documentNumber: '6789012345',
    role: 'Cliente',
    isActive: false,
    lastLogin: '2024-01-15 08:45',
    createdAt: '2024-01-10',
    permissions: ['profile']
  }
];

const ITEMS_PER_PAGE = 5;

export function UserManagement() {
  const [users, setUsers] = usePersistedState<User[]>(STORAGE_KEYS.USERS, SAMPLE_USERS);
  const [apiUsers, setApiUsers] = useState<User[]>([]);
  const [apiRoles, setApiRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        localStorage.removeItem(STORAGE_KEYS.USERS);
        const [usersRes, rolesRes] = await Promise.all([getConsolidatedUsers(), getRoles()]);
        if (usersRes.success) {
          const mapped: User[] = usersRes.data.map((u: any) => ({
            id: String(u.id),
            firstName: u.name?.split(' ')[0] || '',
            lastName: u.name?.split(' ').slice(1).join(' ') || '',
            email: u.email || '',
            phone: (u.phone && !u.phone.includes('@')) ? u.phone : '',
            address: '',
            city: '',
            documentType: (u.documentType as User['documentType']) || 'Cédula',
            documentNumber: u.documentNumber || '',
            role: u.role || 'Sin rol',
            origin: u.origin || 'Usuario',
            isActive: u.isActive,
            lastLogin: 'N/A',
            createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '',
            permissions: [],
          }));
          setApiUsers(mapped);
        }
        if (rolesRes.success) setApiRoles(rolesRes.data.filter((r: any) => r.isActive));
      } catch {
        toast.error('Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayUsers = apiUsers;

  // Estados del formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    documentType: 'Cédula' as User['documentType'],
    documentNumber: '',
    role: 'Cliente',
    isActive: true,
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Filtrar usuarios
  const filteredUsers = displayUsers.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesOrigin = originFilter === 'all' || user.origin === originFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesOrigin && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      documentType: 'Cédula',
      documentNumber: '',
      role: 'Cliente',
      isActive: true,
      password: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedUser(null);
  };

  // Crear usuario
  const handleCreateUser = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error('Nombre, apellido y email son obligatorios');
      return;
    }
    if (!formData.documentNumber.trim()) {
      toast.error('El número de documento es obligatorio');
      return;
    }

    const roleObj = apiRoles.find(r => r.name.toLowerCase() === formData.role.toLowerCase());
    const roleId = roleObj?.id || 4;

    try {
      const res = await (await import('../../../lib/api')).authRegister(
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
        formData.documentNumber,
        roleId,
        formData.phone || undefined,
        formData.documentType || undefined,
        formData.documentNumber || undefined,
      );
      if (res.success !== false) {
        setIsCreateModalOpen(false);
        setCurrentView('list');
        clearForm();
        // Recargar desde la API para ver el nuevo usuario en el listado
        const { getConsolidatedUsers } = await import('../../../lib/api');
        const fresh = await getConsolidatedUsers();
        if (fresh.success) {
          setApiUsers(fresh.data.map((u: any) => ({
            id: String(u.id),
            firstName: u.name?.split(' ')[0] || '',
            lastName: u.name?.split(' ').slice(1).join(' ') || '',
            email: u.email || '',
            phone: u.phone || '',
            address: '',
            city: '',
            documentType: (u.documentType as User['documentType']) || 'Cédula',
            documentNumber: u.documentNumber || '',
            role: u.role || 'Sin rol',
            origin: u.origin || 'Usuario',
            isActive: u.isActive,
            lastLogin: 'N/A',
            createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '',
            permissions: [],
          })));
        }
        toast.success(`Usuario "${formData.firstName} ${formData.lastName}" creado exitosamente`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear usuario');
    }
  };

  // Actualizar usuario
  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error('Datos del usuario incompletos');
      return;
    }

    const roleObj = apiRoles.find(r => r.name.toLowerCase() === formData.role.toLowerCase());
    const updatedData: any = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      isActive: formData.isActive,
    };
    if (roleObj) updatedData.roleId = roleObj.id;

    try {
      // El id puede tener prefijo 'user-', 'emp-', 'cli-' — extraer solo el número
      const rawId = String(selectedUser.id).replace(/^(user-|emp-|cli-|prov-)/, '');
      const res = await updateUser(rawId, updatedData);
      if (res.success) {
        const updatedUser = {
          ...selectedUser,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          role: res.data?.role?.name || formData.role,
          isActive: res.data?.isActive ?? formData.isActive,
          permissions: getDefaultPermissions(formData.role),
        };
        setApiUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
        setIsEditModalOpen(false);
        setCurrentView('list');
        clearForm();
        toast.success(`Usuario "${formData.firstName} ${formData.lastName}" actualizado exitosamente`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar usuario');
    }
  };

  // Cambiar estado del usuario
  const handleToggleUserStatus = async (userId: string) => {
    const user = displayUsers.find(u => u.id === userId);
    if (!user) return;
    try {
      // Enrutar al endpoint correcto según el origen del registro
      const origin = user.origin || 'Usuario';
      const rawId = userId.replace(/^(user|emp|cli|prov)-/, '');
      let endpoint = `/users/${rawId}/status`;
      if (origin === 'Empleado')  endpoint = `/employees/${rawId}/status`;
      if (origin === 'Cliente')   endpoint = `/clients/${rawId}/status`;
      if (origin === 'Proveedor') endpoint = `/providers/${rawId}/status`;

      const res = await apiFetch<any>(endpoint, { method: 'PATCH' });
      if (res.success) {
        setApiUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: res.data.isActive } : u));
        toast.success(res.message);
      }
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    const user = displayUsers.find(u => u.id === userId);
    try {
      const rawId = userId.replace(/^(user|emp|cli|prov)-/, '');
      const res = await deleteUser(rawId);
      if (res.success) {
        setApiUsers(prev => prev.filter(u => u.id !== userId));
        setUsers(prev => prev.filter(u => u.id !== userId));
        setCurrentView('list');
        toast.success(res.message || `Usuario "${user?.firstName} ${user?.lastName}" eliminado exitosamente`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar usuario');
    }
  };

  // Abrir modal de edición
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    // Manejar tanto usuarios de API (name) como del storage (firstName/lastName)
    const firstName = user.firstName || user.name?.split(' ')[0] || '';
    const lastName = user.lastName || user.name?.split(' ').slice(1).join(' ') || '';
    setFormData({
      firstName,
      lastName,
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      documentType: user.documentType || 'Cédula',
      documentNumber: user.documentNumber || '',
      role: user.role || '',
      isActive: user.isActive,
      password: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCurrentView('edit');
  };

  // Abrir modal de detalle
  const openDetailModal = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  // Abrir modal de roles
  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      role: user.role,
      isActive: user.isActive
    });
    setIsRoleModalOpen(true);
  };

  // Obtener permisos por defecto según el rol
  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'Administrador':
        return ['all'];
      case 'Vendedor':
        return ['sales', 'clients', 'products_read'];
      case 'Bodega':
        return ['inventory', 'products', 'purchases'];
      case 'Contador':
        return ['reports', 'financial', 'purchases_read'];
      case 'Cliente':
        return ['profile'];
      default:
        return ['profile'];
    }
  };

  // Obtener color del rol
  const getRoleColor = (role: string) => {
    const roleData = AVAILABLE_ROLES.find(r => r.value === role);
    return roleData?.color || 'bg-gray-100 text-gray-800';
  };

  // Obtener color del origen
  const getOriginColor = (origin?: string) => {
    switch (origin) {
      case 'Usuario':   return 'bg-purple-100 text-purple-800';
      case 'Empleado':  return 'bg-blue-100 text-blue-800';
      case 'Cliente':   return 'bg-green-100 text-green-800';
      case 'Proveedor': return 'bg-orange-100 text-orange-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener iniciales del usuario
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // ── Formulario unificado (crear / editar) ────────────────────────────────────
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errs: Record<string, string> = {};
    const isCreate = currentView === 'create';
    if (!formData.firstName.trim()) errs.firstName = 'Obligatorio';
    if (!formData.lastName.trim()) errs.lastName = 'Obligatorio';
    if (!formData.email.trim()) errs.email = 'Obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email inválido';
    if (!formData.documentType) errs.documentType = 'Obligatorio';
    if (!formData.documentNumber.trim()) errs.documentNumber = 'Obligatorio';
    if (!formData.phone.trim()) errs.phone = 'Obligatorio';
    if (!formData.role) errs.role = 'Obligatorio';
    // En editar, contraseña es opcional; si se ingresa debe cumplir requisitos
    if (!isCreate && formData.password) {
      if (formData.password.length < 8) errs.password = 'Mínimo 8 caracteres';
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'No coinciden';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const F = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
        {label} <span className="text-destructive normal-case font-normal">*</span>
      </Label>
      {children}
      {error && <p className="text-xs text-destructive mt-0.5">⚠ {error}</p>}
    </div>
  );

  if (currentView === 'create' || currentView === 'edit') {
    const isCreate = currentView === 'create';

    const handleSubmit = () => {
      if (!validateForm()) return;
      if (isCreate) handleCreateUser();
      else handleUpdateUser();
    };

    const cancel = () => { setCurrentView('list'); clearForm(); setFormErrors({}); };

    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="w-full max-w-sm mb-2">
          <Button variant="ghost" size="sm" onClick={cancel} className="text-muted-foreground -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />Volver al listado
          </Button>
        </div>

        <div className="w-full max-w-sm border rounded-xl shadow-sm bg-card overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{isCreate ? 'Registrar Usuario' : 'Editar Usuario'}</p>
              <p className="text-xs text-muted-foreground">
                {isCreate ? 'Los campos con * son obligatorios' : `Modificando: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
              </p>
            </div>
          </div>

          {/* Campos */}
          <div className="px-4 py-4 space-y-3">

            {/* Tipo doc + Nº doc — PRIMERO */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="docType" className="text-xs font-medium">Tipo doc. <span className="text-destructive">*</span></Label>
                <Select value={formData.documentType}
                  onValueChange={v => { setFormData(p => ({ ...p, documentType: v as User['documentType'] })); setFormErrors(p => ({ ...p, documentType: '' })); }}>
                  <SelectTrigger id="docType" className={`h-9 text-sm shadow-sm ${formErrors.documentType ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(d => <SelectItem key={d.value} value={d.value} className="text-sm">{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.documentType && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.documentType}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="docNum" className="text-xs font-medium">Nº documento <span className="text-destructive">*</span></Label>
                <Input id="docNum" value={formData.documentNumber}
                  onChange={e => { setFormData(p => ({ ...p, documentNumber: e.target.value })); setFormErrors(p => ({ ...p, documentNumber: '' })); }}
                  placeholder="1234567890"
                  className={`h-9 text-sm shadow-sm ${formErrors.documentNumber ? 'border-destructive' : ''}`} />
                {formErrors.documentNumber && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.documentNumber}</p>}
              </div>
            </div>

            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs font-medium">Nombre <span className="text-destructive">*</span></Label>
                <Input id="firstName" value={formData.firstName}
                  onChange={e => { setFormData(p => ({ ...p, firstName: e.target.value })); setFormErrors(p => ({ ...p, firstName: '' })); }}
                  placeholder="Ej: Ana"
                  className={`h-9 text-sm shadow-sm ${formErrors.firstName ? 'border-destructive' : ''}`} />
                {formErrors.firstName && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.firstName}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs font-medium">Apellido <span className="text-destructive">*</span></Label>
                <Input id="lastName" value={formData.lastName}
                  onChange={e => { setFormData(p => ({ ...p, lastName: e.target.value })); setFormErrors(p => ({ ...p, lastName: '' })); }}
                  placeholder="Ej: García"
                  className={`h-9 text-sm shadow-sm ${formErrors.lastName ? 'border-destructive' : ''}`} />
                {formErrors.lastName && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={formData.email}
                onChange={e => { setFormData(p => ({ ...p, email: e.target.value })); setFormErrors(p => ({ ...p, email: '' })); }}
                placeholder="usuario@email.com"
                className={`h-9 text-sm shadow-sm ${formErrors.email ? 'border-destructive' : ''}`} />
              {formErrors.email && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.email}</p>}
            </div>

            {/* Celular */}
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-medium">Celular <span className="text-destructive">*</span></Label>
              <Input id="phone" value={formData.phone}
                onChange={e => { const val = e.target.value.replace(/\D/g, ''); setFormData(p => ({ ...p, phone: val })); setFormErrors(p => ({ ...p, phone: '' })); }}
                placeholder="3001234567"
                inputMode="numeric"
                className={`h-9 text-sm shadow-sm ${formErrors.phone ? 'border-destructive' : ''}`} />
              {formErrors.phone && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.phone}</p>}
            </div>

            {/* Rol */}
            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs font-medium">Rol <span className="text-destructive">*</span></Label>
              <Select value={formData.role}
                onValueChange={v => { setFormData(p => ({ ...p, role: v })); setFormErrors(p => ({ ...p, role: '' })); }}>
                <SelectTrigger id="role" className={`h-9 text-sm shadow-sm ${formErrors.role ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {(apiRoles.length > 0 ? apiRoles.map(r => ({ value: r.name, label: r.name })) : AVAILABLE_ROLES).map(r => (
                    <SelectItem key={r.value} value={r.value} className="text-sm">{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.role && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.role}</p>}
            </div>

            {/* Contraseña */}
            {isCreate ? (
              <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                La contraseña inicial será el número de documento ingresado.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="pw" className="text-xs font-medium">Nueva Contraseña <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <div className="relative">
                    <Input id="pw" type={showPassword ? 'text' : 'password'} value={formData.password}
                      onChange={e => { setFormData(p => ({ ...p, password: e.target.value })); setFormErrors(p => ({ ...p, password: '' })); }}
                      placeholder="Mín. 8 caracteres"
                      className={`h-9 text-sm shadow-sm pr-9 ${formErrors.password ? 'border-destructive' : ''}`} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                      onClick={() => setShowPassword(p => !p)}>
                      {showPassword ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                  </div>
                  {formErrors.password && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.password}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cpw" className="text-xs font-medium">Confirmar</Label>
                  <div className="relative">
                    <Input id="cpw" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
                      onChange={e => { setFormData(p => ({ ...p, confirmPassword: e.target.value })); setFormErrors(p => ({ ...p, confirmPassword: '' })); }}
                      placeholder="Repite"
                      className={`h-9 text-sm shadow-sm pr-9 ${formErrors.confirmPassword ? 'border-destructive' : ''}`} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(p => !p)}>
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                  </div>
                  {formErrors.confirmPassword && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.confirmPassword}</p>}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                    <p className="text-xs text-green-600">✓ Coinciden</p>
                  )}
                </div>
              </div>
            )}            {/* Estado */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 shadow-sm">
              <div>
                <p className="text-xs font-medium">Estado</p>
                <p className="text-xs text-muted-foreground">{formData.isActive ? 'Activo' : 'Inactivo'}</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={v => setFormData(p => ({ ...p, isActive: v }))} />
            </div>

            {!isCreate && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1.5">
                ⚠ Ingresa una nueva contraseña para cambiarla.
              </p>
            )}

            {/* Botones */}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSubmit} className="flex-1 h-9 text-sm">
                {isCreate ? <><Plus className="h-3.5 w-3.5 mr-1.5" />Registrar</> : <><Edit className="h-3.5 w-3.5 mr-1.5" />Actualizar</>}
              </Button>
              <Button variant="outline" onClick={cancel} className="flex-1 h-9 text-sm">Cancelar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground">
            Administra todos los usuarios del sistema ({filteredUsers.length} usuarios)
          </p>
        </div>
        
        <Button onClick={() => { clearForm(); setCurrentView('create'); }}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Usuario
        </Button>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Usuario">Usuario</SelectItem>
                  <SelectItem value="Empleado">Empleado</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Proveedor">Proveedor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {(apiRoles.length > 0 ? apiRoles.map(r => ({ value: r.name, label: r.name })) : AVAILABLE_ROLES).map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Mostrando {paginatedUsers.length} de {filteredUsers.length} usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Rol / Cargo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                  <TableRow key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                  <TableCell>
                    {user.documentNumber
                      ? <div className="text-sm"><span className="font-medium">{user.documentType}</span><p className="text-muted-foreground text-xs">{user.documentNumber}</p></div>
                      : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                        <AvatarFallback className={`text-xs ${user.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {getUserInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getOriginColor(user.origin)}>
                      {user.origin || 'Usuario'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleUserStatus(user.id)}
                        className="scale-90"
                      />
                      <span className="text-sm text-muted-foreground">
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Ver detalle — siempre disponible */}
                      <Button variant="ghost" size="sm"
                        onClick={() => openDetailModal(user)} title="Ver detalle">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {/* Editar — bloqueado si inactivo */}
                      <Button variant="ghost" size="sm"
                        onClick={() => user.isActive && openEditModal(user)}
                        disabled={!user.isActive}
                        title={user.isActive ? 'Editar usuario' : 'Usuario inactivo'}>
                        <Edit className={`h-4 w-4 ${user.isActive ? 'text-muted-foreground' : 'text-muted-foreground/30'}`} />
                      </Button>
                      {/* Eliminar — bloqueado si inactivo */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm"
                            disabled={!user.isActive}
                            title={user.isActive ? 'Eliminar usuario' : 'Usuario inactivo'}>
                            <Trash2 className={`h-4 w-4 ${user.isActive ? 'text-destructive' : 'text-muted-foreground/30'}`} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El usuario "{user.firstName} {user.lastName}" será eliminado permanentemente del sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Ver Detalle del Usuario */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Detalle del Usuario
            </DialogTitle>
            <DialogDescription>
              Información completa de {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.avatar} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                  <AvatarFallback className="text-2xl">
                    {getUserInitials(selectedUser.firstName, selectedUser.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Celular</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {selectedUser.phone || 'No especificado'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de Documento</Label>
                  <p className="font-medium flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {selectedUser.documentType}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Número de Documento</Label>
                  <p className="font-medium">{selectedUser.documentNumber || 'No especificado'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedUser.address || 'No especificada'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ciudad</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {selectedUser.city || 'No especificada'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                    {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Creación</Label>
                  <p className="font-medium">{selectedUser.createdAt}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Último Acceso</Label>
                  <p className="font-medium">{selectedUser.lastLogin}</p>
                </div>
              </div>

              {selectedUser.permissions && selectedUser.permissions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Permisos</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUser.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline">{permission}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Asignar Rol/Permisos */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asignar Rol y Permisos</DialogTitle>
            <DialogDescription>
              Gestionar el rol y permisos de: {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Rol Actual</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {apiRoles.length > 0
                    ? apiRoles.map(role => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))
                    : AVAILABLE_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Permisos por Rol</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="text-sm space-y-1">
                  {getDefaultPermissions(formData.role).map((permission, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (selectedUser) {
                handleUpdateUser();
                setIsRoleModalOpen(false);
              }
            }}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
