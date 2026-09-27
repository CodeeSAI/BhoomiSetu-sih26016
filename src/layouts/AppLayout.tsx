// ============================================================
// BhoomiSetu — Master Command Center Shell & Layout
// Premium Glassmorphism Architecture with Category-Colored RBAC
// ============================================================
import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, Map, GitBranch, Bell, Award, Banknote,
  KeyRound, Users, FileText, AlertTriangle, BarChart3, FileBarChart,
  Plug, ClipboardList, UserCog, Settings, Search, LogOut, Menu, X,
  ChevronLeft, MapPin, Home, Milestone, Shield, Smartphone, FileUp,
  Sparkles, ShieldAlert, Command
} from 'lucide-react';
import type { Permission } from '../types';

export type NavFamily = 'operations' | 'gis' | 'financial' | 'rr' | 'intelligence' | 'governance';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  family: NavFamily;
  check?: (p: Permission) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  // Operations (Blue)
  { label: 'Command Center', icon: <LayoutDashboard size={16} />, path: '/dashboard', family: 'operations' },
  { label: 'Projects Registry', icon: <FolderKanban size={16} />, path: '/projects', family: 'operations' },
  { label: 'Approval Workflow', icon: <GitBranch size={16} />, path: '/workflow', family: 'operations' },
  { label: 'Sec. 11/19 Gazette', icon: <Bell size={16} />, path: '/notifications', family: 'operations' },
  { label: 'Milestones & Timeline', icon: <Milestone size={16} />, path: '/milestones', family: 'operations' },

  // Land & GIS (Cyan / Teal)
  { label: 'Geo-Spatial GIS & ULPIN', icon: <Map size={16} />, path: '/parcels', family: 'gis' },
  { label: 'Mobile Field Survey', icon: <Smartphone size={16} />, path: '/field-mode', family: 'gis', check: (p) => p.canVerifyParcel || p.canGeoTag },
  { label: 'Data Ingestion Engine', icon: <FileUp size={16} />, path: '/import', family: 'gis' },

  // Financial (Emerald)
  { label: 'Valuation & Awards', icon: <Award size={16} />, path: '/awards', family: 'financial' },
  { label: 'Compensation Disbursal', icon: <Banknote size={16} />, path: '/compensation', family: 'financial' },
  { label: 'Possession Handover', icon: <KeyRound size={16} />, path: '/possession', family: 'financial' },

  // R&R (Violet)
  { label: 'Rehabilitation Plans', icon: <Home size={16} />, path: '/rr', family: 'rr' },
  { label: 'Affected Families', icon: <Users size={16} />, path: '/families', family: 'rr' },

  // Intelligence & Docs (Indigo)
  { label: 'Executive Analytics', icon: <BarChart3 size={16} />, path: '/analytics', family: 'intelligence' },
  { label: 'MIS Statutory Reports', icon: <FileBarChart size={16} />, path: '/reports', family: 'intelligence' },
  { label: 'Document Vault', icon: <FileText size={16} />, path: '/documents', family: 'intelligence' },
  { label: 'Alerts & Critical Tasks', icon: <AlertTriangle size={16} />, path: '/alerts', family: 'intelligence' },

  // Governance & Security (Rose / Navy)
  { label: 'National Connectors', icon: <Plug size={16} />, path: '/integrations', family: 'governance', check: (p) => p.canManageIntegrations || p.canViewNational },
  { label: 'Governance & Compliance', icon: <Shield size={16} />, path: '/governance', family: 'governance' },
  { label: 'Immutable Audit Trail', icon: <ClipboardList size={16} />, path: '/audit', family: 'governance', check: (p) => p.canViewAudit },
  { label: 'User Directory & Roles', icon: <UserCog size={16} />, path: '/users', family: 'governance', check: (p) => p.canManageUsers },
  { label: 'System Configuration', icon: <Settings size={16} />, path: '/settings', family: 'governance' },
];

const FAMILY_CONFIG: Record<NavFamily, { label: string; textClass: string; activeClass: string; iconBg: string }> = {
  operations: {
    label: 'OPERATIONS',
    textClass: 'text-blue-400',
    activeClass: 'bg-blue-600/20 text-white border-l-2 border-blue-400 shadow-sm shadow-blue-500/10',
    iconBg: 'group-hover:text-blue-400',
  },
  gis: {
    label: 'LAND & SPATIAL',
    textClass: 'text-cyan-400',
    activeClass: 'bg-cyan-600/20 text-white border-l-2 border-cyan-400 shadow-sm shadow-cyan-500/10',
    iconBg: 'group-hover:text-cyan-400',
  },
  financial: {
    label: 'FINANCIAL',
    textClass: 'text-emerald-400',
    activeClass: 'bg-emerald-600/20 text-white border-l-2 border-emerald-400 shadow-sm shadow-emerald-500/10',
    iconBg: 'group-hover:text-emerald-400',
  },
  rr: {
    label: 'REHABILITATION',
    textClass: 'text-violet-400',
    activeClass: 'bg-violet-600/20 text-white border-l-2 border-violet-400 shadow-sm shadow-violet-500/10',
    iconBg: 'group-hover:text-violet-400',
  },
  intelligence: {
    label: 'INTELLIGENCE',
    textClass: 'text-indigo-400',
    activeClass: 'bg-indigo-600/20 text-white border-l-2 border-indigo-400 shadow-sm shadow-indigo-500/10',
    iconBg: 'group-hover:text-indigo-400',
  },
  governance: {
    label: 'GOVERNANCE & AUDIT',
    textClass: 'text-slate-400',
    activeClass: 'bg-slate-700/30 text-white border-l-2 border-rose-400 shadow-sm shadow-rose-500/10',
    iconBg: 'group-hover:text-slate-300',
  },
};

