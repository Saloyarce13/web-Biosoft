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
import { DataTable, Column } from '../../../shared/components/DataTable';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Checkbox } from '../../../components/ui/checkbox';
import { toast } from 'sonner';
import { usePersistedState, STORAGE_KEYS } from '../../../shared/utils/storage';
import { apiFetch, getUsers, getConsolidatedUsers, updateUser, deleteUser, getRoles, toggleUserStatus } from '../../../lib/api';
import { useDocumentTypesUser } from '../../../shared/contexts/SystemConfigContext';
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
  documentType: string;   // CC, CE, PA, TI, NIT, etc. — viene de la BD
  documentNumber: string;
  role: string;
  origin?: string;        // 'Usuario' | 'Empleado' | 'Cliente' | 'Proveedor'
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  permissions?: string[];
}

// Tipos de documento — se cargan desde la BD vía SystemConfigContext
// (ver useDocumentTypesUser en el componente)

// Roles disponibles (fallback estático — se reemplaza con los de la API)
const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
  { value: 'user', label: 'Cliente', color: 'bg-gray-100 text-gray-800' },
];



const ITEMS_PER_PAGE = 5;

export function UserManagement() {
  const DOCUMENT_TYPES = useDocumentTypesUser();
  const [users, setUsers] = usePersistedState<User[]>(STORAGE_KEYS.USERS, []);
  const [apiUsers, setApiUsers] = useState<User[]>([]);
  const [apiRoles, setApiRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
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

  const displayUsers = apiUsers.filter(u => u.origin !== 'Proveedor');

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
    // Campos extra según rol
    birthDate: '',
    hireDate: '',
    salary: '',
    position: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Filtrar usuarios
  const filteredUsers = displayUsers.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesOrigin = originFilter === 'all' || user.origin === originFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesRole && matchesOrigin && matchesStatus;
  });

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
      birthDate: '',
      hireDate: '',
      salary: '',
      position: '',
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
    const fullName = `${formData.firstName} ${formData.lastName}`;
    const rol = formData.role.toLowerCase();
    const isEmpleado = ['vendedor', 'bodega', 'contador', 'administrador'].includes(rol);
    const isCliente  = rol === 'cliente' || rol === 'user';

    try {
      const api = await import('../../../lib/api');

      // 1. Crear el usuario en la tabla users
      const res = await api.authRegister(
        fullName, formData.email, formData.documentNumber, roleId,
        formData.phone || undefined, formData.documentType || undefined,
        formData.documentNumber || undefined,
      );

      if (res.success !== false) {
        // 2. Si es empleado, crear también en tabla Employee
        if (isEmpleado) {
          try {
            await api.apiFetch('/employees', {
              method: 'POST',
              body: JSON.stringify({
                fullName,
                email: formData.email,
                phone: formData.phone || undefined,
                documentType: formData.documentType || undefined,
                documentNumber: formData.documentNumber || undefined,
                address: formData.address || undefined,
                birthDate: formData.birthDate || undefined,
                hireDate: formData.hireDate || undefined,
                salary: formData.salary ? parseFloat(formData.salary) : undefined,
                position: formData.position || formData.role,
                isActive: true,
              }),
            });
          } catch { /* no bloquear si falla el empleado */ }
        }

        // 3. Si es cliente, crear también en tabla Client
        if (isCliente) {
          try {
            await api.apiFetch('/clients', {
              method: 'POST',
              body: JSON.stringify({
                name: fullName,
                email: formData.email,
                phone: formData.phone || undefined,
                documentType: formData.documentType || undefined,
                documentNumber: formData.documentNumber || undefined,
                address: formData.address || undefined,
              }),
            });
          } catch { /* no bloquear si falla el cliente */ }
        }

        setIsCreateModalOpen(false);
        setCurrentView('list');
        clearForm();
        const fresh = await api.getConsolidatedUsers();
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
        toast.success(`Usuario "${fullName}" creado exitosamente`);
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
      // Documento y teléfono — se sincronizan en employees/clients automáticamente
      documentType:   formData.documentType   || undefined,
      documentNumber: formData.documentNumber || undefined,
      phone:          formData.phone          || undefined,
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
      birthDate: '',
      hireDate: '',
      salary: '',
      position: '',
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
      isActive: user.isActive,
      password: '',
      confirmPassword: '',
      birthDate: '',
      hireDate: '',
      salary: '',
      position: '',
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
    const rol = (formData.role || '').toLowerCase();
    const isEmpleado = ['vendedor', 'bodega', 'contador', 'administrador'].includes(rol);

    if (!formData.firstName.trim()) errs.firstName = 'Obligatorio';
    if (!formData.lastName.trim()) errs.lastName = 'Obligatorio';
    if (!formData.email.trim()) errs.email = 'Obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email inválido';
    if (!formData.documentType) errs.documentType = 'Obligatorio';
    if (!formData.documentNumber.trim()) errs.documentNumber = 'Obligatorio';
    else if (!/^\d{8,15}$/.test(formData.documentNumber.trim())) errs.documentNumber = '8-15 dígitos numéricos';
    if (!formData.phone.trim()) errs.phone = 'Obligatorio';
    else if (!/^\+?\d{10,20}$/.test(formData.phone.trim())) errs.phone = '10-20 dígitos (puede incluir +)';
    if (!formData.role) errs.role = 'Obligatorio';

    // Validaciones específicas para empleados
    if (isEmpleado) {
      if (!formData.birthDate) {
        errs.birthDate = 'Obligatorio';
      } else {
        const birth = new Date(formData.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear() -
          (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        if (age < 18) errs.birthDate = 'Debe ser mayor de 18 años';
      }
      if (!formData.hireDate) errs.hireDate = 'Obligatorio';
      if (!formData.salary || Number(formData.salary) <= 0) errs.salary = 'Obligatorio y mayor a 0';
    }

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
              <p className="font-semibold text-sm">{isCreate ? 'Nuevo Usuario' : 'Editar Usuario'}</p>
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

            {/* ── Campos extra según rol ─────────────────────────────── */}
            {/* Dirección — para todos */}
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-medium">Dirección</Label>
              <Input id="address" value={formData.address}
                onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                placeholder="Calle 123 #45-67"
                className="h-9 text-sm shadow-sm" />
            </div>

            {/* Campos solo para roles de empleado */}
            {(() => {
              const rol = formData.role.toLowerCase();
              const isEmpleado = ['vendedor', 'bodega', 'contador', 'administrador'].includes(rol);
              const isCliente  = rol === 'cliente' || rol === 'user';
              if (!isEmpleado && !isCliente) return null;
              return (
                <>
                  {isEmpleado && (
                    <>
                      {/* Cargo */}
                      <div className="space-y-1">
                        <Label htmlFor="position" className="text-xs font-medium">Cargo <span className="text-destructive">*</span></Label>
                        <Input id="position" value={formData.position}
                          onChange={e => setFormData(p => ({ ...p, position: e.target.value }))}
                          placeholder="Ej: Vendedor, Bodeguero..."
                          className="h-9 text-sm shadow-sm" />
                      </div>
                      {/* Fecha nacimiento + Fecha contratación */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="birthDate" className="text-xs font-medium">Fecha nacimiento <span className="text-destructive">*</span></Label>
                          <Input id="birthDate" type="date" value={formData.birthDate}
                            onChange={e => { setFormData(p => ({ ...p, birthDate: e.target.value })); setFormErrors(p => ({ ...p, birthDate: '' })); }}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                            className={`h-9 text-sm shadow-sm ${formErrors.birthDate ? 'border-destructive' : ''}`} />
                          {formErrors.birthDate
                            ? <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.birthDate}</p>
                            : <p className="text-xs text-muted-foreground">Debe ser mayor de 18 años</p>}
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="hireDate" className="text-xs font-medium">Fecha contratación <span className="text-destructive">*</span></Label>
                          <Input id="hireDate" type="date" value={formData.hireDate}
                            onChange={e => { setFormData(p => ({ ...p, hireDate: e.target.value })); setFormErrors(p => ({ ...p, hireDate: '' })); }}
                            className={`h-9 text-sm shadow-sm ${formErrors.hireDate ? 'border-destructive' : ''}`} />
                          {formErrors.hireDate && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.hireDate}</p>}
                        </div>
                      </div>
                      {/* Salario */}
                      <div className="space-y-1">
                        <Label htmlFor="salary" className="text-xs font-medium">Salario (COP) <span className="text-destructive">*</span></Label>
                        <Input id="salary" type="number" min={0} value={formData.salary}
                          onChange={e => { setFormData(p => ({ ...p, salary: e.target.value })); setFormErrors(p => ({ ...p, salary: '' })); }}
                          placeholder="Ej: 2000000"
                          className={`h-9 text-sm shadow-sm ${formErrors.salary ? 'border-destructive' : ''}`} />
                        {formErrors.salary && <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" />{formErrors.salary}</p>}
                      </div>
                    </>
                  )}
                </>
              );
            })()}

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
                {isCreate ? <><Plus className="h-3.5 w-3.5 mr-1.5" />Guardar</> : <><Edit className="h-3.5 w-3.5 mr-1.5" />Actualizar</>}
              </Button>
              <Button variant="outline" onClick={cancel} className="flex-1 h-9 text-sm">Cancelar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tableColumns: Column<User>[] = [
    {
      header: 'Usuario',
      accessor: (user) => {
        const isInactive = !user.isActive;
        return (
          <div className="flex items-center gap-3">
            <Avatar className={`h-10 w-10 ${isInactive ? 'opacity-50' : ''}`}>
              <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className={isInactive ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}>
                {getUserInitials(user.firstName || '', user.lastName || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className={`font-medium ${isInactive ? 'text-muted-foreground' : ''}`}>{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Rol',
      accessor: (user) => (
        <Badge className={getRoleColor(user.role)}>
          {user.role}
        </Badge>
      )
    },
    {
      header: 'Origen',
      accessor: (user) => (
        <Badge className={getOriginColor(user.origin)}>
          {user.origin}
        </Badge>
      )
    },
    {
      header: 'Estado',
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={user.isActive}
            onCheckedChange={() => handleToggleUserStatus(user.id)}
          />
          <span className="text-sm text-muted-foreground">
            {user.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )
    },
    {
      header: 'Último Acceso',
      accessor: (user) => (
        <span className="text-sm text-muted-foreground">{user.lastLogin}</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Usuarios
          </h2>
        </div>
        
        <Button onClick={() => { clearForm(); setCurrentView('create'); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <DataTable
        title="Usuarios"
        description={`Mostrando ${filteredUsers.length} usuarios en total`}
        data={filteredUsers}
        columns={tableColumns}
        searchableKeys={['firstName', 'lastName', 'email']}
        searchPlaceholder="Buscar por nombre o email..."
        itemsPerPage={ITEMS_PER_PAGE}
        isLoading={loading}
        onEdit={(u) => { if(u.isActive) openEditModal(u); else toast.error('Usuario inactivo'); }}
        onDelete={(u) => { if(u.isActive) setUserToDelete(u); else toast.error('Usuario inactivo'); }}
        customActions={(user) => (
          <>
            <Button variant="ghost" size="icon" onClick={() => openDetailModal(user)} title="Ver detalles" className="h-8 w-8">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => user.isActive && openRoleModal(user)} disabled={!user.isActive} title={user.isActive ? 'Asignar rol/permisos' : 'Usuario inactivo'} className="h-8 w-8">
              <Shield className={`w-4 h-4 ${user.isActive ? 'text-indigo-600' : 'text-muted-foreground/30'}`} />
            </Button>
          </>
        )}
        extraFilters={
          <div className="flex flex-wrap gap-2">
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-[140px] h-9">
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
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Rol" />
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
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario "{userToDelete?.firstName} {userToDelete?.lastName}" será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  handleDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
