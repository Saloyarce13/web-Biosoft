import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Separator } from '../../../components/ui/separator';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Progress } from '../../../components/ui/progress';
import { toast } from 'sonner';
import { 
  Settings,
  Store,
  Bell,
  Database,
  Save,
  Download,
  Upload,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Mail,
  Phone,
  Smartphone,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  RefreshCw,
  Shield,
  Lock,
  Unlock
} from 'lucide-react';

interface SystemConfigurationProps {
  userRole: string;
}

interface StoreConfig {
  name: string;
  description: string;
  logo: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  openingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  currency: string;
  timezone: string;
  taxRate: number;
}

interface NotificationConfig {
  emailNotifications: {
    newOrders: boolean;
    lowStock: boolean;
    newUsers: boolean;
    systemUpdates: boolean;
  };
  smsNotifications: {
    criticalAlerts: boolean;
    orderConfirmations: boolean;
  };
  customMessages: {
    welcomeMessage: string;
    lowStockMessage: string;
    orderConfirmationMessage: string;
  };
  notificationFrequency: string;
}

interface BackupConfig {
  autoBackup: boolean;
  backupFrequency: string;
  backupTime: string;
  retentionDays: number;
  includeImages: boolean;
  includeUserData: boolean;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

const CURRENCIES = [
  { code: 'COP', name: 'Peso Colombiano' },
  { code: 'USD', name: 'Dólar Estadounidense' },
  { code: 'EUR', name: 'Euro' }
];

const TIMEZONES = [
  { value: 'America/Bogota', label: 'Colombia (GMT-5)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-4)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' }
];

export function SystemConfiguration({ userRole }: SystemConfigurationProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Store Configuration State
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: 'Bionatural Store',
    description: 'Tienda naturista especializada en productos orgánicos y bienestar integral',
    logo: '',
    address: 'Calle 70 #45-23',
    city: 'Medellín',
    country: 'Colombia',
    phone: '+57 4 444-5555',
    email: 'info@bionatural.com',
    website: 'www.bionatural.com',
    openingHours: {
      monday: { open: '08:00', close: '18:00', isOpen: true },
      tuesday: { open: '08:00', close: '18:00', isOpen: true },
      wednesday: { open: '08:00', close: '18:00', isOpen: true },
      thursday: { open: '08:00', close: '18:00', isOpen: true },
      friday: { open: '08:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '16:00', isOpen: true },
      sunday: { open: '10:00', close: '14:00', isOpen: false }
    },
    currency: 'COP',
    timezone: 'America/Bogota',
    taxRate: 19
  });