export default function AppLayout() {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Global search shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const visibleNav = useMemo(() => {
    if (!permissions) return [];
    return NAV_ITEMS.filter(item => !item.check || item.check(permissions));
  }, [permissions]);

  // Group items by family
  const groupedNav = useMemo(() => {
    const groups: { family: NavFamily; items: NavItem[] }[] = [];
    const families: NavFamily[] = ['operations', 'gis', 'financial', 'rr', 'intelligence', 'governance'];
    
    families.forEach(f => {
      const items = visibleNav.filter(item => item.family === f);
      if (items.length > 0) {
        groups.push({ family: f, items });
      }
    });
    return groups;
  }, [visibleNav]);

  if (!user) return null;

  return (
    <div className="h-screen flex bg-surface-50 overflow-hidden font-sans">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-dark/70 backdrop-blur-md lg:hidden transition-all duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Glassmorphic Deep Command Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarOpen ? 'w-64' : 'w-18'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          glass-sidebar text-white flex flex-col transition-all duration-300 ease-in-out select-none
        `}
      >
        {/* Brand Header */}
        <div className={`flex items-center ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} h-16 border-b border-white/10 shrink-0 relative overflow-hidden`}>
          {/* Subtle luminous ambient glow */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-600/25 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron via-amber-500 to-primary-600 flex items-center justify-center shrink-0 shadow-md shadow-saffron/20 border border-white/20">
            <MapPin size={18} className="text-white drop-shadow-xs" />
          </div>
          {sidebarOpen && (
            <div className="ml-3 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white truncate">BhoomiSetu</h1>
                <span className="text-[9px] font-mono uppercase bg-primary-500/20 text-primary-300 border border-primary-400/30 px-1 py-0.2 rounded font-semibold">2.0</span>
              </div>
              <p className="text-[10px] text-surface-400 font-medium tracking-wide">भूमिसेतु • National Platform</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex text-surface-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronLeft size={16} className={`transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Grouped Navigation List */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groupedNav.map(group => {
            const fam = FAMILY_CONFIG[group.family];
            return (
              <div key={group.family} className="space-y-0.5">
                {sidebarOpen && (
                  <p className={`text-[9px] font-bold tracking-wider px-2.5 pb-1 ${fam.textClass} opacity-80 uppercase font-mono`}>
                    {fam.label}
                  </p>
                )}
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                      ${isActive
                        ? fam.activeClass
                        : 'text-surface-300 hover:bg-white/6 hover:text-white'
                      }
                      ${!sidebarOpen ? 'justify-center py-2' : ''}
                    `}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span className={`shrink-0 transition-colors duration-150 ${fam.iconBg}`}>
                      {item.icon}
                    </span>
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User Card & Active Session */}
        <div className={`border-t border-white/10 ${sidebarOpen ? 'p-3' : 'p-2'}`}>
          {sidebarOpen ? (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/8 space-y-2 hover:bg-white/8 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal via-electric to-cyan flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-xs border border-white/20">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-surface-400 font-medium truncate">{user.role}</p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-surface-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  title="Log out of BhoomiSetu"
                >
                  <LogOut size={14} />
                </button>
              </div>

              {user.department && (
                <p className="text-[9px] text-surface-400 truncate border-t border-white/5 pt-1.5 font-mono">
                  {user.department}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex justify-center text-surface-400 hover:text-rose-400 p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Glassmorphic Top Command Header */}
        <header className="h-16 glass-header flex items-center px-4 sm:px-6 gap-3 shrink-0 relative z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-surface-600 hover:text-navy p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
            title="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Global Search Bar with Command Shortcut */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search projects, land parcels, ULPIN, survey numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery('');
                  }
                }}
                className="w-full h-9 pl-9 pr-16 rounded-xl glass-input text-xs text-surface-900 placeholder:text-surface-400 font-medium"
              />
              <div className="hidden sm:inline-flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-surface-400 bg-white/70 rounded-md px-1.5 py-0.5 font-mono border border-surface-200 shadow-xs pointer-events-none">
                <Command size={10} />
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation & Badges */}
          <div className="flex items-center gap-3">
            {/* Elegant Redesigned Demo Environment Badge (Section 6) */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="tracking-wide">DEMO • SYNTHETIC DATA</span>
            </div>

            {/* User Clearance Display */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-surface-200/80">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-surface-900 truncate max-w-[170px] leading-tight">{user.name}</p>
                <p className="text-[10px] text-primary-700 font-semibold truncate max-w-[170px] leading-tight">{user.role}</p>
              </div>
            </div>

            {/* Quick Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-xl text-surface-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="End Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="glass-modal max-w-sm w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                <LogOut size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900">Confirm Sign Out</h3>
                <p className="text-[11px] text-surface-500 font-medium">Terminate authenticated session?</p>
              </div>
            </div>

            <p className="text-xs text-surface-600 leading-relaxed font-medium">
              You are currently signed in as <strong>{user.name}</strong> (<em>{user.role}</em>). All saved operational data will be preserved in synthetic storage.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-200/70">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl glass-button-secondary text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
