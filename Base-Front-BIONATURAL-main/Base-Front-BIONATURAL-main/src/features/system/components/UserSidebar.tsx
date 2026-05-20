import React, { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { NotificationPanel } from "./NotificationPanel";
import { User, Bell, LogOut, UserCircle, Package, Heart, ChevronRight, X, Leaf } from "lucide-react";

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string; role: string };
  onLogout: () => void;
  onProfileOpen: () => void;
  onNotificationsOpen?: () => void;
  onPaymentMethodsOpen?: () => void;
  onOrdersOpen?: () => void;
  onFavoritesOpen?: () => void;
}

const getMenuOptions = (role: string) => {
  if (role === "Cliente") {
    return [
      { id: "profile",       label: "Mi Perfil",        description: "Información personal",        icon: UserCircle, color: '#3B82F6', bg: '#EFF6FF', action: "profile" },
      { id: "orders",        label: "Mis Pedidos",       description: "Ver y gestionar pedidos",     icon: Package,    color: '#8B5CF6', bg: '#F5F3FF', action: "orders" },
      { id: "favorites",     label: "Mis Favoritos",     description: "Productos guardados",         icon: Heart,      color: '#EF4444', bg: '#FEF2F2', action: "favorites" },
      { id: "notifications", label: "Notificaciones",    description: "Alertas de stock",            icon: Bell,       color: '#F59E0B', bg: '#FFFBEB', action: "notifications" },
    ];
  }
  if (['Vendedor', 'Bodega', 'Contador'].includes(role)) {
    return [
      { id: "profile",       label: "Mi Perfil",      description: "Información personal",  icon: UserCircle, color: '#3B82F6', bg: '#EFF6FF', action: "profile" },
      { id: "notifications", label: "Notificaciones", description: "Alertas del sistema",   icon: Bell,       color: '#F59E0B', bg: '#FFFBEB', action: "notifications" },
    ];
  }
  return [
    { id: "profile", label: "Mi Perfil", description: "Información personal", icon: UserCircle, color: '#3B82F6', bg: '#EFF6FF', action: "profile" },
  ];
};

const getRoleColor = (role: string) => {
  const map: Record<string, { bg: string; text: string }> = {
    Administrador: { bg: '#FEE2E2', text: '#991B1B' },
    Vendedor:      { bg: '#DBEAFE', text: '#1E40AF' },
    Bodega:        { bg: '#D1FAE5', text: '#065F46' },
    Contador:      { bg: '#EDE9FE', text: '#5B21B6' },
    Cliente:       { bg: '#D8F3DC', text: '#1B4332' },
  };
  return map[role] || { bg: '#F3F4F6', text: '#374151' };
};

const getUserInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

export function UserSidebar({ isOpen, onClose, user, onLogout, onProfileOpen, onNotificationsOpen, onPaymentMethodsOpen, onOrdersOpen, onFavoritesOpen }: UserSidebarProps) {
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const menuOptions = getMenuOptions(user.role);
  const roleStyle = getRoleColor(user.role);

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "profile":       onProfileOpen(); onClose(); break;
      case "orders":        if (onOrdersOpen) { onOrdersOpen(); onClose(); } break;
      case "favorites":     if (onFavoritesOpen) { onFavoritesOpen(); onClose(); } break;
      case "notifications":
        if (user.role === "Cliente" && onNotificationsOpen) { onNotificationsOpen(); onClose(); }
        else setIsNotificationsPanelOpen(true);
        break;
      case "payment-methods": if (onPaymentMethodsOpen) { onPaymentMethodsOpen(); onClose(); } break;
      default: onClose();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-sm p-0 gap-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Panel de usuario</SheetTitle>
            <SheetDescription>Menú de opciones del usuario</SheetDescription>
          </SheetHeader>

          {/* Header del panel */}
          <div style={{ borderBottom: '1px solid #E5E5E2', padding: '16px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf style={{ width: 16, height: 16, color: '#3A7D44' }} />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A', display: 'block', lineHeight: 1.2 }}>Bionatural</span>
                <span style={{ fontSize: 11, color: '#737370', display: 'block', lineHeight: 1 }}>Tienda Naturista</span>
              </div>
            </div>

            {/* Info usuario */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, backgroundColor: '#FAFAF8', border: '1px solid #E5E5E2' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#3A7D44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{getUserInitials(user.name)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                <p style={{ fontSize: 12, color: '#737370', margin: '1px 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, backgroundColor: roleStyle.bg, color: roleStyle.text }}>{user.role}</span>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <ScrollArea className="flex-1">
            <div style={{ padding: '16px 16px 8px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px 4px' }}>Opciones</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {menuOptions.map(option => (
                  <button key={option.id} onClick={() => handleMenuAction(option.action)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, backgroundColor: 'white', border: '1px solid #F0F0EE', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)'; }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: option.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <option.icon style={{ width: 18, height: 18, color: option.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1A', margin: 0 }}>{option.label}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '1px 0 0' }}>{option.description}</p>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, color: '#D1D5DB', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Solo botón cerrar sesión */}
          <div style={{ padding: '12px 16px 20px', borderTop: '1px solid #F0F0EE', flexShrink: 0 }}>
            <button onClick={() => { onLogout(); onClose(); }}
              style={{ width: '100%', height: 46, borderRadius: 12, backgroundColor: '#FEF2F2', border: '1.5px solid #FEE2E2', color: '#DC2626', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FEF2F2')}>
              <LogOut style={{ width: 16, height: 16 }} /> Cerrar Sesión
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {user.role !== "Cliente" && (
        <NotificationPanel isOpen={isNotificationsPanelOpen} onClose={() => setIsNotificationsPanelOpen(false)} user={user} />
      )}
    </>
  );
}
