import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bot, Heart, CloudSun, Calendar,
  Zap, Users, Settings, ChevronLeft, ChevronRight,
  Wifi, WifiOff, LogOut, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

// moduleId: null = always visible | string = requires that module to be active
const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',   id: 'nav-dashboard', moduleId: null      },
  { to: '/assistant', icon: Bot,             label: 'AI Assistant',id: 'nav-assistant', moduleId: null      },
  { to: '/health',    icon: Heart,           label: 'Health',      id: 'nav-health',    moduleId: 'health'  },
  { to: '/weather',   icon: CloudSun,        label: 'Weather',     id: 'nav-weather',   moduleId: 'weather' },
  { to: '/calendar',  icon: Calendar,        label: 'Calendar',    id: 'nav-calendar',  moduleId: null      },
  { to: '/energy',    icon: Zap,             label: 'Energy',      id: 'nav-energy',    moduleId: 'energy'  },
  { to: '/community', icon: Users,           label: 'Community',   id: 'nav-community', moduleId: null      },
  { to: '/settings',  icon: Settings,        label: 'Settings',    id: 'nav-settings',  moduleId: null      },
];

const PAGE_COLORS = {
  '/':          'var(--accent-primary)',
  '/assistant': 'var(--accent-secondary)',
  '/health':    'var(--accent-rose)',
  '/weather':   'var(--accent-teal)',
  '/calendar':  'var(--accent-amber)',
  '/energy':    '#eab308',
  '/community': 'var(--accent-emerald)',
  '/settings':  'var(--text-muted)',
};

export default function Sidebar({ connected }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const accentColor = PAGE_COLORS[location.pathname] || 'var(--accent-primary)';
  const { logout } = useAuth();
  const { modules } = useSettings();

  const activeModuleIds = new Set(
    modules.filter(m => m.active).map(m => m.id)
  );

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ '--page-accent': accentColor }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '20px 0' : '20px 20px', display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between', gap:10, borderBottom:'1px solid var(--border-glass)', marginBottom:8 }}>
        {!collapsed && (
          <div>
            <div className="sidebar-logo">SmartHub</div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:2, letterSpacing:'0.06em' }}>ENVIRONMENT HUB</div>
          </div>
        )}
        <button
          id="sidebar-toggle"
          onClick={() => setCollapsed(c => !c)}
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-glass)', borderRadius:8, padding:'6px', cursor:'pointer', color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.25s ease' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>
      </div>

      <nav style={{ flex:1, padding:'8px 12px', display:'flex', flexDirection:'column', gap:4, overflowY:'auto' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, id, moduleId }) => {
          const locked = moduleId !== null && !activeModuleIds.has(moduleId);
          if (locked) return (
            <div
              key={to}
              id={id}
              title={`🔒 ${label} — purchase on SmartEnv website to unlock`}
              className="nav-item"
              style={{ opacity:0.35, cursor:'not-allowed', pointerEvents:'none' }}
            >
              <Icon className="nav-icon" size={20} />
              {!collapsed && <span className="nav-label">{label}</span>}
              {!collapsed && <Lock size={12} style={{ marginLeft:'auto', flexShrink:0 }} />}
            </div>
          );
          return (
            <NavLink
              key={to}
              to={to}
              id={id}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
              style={({ isActive }) => isActive ? { '--active-accent': PAGE_COLORS[to] } : {}}
            >
              <Icon className="nav-icon" size={20} />
              <span className="nav-label">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Connection and Actions Footer */}
      <div style={{ padding: collapsed ? '12px 0' : '12px 20px', borderTop:'1px solid var(--border-glass)', display:'flex', flexDirection:'column', gap:8 }}>
        <button onClick={logout} className="nav-item" style={{ background:'none', border:'none', cursor:'pointer', padding: collapsed ? 0 : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start', color:'var(--accent-rose)' }}>
          <LogOut className="nav-icon" size={18} />
          {!collapsed && <span className="nav-label">Sign Out</span>}
        </button>

        <div style={{ display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-start', gap:6, marginTop:8, paddingLeft: collapsed ? 0 : 12 }}>
          {connected
            ? <><div className="pulse-dot" style={{background:'var(--accent-primary)'}} />{!collapsed && <span style={{ fontSize:'0.7rem', color:'var(--accent-primary)', fontWeight:600 }}>Live Data</span>}</>
            : <><WifiOff size={14} color="var(--accent-rose)"/>{!collapsed && <span style={{ fontSize:'0.7rem', color:'var(--accent-rose)', fontWeight:600 }}>Offline</span>}</>
          }
        </div>
      </div>
    </aside>
  );
}
