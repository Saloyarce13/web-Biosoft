import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { Separator } from "../../../components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../../components/ui/sheet";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { NotificationPanel } from "./NotificationPanel";
import {
  User,
  Bell,
  BarChart3,
  FileText,
  Shield,
  Settings,
  LogOut,
  UserCircle,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Activity,
  Target,
  PieChart,
  Package,
  Heart,
} from "lucide-react";

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
  onProfileOpen: () => void;
  onNotificationsOpen?: () => void;
  onPaymentMethodsOpen?: () => void;
  onOrdersOpen?: () => void;
  onFavoritesOpen?: () => void;
}

// Get menu options based on user role
const getMenuOptions = (role: string) => {
  // Opciones específicas para Cliente
  if (role === "Cliente") {
    return [
      {
        id: "profile",
        label: "Mi Perfil",
        description: "Información personal y configuración",
        icon: UserCircle,
        color: "text-blue-600",
        action: "profile",
      },
      {
        id: "orders",
        label: "Mis Pedidos",
        description: "Ver y gestionar mis pedidos",
        icon: Package,
        color: "text-purple-600",
        action: "orders",
      },
      {
        id: "favorites",
        label: "Mis Favoritos",
        description: "Productos que guardaste",
        icon: Heart,
        color: "text-red-500",
        action: "favorites",
      },
      {
        id: "notifications",
        label: "Notificaciones",
        description: "Ver mis notificaciones",
        icon: Bell,
        color: "text-orange-600",
        action: "notifications",
        badge: true,
      },
    ];
  }

  // Opciones específicas para Vendedor y otros roles de empleado
  if (['Vendedor', 'Bodega', 'Contador'].includes(role)) {
    return [
      {
        id: "profile",
        label: "Mi Perfil",
        description: "Información personal y configuración",
        icon: UserCircle,
        color: "text-blue-600",
        action: "profile",
      },
      {
        id: "notifications",
        label: "Notificaciones",
        description: "Alertas de stock y novedades",
        icon: Bell,
        color: "text-orange-600",
        action: "notifications",
        badge: true,
      },
    ];
  }

  // Opciones específicas para Administrador: solo Perfil
  if (role === "Administrador") {
    return [
      {
        id: "profile",
        label: "Mi Perfil",
        description: "Información personal y configuración",
        icon: UserCircle,
        color: "text-blue-600",
        action: "profile",
      },
    ];
  }

  // Opciones para Administrador y roles no reconocidos
  const baseOptions = [
    {
      id: "profile",
      label: "Mi Perfil",
      description: "Información personal y configuración",
      icon: UserCircle,
      color: "text-blue-600",
      action: "profile",
    },
    {
      id: "notifications",
      label: "Notificaciones",
      description: "Ver todas las notificaciones",
      icon: Bell,
      color: "text-orange-600",
      action: "notifications",
      badge: true,
    },
    {
      id: "reports",
      label: "Ver Reportes",
      description: "Acceder a reportes y análisis",
      icon: BarChart3,
      color: "text-green-600",
      action: "reports",
    },
    {
      id: "risk-management",
      label: "Gestión de Riesgos",
      description: "Análisis y control de riesgos",
      icon: AlertTriangle,
      color: "text-red-600",
      action: "risk-management",
    },
  ];

  // Add role-specific options
  const roleSpecificOptions = [];

  switch (role) {
    case "Administrador":
      roleSpecificOptions.push(
        {
          id: "user-management",
          label: "Gestión de Usuarios",
          description: "Administrar usuarios del sistema",
          icon: Shield,
          color: "text-purple-600",
          action: "user-management",
        },
        {
          id: "system-stats",
          label: "Estadísticas del Sistema",
          description: "Métricas generales del sistema",
          icon: Activity,
          color: "text-indigo-600",
          action: "system-stats",
        },
      );
      break;

    case "Vendedor":
      roleSpecificOptions.push(
        {
          id: "sales-stats",
          label: "Mis Ventas",
          description: "Estadísticas de ventas personales",
          icon: Target,
          color: "text-green-600",
          action: "sales-stats",
        },
        {
          id: "commission",
          label: "Comisiones",
          description: "Ver comisiones ganadas",
          icon: TrendingUp,
          color: "text-emerald-600",
          action: "commission",
        },
      );
      break;

    case "Bodega":
      roleSpecificOptions.push({
        id: "inventory-stats",
        label: "Control de Inventario",
        description: "Estadísticas de stock y movimientos",
        icon: Package,
        color: "text-orange-600",
        action: "inventory-stats",
      });
      break;

    case "Contador":
      roleSpecificOptions.push({
        id: "financial-reports",
        label: "Reportes Financieros",
        description: "Informes contables y financieros",
        icon: PieChart,
        color: "text-blue-600",
        action: "financial-reports",
      });
      break;
  }

  // Add common options at the end
  const commonOptions = [
    {
      id: "payment-methods",
      label: "Métodos de Pago",
      description: "Gestionar tarjetas y pagos",
      icon: CreditCard,
      color: "text-blue-600",
      action: "payment-methods",
    },
    {
      id: "settings",
      label: "Configuración",
      description: "Preferencias del sistema",
      icon: Settings,
      color: "text-gray-600",
      action: "settings",
    },
  ];

  return [
    ...baseOptions,
    ...roleSpecificOptions,
    ...commonOptions,
  ];
};

