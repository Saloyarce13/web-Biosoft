import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../../lib/api';
import { useDocumentTypesEmployee } from '../../../shared/contexts/SystemConfigContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronLeft,
  Info,
  CreditCard,
  Building2,
  Briefcase,
  DollarSign,
  RefreshCw,
  IdCard
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

// Cargos disponibles
const AVAILABLE_POSITIONS = [
  { value: 'Administrador', label: 'Administrador', color: 'bg-red-100 text-red-800' },
  { value: 'Vendedor', label: 'Vendedor', color: 'bg-blue-100 text-blue-800' }
];

const ITEMS_PER_PAGE = 8;

export function EmployeeManagement() {
  const DOCUMENT_TYPES = useDocumentTypesEmployee();
  const [apiEmployees, setApiEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [activeRoles, setActiveRoles] = useState<{ value: string; label: string; color: string }[]>(AVAILABLE_POSITIONS);

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

  useEffect(() => {
    loadEmployees();
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

  const filteredEmployees = useMemo(() => {
    return apiEmployees.filter(employee => {
      const matchesPosition = positionFilter === 'all' || employee.position === positionFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && employee.isActive) ||
                           (statusFilter === 'inactive' && !employee.isActive);
      return matchesPosition && matchesStatus;
    });
  }, [apiEmployees, positionFilter, statusFilter]);

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
    setSelectedEmployee(null);
  };

  const openCreateView = () => {
    clearForm();
    setCurrentView('create');
  };

  const PHONE_REGEX = /^\+?\d{10,20}$/;
  const DOC_REGEX   = /^\d{8,15}$/;

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
      toast.error('El número de documento solo acepta entre 8 y 15 dígitos numéricos'); return;
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
      toast.error('El teléfono debe tener entre 10 y 20 dígitos (puede incluir +)'); return;
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

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee || !formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Datos del empleado incompletos'); return;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio'); return;
    }
    if (formData.documentNumber && !DOC_REGEX.test(formData.documentNumber)) {
      toast.error('El número de documento solo acepta entre 8 y 15 dígitos numéricos'); return;
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
      toast.error('El teléfono debe tener entre 10 y 20 dígitos (puede incluir +)'); return;
    }
    if (!formData.salary || formData.salary <= 0) {
      toast.error('El sueldo es obligatorio'); return;
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

  const handleToggleEmployeeStatus = async (employeeId: string) => {
    try {
      const { apiFetch } = await import('../../../lib/api');
      const cleanId = String(employeeId).replace(/\D/g, '');
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

  const handleDeleteEmployee = async (employeeId: string) => {
    const employee = apiEmployees.find(e => e.id === employeeId);
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

  const openDetailModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  const getPositionColor = (position: string) => {
    const positionData = AVAILABLE_POSITIONS.find(p => p.value === position);
    return positionData?.color || 'bg-gray-100 text-gray-800';
  };

  const getEmployeeInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const tableColumns: Column<Employee>[] = [
    {
      header: 'Documento',
      accessor: (e) => (
        <div className="text-sm">
          <span className="font-medium">{e.documentType}</span>
          <p className="text-muted-foreground text-xs">{e.documentNumber}</p>
        </div>
      )
    },
    {
      header: 'Nombre Completo',
      accessor: (e) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={e.avatar} alt={`${e.firstName} ${e.lastName}`} />
            <AvatarFallback className={`text-xs ${e.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {getEmployeeInitials(e.firstName, e.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{e.firstName} {e.lastName}</p>
            {e.email && <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{e.email}</div>}
          </div>
        </div>
      )
    },
    {
      header: 'Cargo',
      accessor: (e) => <Badge className={getPositionColor(e.position)}>{e.position}</Badge>
    },
    {
      header: 'Estado',
      accessor: (e) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={e.isActive}
            onCheckedChange={() => handleToggleEmployeeStatus(e.id)}
            className="scale-90"
          />
          <span className="text-sm text-muted-foreground">
            {e.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )
    }
  ];

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
              <p className="font-semibold text-sm">{isEdit ? 'Editar Empleado' : 'Nuevo Empleado'}</p>
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
                <Input id="docNum" value={formData.documentNumber} onChange={e => { const val = e.target.value.replace(/\\D/g, '').slice(0, 15); setFormData(p => ({ ...p, documentNumber: val })); }} placeholder="1234567890" className="h-9 text-sm shadow-sm" maxLength={15} inputMode="numeric" />
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
              <Input id="phone" value={formData.phone} onChange={e => { const val = e.target.value.replace(/\\D/g, ''); setFormData(p => ({ ...p, phone: val })); }} placeholder="3001234567" className="h-9 text-sm shadow-sm" inputMode="numeric" />
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
            <div className="flex gap-2 pt-1">
              <Button onClick={isEdit ? handleUpdateEmployee : handleCreateEmployee} className="flex-1 h-9 text-sm">
                {isEdit ? <><Edit className="h-3.5 w-3.5 mr-1.5" />Actualizar</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Guardar</>}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Gestión de Empleados
          </h2>
        </div>
        <Button onClick={() => openCreateView()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      <DataTable
        title="Empleados"
        description={`Mostrando ${filteredEmployees.length} empleados`}
        data={filteredEmployees}
        columns={tableColumns}
        searchableKeys={['firstName', 'lastName', 'documentNumber', 'email']}
        searchPlaceholder="Buscar por nombre, documento o email..."
        itemsPerPage={ITEMS_PER_PAGE}
        isLoading={loading}
        onEdit={(e) => e.isActive ? openEditModal(e) : toast.error('Empleado inactivo')}
        onDelete={(e) => e.isActive ? handleDeleteEmployee(e.id) : toast.error('Empleado inactivo')}
        customActions={(e) => (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetailModal(e)} title="Ver detalle">
            <Eye className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        extraFilters={
          <div className="flex gap-2">
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Cargo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cargos</SelectItem>
                {activeRoles.map(pos => <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Info className="h-5 w-5" />Detalle del Empleado</DialogTitle>
            <DialogDescription>Información completa de {selectedEmployee?.firstName} {selectedEmployee?.lastName}</DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">{getEmployeeInitials(selectedEmployee.firstName, selectedEmployee.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                  <Badge className={getPositionColor(selectedEmployee.position)}>{selectedEmployee.position}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2"><IdCard className="h-4 w-4 text-primary" /> Información Personal</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground">Documento</p><p>{selectedEmployee.documentType}: {selectedEmployee.documentNumber}</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground">Fecha de Nacimiento</p><p>{selectedEmployee.birthDate}</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground">Email</p><p>{selectedEmployee.email}</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground">Teléfono</p><p>{selectedEmployee.phone || '—'}</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground">Dirección</p><p>{selectedEmployee.address || '—'}</p></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Información Laboral</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground">Sede / Ubicación</p><p>Tienda Principal</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground">Fecha de Ingreso</p><p>{selectedEmployee.hireDate}</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div><p className="text-xs text-muted-foreground">Sueldo Mensual</p><p className="font-medium text-emerald-600">{`COP ${new Intl.NumberFormat('es-CO').format(selectedEmployee.salary)}`}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setIsDetailModalOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
