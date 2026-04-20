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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { usePersistedState, STORAGE_KEYS } from '../../../shared/utils/storage';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../../lib/api';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  CreditCard,
  Building2,
  UserCheck,
  Briefcase,
  DollarSign
} from 'lucide-react';

// Definición de tipos
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  documentType: 'CC' | 'CE' | 'PAS' | 'NIT';
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  position: 'Administrador' | 'Vendedor';
  salary: number;
  hireDate: string;
  isActive: boolean;
  avatar?: string;
}

// Tipos de documento (sin Tarjeta de Identidad)
const DOCUMENT_TYPES = [
  { value: 'CC',  label: 'Cédula de Ciudadanía' },
  { value: 'CE',  label: 'Cédula de Extranjería' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
];

// Cargos disponibles
const AVAILABLE_POSITIONS = [
  { value: 'Administrador', label: 'Administrador', color: 'bg-red-100 text-red-800' },
  { value: 'Vendedor', label: 'Vendedor', color: 'bg-blue-100 text-blue-800' }
];

// Empleados de ejemplo
const SAMPLE_EMPLOYEES: Employee[] = [
  {
    id: '1', firstName: 'Ana', lastName: 'García Martínez',
    documentType: 'CC', documentNumber: '1234567890',
    phone: '+57 300 123 4567', email: 'ana.garcia@bionatural.com',
    address: 'Calle Principal 123', birthDate: '1990-05-15',
    position: 'Administrador', salary: 3500000, hireDate: '2023-01-15', isActive: true
  },
  {
    id: '2', firstName: 'Carlos', lastName: 'Mendoza Silva',
    documentType: 'CC', documentNumber: '2345678901',
    phone: '+57 310 234 5678', email: 'carlos.mendoza@bionatural.com',
    address: 'Avenida Verde 456', birthDate: '1988-08-20',
    position: 'Vendedor', salary: 2200000, hireDate: '2023-03-10', isActive: true
  },
  {
    id: '3', firstName: 'María', lastName: 'López Hernández',
    documentType: 'CE', documentNumber: '3456789012',
    phone: '+57 320 345 6789', email: 'maria.lopez@bionatural.com',
    address: 'Boulevard Eco 789', birthDate: '1992-12-03',
    position: 'Vendedor', salary: 2200000, hireDate: '2023-06-01', isActive: true
  },
  {
    id: '4', firstName: 'Roberto', lastName: 'Silva Rojas',
    documentType: 'CC', documentNumber: '4567890123',
    phone: '+57 330 456 7890', email: 'roberto.silva@bionatural.com',
    address: 'Calle Contador 321', birthDate: '1985-03-25',
    position: 'Administrador', salary: 3800000, hireDate: '2022-09-15', isActive: true
  },
  {
    id: '5', firstName: 'Laura', lastName: 'Jiménez Castro',
    documentType: 'PAS', documentNumber: '5678901234',
    phone: '+57 340 567 8901', email: 'laura.jimenez@bionatural.com',
    address: 'Residencial Verde 654', birthDate: '1995-07-18',
    position: 'Vendedor', salary: 2000000, hireDate: '2024-01-10', isActive: false
  },
  {
    id: '6', firstName: 'José', lastName: 'Ramírez Gómez',
    documentType: 'CC', documentNumber: '6789012345',
    phone: '+57 350 678 9012', email: 'jose.ramirez@bionatural.com',
    address: 'Colonia Naturaleza 987', birthDate: '1991-11-08',
    position: 'Vendedor', salary: 2100000, hireDate: '2023-08-20',
    isActive: true
  }
];

const ITEMS_PER_PAGE = 5;

export function EmployeeManagement() {
  const [employees, setEmployees] = usePersistedState<Employee[]>(STORAGE_KEYS.EMPLOYEES || 'employees', []);
  const [apiEmployees, setApiEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const mapEmployee = (e: any): Employee => ({
    id: String(e.id),
    firstName: e.fullName?.split(' ')[0] || e.fullName || '',
    lastName: e.fullName?.split(' ').slice(1).join(' ') || '',
    documentType: e.documentType || 'CC',
    documentNumber: e.documentNumber || '',
    phone: e.phone || '',
    email: e.email || '',
    address: e.address || '',
    birthDate: e.birthDate ? new Date(e.birthDate).toISOString().split('T')[0] : '',
    position: e.position || 'Vendedor',
    salary: Number(e.salary) || 0,
    hireDate: e.hireDate ? new Date(e.hireDate).toISOString().split('T')[0] : (e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : ''),
    isActive: e.isActive,
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('bionatural_employees');
      const res = await getEmployees();
      if (res.success) {
        setApiEmployees(res.data.map(mapEmployee));
      }
    } catch {
      toast.error('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [activeRoles, setActiveRoles] = useState<{ value: string; label: string; color: string }[]>(AVAILABLE_POSITIONS);

  useEffect(() => {
    loadEmployees();
    // Cargar roles activos de la API para el selector de posición
    import('../../../lib/api').then(({ getRoles }) => {
      getRoles().then(res => {
        if (res.success) {
          const roles = (res.data as any[])
            .filter(r => r.isActive && !['user', 'cliente', 'invitado'].includes(r.name.toLowerCase()))
            .map(r => ({
              value: r.name.charAt(0).toUpperCase() + r.name.slice(1),
              label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
              color: 'bg-gray-100 text-gray-800',
            }));
          if (roles.length > 0) setActiveRoles(roles);
        }
      }).catch(() => {});
    });
  }, []);

  const displayEmployees = apiEmployees;

  // Estados del formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentType: 'CC' as Employee['documentType'],
    documentNumber: '',
    phone: '',
    email: '',
    address: '',
    birthDate: '',
    position: 'Vendedor' as Employee['position'],
    salary: 0,
    hireDate: '',
    isActive: true,
    password: '',
    confirmPassword: '',
  });
  const [salaryDisplay, setSalaryDisplay] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Filtrar empleados
  const filteredEmployees = displayEmployees.filter(employee => {
    const fullName = `${employee.firstName} ${employee.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.documentNumber.includes(searchTerm);
    const matchesPosition = positionFilter === 'all' || employee.position === positionFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && employee.isActive) ||
                         (statusFilter === 'inactive' && !employee.isActive);
    
    return matchesSearch && matchesPosition && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Formatear entrada de sueldo en pesos colombianos
  const handleSalaryInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setSalaryDisplay('');
      setFormData(prev => ({ ...prev, salary: 0 }));
      return;
    }
    const num = parseInt(digits, 10);
    setSalaryDisplay(new Intl.NumberFormat('es-CO').format(num));
    setFormData(prev => ({ ...prev, salary: num }));
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      documentType: 'CC',
      documentNumber: '',
      phone: '',
      email: '',
      address: '',
      birthDate: '',
      position: 'Vendedor',
      salary: 0,
      hireDate: '',
      isActive: true,
      password: '',
      confirmPassword: '',
    });
    setSalaryDisplay('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedEmployee(null);
  };

  // Abrir vista de crear — siempre limpia el salaryDisplay
  const openCreateView = () => {
    clearForm();
    setSalaryDisplay('');
    setCurrentView('create');
  };

  // Regex de validaciones
  const PHONE_REGEX = /^\d+$/;
  const DOC_REGEX   = /^\d{1,15}$/;
  const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  // Crear empleado
  const handleCreateEmployee = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Nombre y apellido son obligatorios'); return;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio'); return;
    }
    if (!formData.documentNumber.trim()) {
      toast.error('El número de documento es obligatorio'); return;
    }
    if (!DOC_REGEX.test(formData.documentNumber)) {
      toast.error('El número de documento solo acepta entre 1 y 15 dígitos numéricos'); return;
    }
    if (!formData.birthDate) {
      toast.error('La fecha de nacimiento es obligatoria'); return;
    }
    const birth = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (age < 18) {
      toast.error('El empleado debe ser mayor de 18 años'); return;
    }
    if (formData.phone && !PHONE_REGEX.test(formData.phone)) {
      toast.error('El teléfono solo acepta números sin espacios ni letras'); return;
    }
    if (!formData.salary || formData.salary <= 0) {
      toast.error('El sueldo es obligatorio'); return;
    }

    try {
      const res = await createEmployee({
        fullName:       `${formData.firstName} ${formData.lastName}`,
        email:          formData.email,
        phone:          formData.phone || undefined,
        documentType:   formData.documentType,
        documentNumber: formData.documentNumber,
        address:        formData.address || undefined,
        birthDate:      formData.birthDate || undefined,
        position:       formData.position,
        salary:         formData.salary || undefined,
        hireDate:       formData.hireDate || undefined,
        password:       formData.documentNumber,
      });
      if (res.success) {
        await loadEmployees();
        setCurrentView('list');
        clearForm();
        toast.success(`Empleado "${formData.firstName} ${formData.lastName}" creado exitosamente`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear empleado');
    }
  };

  // Actualizar empleado
  const handleUpdateEmployee = async () => {
    if (!selectedEmployee || !formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Datos del empleado incompletos'); return;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio'); return;
    }
    if (formData.documentNumber && !DOC_REGEX.test(formData.documentNumber)) {
      toast.error('El número de documento solo acepta entre 1 y 15 dígitos numéricos'); return;
    }
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear() -
        (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
      if (age < 18) {
        toast.error('El empleado debe ser mayor de 18 años'); return;
      }
    }
    if (formData.phone && !PHONE_REGEX.test(formData.phone)) {
      toast.error('El teléfono solo acepta números sin espacios ni letras'); return;
    }
    if (!formData.salary || formData.salary <= 0) {
      toast.error('El sueldo es obligatorio'); return;
    }
    if (formData.password) {
      if (!PASSWORD_REGEX.test(formData.password)) {
        toast.error('La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial'); return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden'); return;
      }
    }

    try {
      const cleanId = String(selectedEmployee.id).replace(/\D/g, '');
      await updateEmployee(cleanId, {
        fullName:       `${formData.firstName} ${formData.lastName}`,
        email:          formData.email,
        phone:          formData.phone || undefined,
        documentType:   formData.documentType,
        documentNumber: formData.documentNumber || undefined,
        address:        formData.address || undefined,
        birthDate:      formData.birthDate || undefined,
        position:       formData.position,
        salary:         formData.salary || undefined,
        hireDate:       formData.hireDate || undefined,
        isActive:       formData.isActive,
        password:       formData.password || undefined,
      });
      await loadEmployees();
      setCurrentView('list');
      clearForm();
      toast.success(`Empleado "${formData.firstName} ${formData.lastName}" actualizado exitosamente`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar empleado');
    }
  };

  // Cambiar estado del empleado
  const handleToggleEmployeeStatus = async (employeeId: string) => {
    const employee = displayEmployees.find(e => e.id === employeeId);
    if (!employee) return;
    try {
      const { apiFetch } = await import('../../../lib/api');
      const cleanId = String(employeeId).replace(/\D/g, ''); // solo dígitos
      if (!cleanId) { toast.error('ID de empleado inválido'); return; }
      const res = await apiFetch<any>(`/employees/${cleanId}/status`, { method: 'PATCH' });
      if (res.success) {
        await loadEmployees();
        toast.success(res.message);
      }
    } catch {
      toast.error('Error al actualizar estado del empleado');
    }
  };

  // Eliminar empleado
  const handleDeleteEmployee = async (employeeId: string) => {
    const employee = displayEmployees.find(e => e.id === employeeId);
    try {
      const cleanId = String(employeeId).replace(/\D/g, '');
      if (!cleanId) { toast.error('ID de empleado inválido'); return; }
      await deleteEmployee(cleanId);
      await loadEmployees();
      toast.success(`Empleado "${employee?.firstName} ${employee?.lastName}" eliminado exitosamente`);
    } catch {
      toast.error('Error al eliminar empleado');
    }
  };

  // Abrir modal de edición
  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      documentType: employee.documentType,
      documentNumber: employee.documentNumber,
      phone: employee.phone,
      email: employee.email,
      address: employee.address,
      birthDate: employee.birthDate,
      position: employee.position,
      salary: employee.salary,
      hireDate: employee.hireDate,
      isActive: employee.isActive,
      password: '',
      confirmPassword: '',
    });
    setSalaryDisplay(employee.salary > 0 ? new Intl.NumberFormat('es-CO').format(employee.salary) : '');
    setCurrentView('edit');
  };

  // Abrir modal de detalle
  const openDetailModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  // Obtener color del cargo
  const getPositionColor = (position: string) => {
    const positionData = AVAILABLE_POSITIONS.find(p => p.value === position);
    return positionData?.color || 'bg-gray-100 text-gray-800';
  };

  // Obtener iniciales del empleado
  const getEmployeeInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (currentView === 'create' || (currentView === 'edit' && selectedEmployee)) {
    const isEdit = currentView === 'edit';
    const cancel = () => { setCurrentView('list'); clearForm(); };
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="w-full max-w-sm mb-2">
          <Button variant="ghost" size="sm" onClick={cancel} className="text-muted-foreground -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />Volver al listado
          </Button>
        </div>
        <div className="w-full max-w-sm border rounded-xl shadow-sm bg-card overflow-hidden">
          <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{isEdit ? 'Editar Empleado' : 'Registrar Empleado'}</p>
              <p className="text-xs text-muted-foreground">
                {isEdit ? `${selectedEmployee?.firstName} ${selectedEmployee?.lastName}` : 'Los campos con * son obligatorios'}
              </p>
            </div>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="docType" className="text-xs font-medium">Tipo doc. <span className="text-destructive">*</span></Label>
                <Select value={formData.documentType} onValueChange={(v: Employee['documentType']) => setFormData(p => ({ ...p, documentType: v }))}>
                  <SelectTrigger id="docType" className="h-9 text-sm shadow-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{DOCUMENT_TYPES.map(d => <SelectItem key={d.value} value={d.value} className="text-sm">{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="docNum" className="text-xs font-medium">Nº documento <span className="text-destructive">*</span></Label>
                <Input id="docNum" value={formData.documentNumber} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 15); setFormData(p => ({ ...p, documentNumber: val })); }} placeholder="1234567890" className="h-9 text-sm shadow-sm" maxLength={15} inputMode="numeric" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs font-medium">Nombre <span className="text-destructive">*</span></Label>
                <Input id="firstName" value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} placeholder="Ej: Ana" className="h-9 text-sm shadow-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs font-medium">Apellidos <span className="text-destructive">*</span></Label>
                <Input id="lastName" value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} placeholder="Ej: García" className="h-9 text-sm shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="empleado@bionatural.com" className="h-9 text-sm shadow-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-medium">Teléfono</Label>
              <Input id="phone" value={formData.phone} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setFormData(p => ({ ...p, phone: val })); }} placeholder="3001234567" className="h-9 text-sm shadow-sm" inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-medium">Dirección</Label>
              <Input id="address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="Dirección del empleado" className="h-9 text-sm shadow-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="birthDate" className="text-xs font-medium">Fecha de Nacimiento <span className="text-destructive">*</span></Label>
              <Input id="birthDate" type="date" value={formData.birthDate} onChange={e => setFormData(p => ({ ...p, birthDate: e.target.value }))} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} className="h-9 text-sm shadow-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="position" className="text-xs font-medium">Cargo <span className="text-destructive">*</span></Label>
              <Select value={formData.position} onValueChange={(v: Employee['position']) => setFormData(p => ({ ...p, position: v }))}>
                <SelectTrigger id="position" className="h-9 text-sm shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{activeRoles.map(pos => <SelectItem key={pos.value} value={pos.value} className="text-sm"><div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" />{pos.label}</div></SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="salary" className="text-xs font-medium">Sueldo <span className="text-destructive">*</span></Label>
              <Input id="salary" type="text" inputMode="numeric" value={salaryDisplay} onChange={e => handleSalaryInput(e.target.value)} placeholder="Ej: 2.500.000" className="h-9 text-sm shadow-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hireDate" className="text-xs font-medium">Fecha de Ingreso <span className="text-destructive">*</span></Label>
              <Input id="hireDate" type="date" value={formData.hireDate} onChange={e => setFormData(p => ({ ...p, hireDate: e.target.value }))} className="h-9 text-sm shadow-sm" />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 shadow-sm">
              <div><p className="text-xs font-medium">Estado</p><p className="text-xs text-muted-foreground">{formData.isActive ? 'Activo' : 'Inactivo'}</p></div>
              <Switch checked={formData.isActive} onCheckedChange={v => setFormData(p => ({ ...p, isActive: v }))} />
            </div>
            {!isEdit ? (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">La contraseña inicial será el número de documento.</div>
            ) : (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                La contraseña del empleado es su número de documento: <strong>{selectedEmployee?.documentNumber || 'ver documento'}</strong>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button onClick={isEdit ? handleUpdateEmployee : handleCreateEmployee} className="flex-1 h-9 text-sm">
                {isEdit ? <><Edit className="h-3.5 w-3.5 mr-1.5" />Actualizar</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Registrar</>}
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
            <Briefcase className="h-6 w-6" />
            Gestión de Empleados
          </h2>
          <p className="text-muted-foreground">
            Administra todos los empleados registrados en el sistema
          </p>
        </div>
        
        <Button onClick={() => openCreateView()}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Empleado
        </Button>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cargos</SelectItem>
                  {activeRoles.map(position => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
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
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de empleados */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            Mostrando {paginatedEmployees.length} de {filteredEmployees.length} empleados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.map((employee) => (
                <TableRow key={employee.id} className={!employee.isActive ? 'opacity-60' : ''}>
                  <TableCell>
                    {employee.documentNumber
                      ? <div className="text-sm"><span className="font-medium">{employee.documentType}</span><p className="text-muted-foreground text-xs">{employee.documentNumber}</p></div>
                      : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                        <AvatarFallback className={`text-xs ${employee.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {getEmployeeInitials(employee.firstName, employee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{employee.firstName} {employee.lastName}</p>
                        {employee.email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPositionColor(employee.position)}>
                      {employee.position}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={employee.isActive}
                        onCheckedChange={() => handleToggleEmployeeStatus(employee.id)}
                        className="scale-90"
                      />
                      <span className="text-sm text-muted-foreground">
                        {employee.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Ver detalle — siempre disponible */}
                      <Button variant="ghost" size="sm"
                        onClick={() => openDetailModal(employee)} title="Ver detalle">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {/* Editar — bloqueado si inactivo */}
                      <Button variant="ghost" size="sm"
                        onClick={() => employee.isActive && openEditModal(employee)}
                        disabled={!employee.isActive}
                        title={employee.isActive ? 'Editar empleado' : 'Empleado inactivo'}>
                        <Edit className={`h-4 w-4 ${employee.isActive ? 'text-muted-foreground' : 'text-muted-foreground/30'}`} />
                      </Button>
                      {/* Eliminar — bloqueado si inactivo */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm"
                            disabled={!employee.isActive}
                            title={employee.isActive ? 'Eliminar empleado' : 'Empleado inactivo'}>
                            <Trash2 className={`h-4 w-4 ${employee.isActive ? 'text-destructive' : 'text-muted-foreground/30'}`} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar Empleado</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Está seguro de eliminar a {employee.firstName} {employee.lastName}? Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
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

      {/* Modal: Ver Detalle del Empleado */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Detalle del Empleado
            </DialogTitle>
            <DialogDescription>
              Información completa de {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedEmployee.avatar} alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} />
                  <AvatarFallback className="text-2xl">
                    {getEmployeeInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                  <Badge className={getPositionColor(selectedEmployee.position)}>
                    {selectedEmployee.position}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tipo de Documento</Label>
                    <p className="font-medium flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {selectedEmployee.documentType}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Número de Documento</Label>
                    <p className="font-medium">
                      {selectedEmployee.documentNumber}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fecha de Nacimiento</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {selectedEmployee.birthDate || 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedEmployee.email || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {selectedEmployee.phone || 'No especificado'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Dirección</Label>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedEmployee.address || 'No especificada'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Información Laboral</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Sueldo</Label>
                    <p className="font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(selectedEmployee.salary)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fecha de Ingreso</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {selectedEmployee.hireDate}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <Badge variant={selectedEmployee.isActive ? "default" : "secondary"}>
                      {selectedEmployee.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