  // Notification Configuration State
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    emailNotifications: {
      newOrders: true,
      lowStock: true,
      newUsers: false,
      systemUpdates: true
    },
    smsNotifications: {
      criticalAlerts: true,
      orderConfirmations: false
    },
    customMessages: {
      welcomeMessage: '¡Bienvenido a Bionatural! Gracias por elegir productos naturales para tu bienestar.',
      lowStockMessage: 'Atención: El producto {product_name} tiene stock bajo ({stock} unidades restantes).',
      orderConfirmationMessage: 'Tu pedido #{order_id} ha sido confirmado. Tiempo estimado de entrega: 2-3 días hábiles.'
    },
    notificationFrequency: 'immediate'
  });

  // Backup Configuration State
  const [backupConfig, setBackupConfig] = useState<BackupConfig>({
    autoBackup: true,
    backupFrequency: 'weekly',
    backupTime: '02:00',
    retentionDays: 30,
    includeImages: true,
    includeUserData: false
  });

  // Permission checks
  const canEdit = userRole === 'Administrador' || userRole === 'Supervisor';
  const canViewGeneral = ['Administrador', 'Supervisor', 'Vendedor'].includes(userRole);
  const canViewNotifications = ['Administrador', 'Supervisor'].includes(userRole);
  const canViewBackups = userRole === 'Administrador';

  // Available tabs based on role
  const getAvailableTabs = () => {
    const tabs = [];
    if (canViewGeneral) tabs.push({ value: 'general', label: 'Configuración General', icon: Store });
    if (canViewNotifications) tabs.push({ value: 'notifications', label: 'Notificaciones', icon: Bell });
    if (canViewBackups) tabs.push({ value: 'backups', label: 'Respaldo de Datos', icon: Database });
    return tabs;
  };

  // Save configurations
  const handleSaveGeneral = async () => {
    if (!canEdit) {
      toast.error('No tienes permisos para realizar cambios');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configuración general guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!canEdit) {
      toast.error('No tienes permisos para realizar cambios');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configuración de notificaciones guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);
    
    try {
      // Simulate backup creation with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setBackupProgress(i);
      }
      toast.success('Respaldo creado exitosamente');
    } catch (error) {
      toast.error('Error al crear el respaldo');
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const updateStoreConfig = (field: keyof StoreConfig, value: any) => {
    setStoreConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateOpeningHours = (day: string, field: string, value: any) => {
    setStoreConfig(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          [field]: value
        }
      }
    }));
  };

  const updateNotificationConfig = (section: keyof Omit<NotificationConfig, 'notificationFrequency'>, field: string, value: any) => {
    setNotificationConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateBackupConfig = (field: keyof BackupConfig, value: any) => {
    setBackupConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración del Sistema
          </h2>
          <p className="text-muted-foreground">
            Administra la configuración general de la tienda y sus parámetros
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={canEdit ? "default" : "secondary"} className="flex items-center gap-1">
            {canEdit ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {canEdit ? 'Edición habilitada' : 'Solo lectura'}
          </Badge>
          <Badge variant="outline">Rol: {userRole}</Badge>
        </div>
      </div>

      {/* Role-based access alert */}
      {!canEdit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Estás viendo la configuración en modo solo lectura. Solo los usuarios con rol de Administrador o Supervisor pueden realizar cambios.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          {getAvailableTabs().map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* General Configuration Tab */}
        {canViewGeneral && (
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Información de la Tienda
                </CardTitle>
                <CardDescription>
                  Configura la información básica de tu tienda naturista
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nombre de la Tienda</Label>
                    <Input
                      id="storeName"
                      value={storeConfig.name}
                      onChange={(e) => updateStoreConfig('name', e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select 
                      value={storeConfig.currency} 
                      onValueChange={(value) => updateStoreConfig('currency', value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeDescription">Descripción</Label>
                  <Textarea
                    id="storeDescription"
                    value={storeConfig.description}
                    onChange={(e) => updateStoreConfig('description', e.target.value)}
                    disabled={!canEdit}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={storeConfig.address}
                      onChange={(e) => updateStoreConfig('address', e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select 
                      value={storeConfig.timezone} 
                      onValueChange={(value) => updateStoreConfig('timezone', value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={storeConfig.phone}
                      onChange={(e) => updateStoreConfig('phone', e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={storeConfig.email}
                      onChange={(e) => updateStoreConfig('email', e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={storeConfig.taxRate}
                      onChange={(e) => updateStoreConfig('taxRate', parseFloat(e.target.value))}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {canEdit && (
                  <Button onClick={handleSaveGeneral} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Configuración
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Opening Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios de Atención
                </CardTitle>
                <CardDescription>
                  Define los horarios de atención de la tienda para cada día
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-24">
                        <Label>{day.label}</Label>
                      </div>
                      
                      <Switch
                        checked={storeConfig.openingHours[day.key as keyof typeof storeConfig.openingHours].isOpen}
                        onCheckedChange={(checked) => updateOpeningHours(day.key, 'isOpen', checked)}
                        disabled={!canEdit}
                      />
                      
                      {storeConfig.openingHours[day.key as keyof typeof storeConfig.openingHours].isOpen && (
                        <>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={storeConfig.openingHours[day.key as keyof typeof storeConfig.openingHours].open}
                              onChange={(e) => updateOpeningHours(day.key, 'open', e.target.value)}
                              disabled={!canEdit}
                              className="w-32"
                            />
                            <span className="text-muted-foreground">hasta</span>
                            <Input
                              type="time"
                              value={storeConfig.openingHours[day.key as keyof typeof storeConfig.openingHours].close}
                              onChange={(e) => updateOpeningHours(day.key, 'close', e.target.value)}
                              disabled={!canEdit}
                              className="w-32"
                            />
                          </div>
                        </>
                      )}
                      
                      {!storeConfig.openingHours[day.key as keyof typeof storeConfig.openingHours].isOpen && (
                        <span className="text-muted-foreground italic">Cerrado</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Store Location Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación de la Tienda
                </CardTitle>
                <CardDescription>
                  Ubicación en Medellín, Colombia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Dirección Completa</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {storeConfig.address}, {storeConfig.city}, {storeConfig.country}
                      </p>
                    </div>
                    <div>
                      <Label>Coordenadas</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        6.2442°N, 75.5812°W (Medellín Centro)
                      </p>
                    </div>
                  </div>
                  
                  {/* Interactive Map Placeholder */}
                  <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Mapa Interactivo de Medellín
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Bionatural Store - {storeConfig.address}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Notifications Configuration Tab */}
        {canViewNotifications && (
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notificaciones por Email
                </CardTitle>
                <CardDescription>
                  Configura las alertas que recibirás por correo electrónico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notificationConfig.emailNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {key === 'newOrders' && 'Recibir notificación cuando haya nuevos pedidos'}
                        {key === 'lowStock' && 'Alertas cuando los productos tengan stock bajo'}
                        {key === 'newUsers' && 'Notificar cuando se registren nuevos usuarios'}
                        {key === 'systemUpdates' && 'Avisos sobre actualizaciones del sistema'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateNotificationConfig('emailNotifications', key, checked)}
                      disabled={!canEdit}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Notificaciones SMS
                </CardTitle>
                <CardDescription>
                  Configura alertas críticas por mensaje de texto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notificationConfig.smsNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {key === 'criticalAlerts' && 'Alertas críticas del sistema por SMS'}
                        {key === 'orderConfirmations' && 'Confirmaciones de pedidos por SMS'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateNotificationConfig('smsNotifications', key, checked)}
                      disabled={!canEdit}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Mensajes Personalizados
                </CardTitle>
                <CardDescription>
                  Personaliza los mensajes automáticos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
                  <Textarea
                    id="welcomeMessage"
                    value={notificationConfig.customMessages.welcomeMessage}
                    onChange={(e) => updateNotificationConfig('customMessages', 'welcomeMessage', e.target.value)}
                    disabled={!canEdit}
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lowStockMessage">Mensaje de Stock Bajo</Label>
                  <Textarea
                    id="lowStockMessage"
                    value={notificationConfig.customMessages.lowStockMessage}
                    onChange={(e) => updateNotificationConfig('customMessages', 'lowStockMessage', e.target.value)}
                    disabled={!canEdit}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables disponibles: {'{product_name}'}, {'{stock}'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orderConfirmationMessage">Mensaje de Confirmación de Pedido</Label>
                  <Textarea
                    id="orderConfirmationMessage"
                    value={notificationConfig.customMessages.orderConfirmationMessage}
                    onChange={(e) => updateNotificationConfig('customMessages', 'orderConfirmationMessage', e.target.value)}
                    disabled={!canEdit}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables disponibles: {'{order_id}'}, {'{customer_name}'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {canEdit && (
              <Button onClick={handleSaveNotifications} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Notificaciones
              </Button>
            )}
          </TabsContent>
        )}

        {/* Backups Configuration Tab */}
        {canViewBackups && (
          <TabsContent value="backups" className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Solo el Administrador puede gestionar los respaldos del sistema por razones de seguridad.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Respaldos Automáticos
                </CardTitle>
                <CardDescription>
                  Configura los respaldos automáticos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Respaldos Automáticos</Label>
                    <p className="text-sm text-muted-foreground">
                      Crear respaldos automáticos según la frecuencia configurada
                    </p>
                  </div>
                  <Switch
                    checked={backupConfig.autoBackup}
                    onCheckedChange={(checked) => updateBackupConfig('autoBackup', checked)}
                  />
                </div>

                {backupConfig.autoBackup && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Frecuencia</Label>
                      <Select 
                        value={backupConfig.backupFrequency} 
                        onValueChange={(value) => updateBackupConfig('backupFrequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diario</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="backupTime">Hora del Respaldo</Label>
                      <Input
                        type="time"
                        value={backupConfig.backupTime}
                        onChange={(e) => updateBackupConfig('backupTime', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Incluir Imágenes</Label>
                      <p className="text-sm text-muted-foreground">Incluir imágenes de productos en el respaldo</p>
                    </div>
                    <Switch
                      checked={backupConfig.includeImages}
                      onCheckedChange={(checked) => updateBackupConfig('includeImages', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Incluir Datos de Usuario</Label>
                      <p className="text-sm text-muted-foreground">Incluir información personal de usuarios (sensible)</p>
                    </div>
                    <Switch
                      checked={backupConfig.includeUserData}
                      onCheckedChange={(checked) => updateBackupConfig('includeUserData', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Días de Retención</Label>
                  <Input
                    type="number"
                    value={backupConfig.retentionDays}
                    onChange={(e) => updateBackupConfig('retentionDays', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                  <p className="text-xs text-muted-foreground">
                    Los respaldos se eliminarán automáticamente después de este período
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Crear Respaldo Manual
                </CardTitle>
                <CardDescription>
                  Genera un respaldo inmediato de todos los datos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCreatingBackup && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Progreso del Respaldo</Label>
                      <span className="text-sm text-muted-foreground">{backupProgress}%</span>
                    </div>
                    <Progress value={backupProgress} />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateBackup} 
                    disabled={isCreatingBackup}
                    className="flex-1"
                  >
                    {isCreatingBackup ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    {isCreatingBackup ? 'Creando Respaldo...' : 'Crear Respaldo'}
                  </Button>
                  
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Último
                  </Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Los respaldos pueden contener información sensible. Guárdalos en un lugar seguro.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Respaldos</CardTitle>
                <CardDescription>
                  Últimos respaldos creados del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { date: '2024-01-20 02:00', size: '245 MB', type: 'Automático' },
                    { date: '2024-01-19 15:30', size: '243 MB', type: 'Manual' },
                    { date: '2024-01-13 02:00', size: '241 MB', type: 'Automático' },
                    { date: '2024-01-06 02:00', size: '238 MB', type: 'Automático' }
                  ].map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{backup.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {backup.size} • {backup.type}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Descargar
                        </Button>
                        <Button size="sm" variant="outline">
                          <Upload className="h-3 w-3 mr-1" />
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}