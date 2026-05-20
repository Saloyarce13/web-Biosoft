import React from 'react';
import { SidebarTrigger } from '../../../components/ui/sidebar';
import { Leaf, ChevronDown } from 'lucide-react';

interface AppHeaderProps {
  user: { name: string; email: string; role: string; permissions?: string[] };
  onLogout?: () => void;
  cartItemsCount?: number;
  onCartOpen?: () => void;
  onUserSidebarOpen: () => void;
}

const ROLE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Administrador: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  Vendedor:      { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  Bodega:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  Contador:      { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function AppHeader({ user, onUserSidebarOpen }: AppHeaderProps) {
  const roleStyle = ROLE_STYLES[user.role] || { bg: '#F4F4F2', color: '#737370', border: '#E5E5E2' };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      borderBottom: '1px solid #E5E5E2',
      backgroundColor: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

        {/* Izquierda: trigger + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SidebarTrigger style={{ color: '#737370' }} />
          <div style={{ width: 1, height: 20, backgroundColor: '#E5E5E2' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf style={{ width: 16, height: 16, color: '#3A7D44' }} />
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>Bionatural</span>
              <span style={{ fontSize: 10, color: '#737370', display: 'block', lineHeight: 1 }}>Sistema de Gestión</span>
            </div>
          </div>
        </div>

        {/* Derecha: usuario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onUserSidebarOpen}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, border: '1px solid #E5E5E2', backgroundColor: 'white', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
          >
            <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#3A7D44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{getInitials(user.name)}</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', display: 'block', lineHeight: 1.2 }}>{user.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, backgroundColor: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`, display: 'inline-block', lineHeight: 1.6 }}>
                {user.role}
              </span>
            </div>
            <ChevronDown style={{ width: 14, height: 14, color: '#737370' }} />
          </button>
        </div>
      </div>
    </header>
  );
}
