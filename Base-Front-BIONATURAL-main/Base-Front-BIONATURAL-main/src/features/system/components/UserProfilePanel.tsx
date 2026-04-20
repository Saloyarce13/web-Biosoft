import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Settings, 
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Calendar,
  Award,
  Edit3,
  Plus,
  LogOut,
  Shield,
  Wallet
} from 'lucide-react';

interface UserProfilePanelProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

const getUserStats = (role: string) => {
  switch (role) {
    case 'Administrador':
      return [
        { label: 'Usuarios Activos', value: '1,234', icon: Users, color: 'text-blue-600' },
        { label: 'Ventas del Mes', value: '$156,300', icon: TrendingUp, color: 'text-green-600' },
        { label: 'Productos Activos', value: '456', icon: Package, color: 'text-purple-600' },
        { label: 'Órdenes Procesadas', value: '2,891', icon: ShoppingBag, color: 'text-orange-600' }
      ];
    
    case 'Vendedor':
      return [
        { label: 'Ventas Realizadas', value: '89', icon: ShoppingBag, color: 'text-green-600' },
        { label: 'Clientes Atendidos', value: '156', icon: Users, color: 'text-blue-600' },
        { label: 'Comisiones', value: '$2,340', icon: TrendingUp, color: 'text-purple-600' },
        { label: 'Meta Mensual', value: '76%', icon: Award, color: 'text-orange-600' }
      ];

    case 'Bodega':
      return [
        { label: 'Productos Gestionados', value: '456', icon: Package, color: 'text-blue-600' },
        { label: 'Envíos Procesados', value: '234', icon: ShoppingBag, color: 'text-green-600' },
        { label: 'Stock Actualizado', value: '98%', icon: TrendingUp, color: 'text-purple-600' },
        { label: 'Alertas Resueltas', value: '12', icon: Award, color: 'text-orange-600' }
      ];

    case 'Contador':
      return [
        { label: 'Reportes Generados', value: '45', icon: TrendingUp, color: 'text-green-600' },
        { label: 'Pagos Procesados', value: '$89,456', icon: CreditCard, color: 'text-blue-600' },
        { label: 'Facturas Emitidas', value: '234', icon: Calendar, color: 'text-purple-600' },
        { label: 'Conciliaciones', value: '12', icon: Award, color: 'text-orange-600' }
      ];

    default:
      return [
        { label: 'Compras Realizadas', value: '12', icon: ShoppingBag, color: 'text-green-600' },
        { label: 'Productos Favoritos', value: '8', icon: Package, color: 'text-blue-600' },
        { label: 'Puntos Acumulados', value: '1,250', icon: Award, color: 'text-purple-600' },
        { label: 'Ahorros Totales', value: '$156', icon: TrendingUp, color: 'text-orange-600' }
      ];
  }
};

const getPaymentMethods = () => [
  {
    id: 1,
    type: 'Tarjeta de Crédito',
    details: '**** **** **** 4532',
    provider: 'Visa',
    isDefault: true
  },
  {
    id: 2,
    type: 'Tarjeta de Débito',
    details: '**** **** **** 8901',
    provider: 'Mastercard',
    isDefault: false
  },
  {
    id: 3,
    type: 'PayPal',
    details: 'usuario@email.com',
    provider: 'PayPal',
    isDefault: false
  }
];

export function UserProfilePanel({ user, onLogout }: UserProfilePanelProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: '+1 (555) 123-4567',
    address: 'Calle de la Naturaleza 123, Ciudad Verde',
    company: 'Naturista Store'
  });

  const userStats = getUserStats(user.role);
  const paymentMethods = getPaymentMethods();

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-red-100 text-red-800';
      case 'Vendedor':
        return 'bg-blue-100 text-blue-800';
      case 'Bodega':
        return 'bg-green-100 text-green-800';
      case 'Contador':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header del perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold">{user.name}</h1>
                <Badge className={getRoleColor(user.role)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">{user.email}</p>
              
              <div className="flex gap-2">
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Información Personal</DialogTitle>
                      <DialogDescription>
                        Actualiza tu información de perfil
                      </DialogDescription>
                    </DialogHeader>
                    <ProfileEditForm 
                      data={profileData} 
                      onChange={setProfileData}
                      onClose={() => setIsEditingProfile(false)}
                    />
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estadísticas {user.role === 'Administrador' ? 'del Sistema' : 'Personales'}
          </CardTitle>
          <CardDescription>
            Resumen de tu actividad y rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userStats.map((stat, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-semibold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs con información detallada */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Información Personal</TabsTrigger>
          <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profileData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{profileData.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{profileData.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{profileData.company}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>
                Gestiona tus métodos de pago guardados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{method.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.details} • {method.provider}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <Badge variant="secondary">Predeterminado</Badge>
                    )}
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Método de Pago
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificaciones por email</p>
                    <p className="text-sm text-muted-foreground">
                      Recibir actualizaciones por correo electrónico
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticación de dos factores</p>
                    <p className="text-sm text-muted-foreground">
                      Agregar una capa extra de seguridad
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Activar
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Cambiar contraseña</p>
                    <p className="text-sm text-muted-foreground">
                      Actualizar tu contraseña de acceso
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Cambiar
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between text-red-600">
                  <div>
                    <p className="font-medium">Eliminar cuenta</p>
                    <p className="text-sm text-muted-foreground">
                      Eliminar permanentemente tu cuenta
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileEditForm({ 
  data, 
  onChange, 
  onClose 
}: { 
  data: any; 
  onChange: (data: any) => void; 
  onClose: () => void;
}) {
  const handleSave = () => {
    // Here you would save the data
    console.log('Saving profile data:', data);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre Completo</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="company">Empresa</Label>
          <Input
            id="company"
            value={data.company}
            onChange={(e) => onChange({ ...data, company: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => onChange({ ...data, address: e.target.value })}
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}