// Get notification count based on role — solo para roles con notificaciones reales
const getNotificationCount = (role: string) => {
  // Solo empleados tienen badge de notificaciones (stock bajo)
  // El número real se carga en NotificationPanel al abrirlo
  return 0;
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "Administrador":
      return "bg-red-100 text-red-800";
    case "Vendedor":
      return "bg-blue-100 text-blue-800";
    case "Bodega":
      return "bg-green-100 text-green-800";
    case "Contador":
      return "bg-purple-100 text-purple-800";
    case "Cliente":
      return "bg-teal-100 text-teal-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getUserInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export function UserSidebar({
  isOpen,
  onClose,
  user,
  onLogout,
  onProfileOpen,
  onNotificationsOpen,
  onPaymentMethodsOpen,
  onOrdersOpen,
  onFavoritesOpen,
}: UserSidebarProps) {
  const [
    isNotificationsPanelOpen,
    setIsNotificationsPanelOpen,
  ] = useState(false);

  const menuOptions = getMenuOptions(user.role);
  const notificationCount = getNotificationCount(user.role);

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "profile":
        onProfileOpen();
        onClose();
        break;
      case "orders":
        if (user.role === "Cliente" && onOrdersOpen) {
          onOrdersOpen();
          onClose();
        }
        break;
      case "favorites":
        if (user.role === "Cliente" && onFavoritesOpen) {
          onFavoritesOpen();
          onClose();
        }
        break;
      case "notifications":
        if (user.role === "Cliente" && onNotificationsOpen) {
          onNotificationsOpen();
          onClose();
        } else {
          setIsNotificationsPanelOpen(true);
        }
        break;
      case "payment-methods":
        if (user.role === "Cliente" && onPaymentMethodsOpen) {
          onPaymentMethodsOpen();
          onClose();
        } else {
          console.log("Navegando a métodos de pago...");
          onClose();
        }
        break;
      case "reports":
        console.log("Navegando a reportes...");
        onClose();
        break;
      case "risk-management":
        console.log("Navegando a gestión de riesgos...");
        onClose();
        break;
      case "user-management":
        console.log("Navegando a gestión de usuarios...");
        onClose();
        break;
      case "system-stats":
        console.log("Navegando a estadísticas del sistema...");
        onClose();
        break;
      case "sales-stats":
        console.log("Navegando a estadísticas de ventas...");
        onClose();
        break;
      case "commission":
        console.log("Navegando a comisiones...");
        onClose();
        break;
      case "inventory-stats":
        console.log("Navegando a control de inventario...");
        onClose();
        break;
      case "financial-reports":
        console.log("Navegando a reportes financieros...");
        onClose();
        break;
      case "settings":
        console.log("Navegando a configuración...");
        onClose();
        break;
      default:
        console.log("Acción no reconocida:", action);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Panel de {user.role}
            </SheetTitle>
            <SheetDescription>
              {user.role === "Cliente"
                ? "Gestiona tu cuenta y preferencias"
                : "Gestiona tu cuenta y configuraciones"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-8rem)] mt-4">
            {/* User Info Card */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <Badge className={`${getRoleColor(user.role)} text-xs mt-0.5`}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Menu Options — scrollable */}
            <ScrollArea className="flex-1 mt-4 pr-1">
              <div className="space-y-2 pb-2">
                {menuOptions.map((option) => (
                  <Card
                    key={option.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleMenuAction(option.action)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-gray-100 ${option.color}`}>
                          <option.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{option.label}</h4>
                            <div className="flex items-center gap-1.5">
                              {option.badge && option.id === "notifications" && notificationCount > 0 && (
                                <Badge className="bg-red-500 text-white text-xs px-1.5">
                                  {notificationCount}
                                </Badge>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Logout — fixed at bottom */}
            <div className="pt-3 space-y-2 border-t mt-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => { onLogout(); onClose(); }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Cerrar Panel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Notification Panel for non-client roles */}
      {user.role !== "Cliente" && (
        <NotificationPanel
          isOpen={isNotificationsPanelOpen}
          onClose={() => setIsNotificationsPanelOpen(false)}
          user={user}
        />
      )}
    </>
  );
}