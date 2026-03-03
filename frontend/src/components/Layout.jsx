import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, FileText, BookOpen, Building, Receipt, LogOut, Menu, X, ChevronLeft, ChevronRight, UserCog, Settings, BarChart2, Eye, AlertTriangle } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, logout, setUser, setTenant } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mode impersonation
  const isImpersonating = !!sessionStorage.getItem('sa_backup_token');

  const handleExitImpersonation = () => {
    const saToken = sessionStorage.getItem('sa_backup_token');
    const saUser = JSON.parse(sessionStorage.getItem('sa_backup_user') || 'null');
    const saTenant = JSON.parse(sessionStorage.getItem('sa_backup_tenant') || 'null');
    localStorage.setItem('access_token', saToken);
    localStorage.setItem('user', JSON.stringify(saUser));
    localStorage.setItem('tenant', JSON.stringify(saTenant));
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('sa_backup_token');
    sessionStorage.removeItem('sa_backup_user');
    sessionStorage.removeItem('sa_backup_tenant');
    setUser(saUser);
    setTenant(saTenant);
    navigate('/super-admin');
  };

  const handleLogout = async () => {
    if (isImpersonating) {
      handleExitImpersonation();
      return;
    }
    await logout();
    navigate('/login');
  };

  const allNavGroups = [
    {
      label: null,
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN'] },
        { name: 'Pilotage', href: '/pilotage', icon: BarChart2, roles: ['MANAGER', 'COMPANY_ADMIN'] },
      ]
    },
    {
      label: 'Gestion',
      items: [
        { name: 'Clients', href: '/clients', icon: Users, roles: ['MANAGER', 'COMPANY_ADMIN'] },
        { name: 'Devis', href: '/devis', icon: FileText, roles: ['MANAGER', 'COMPANY_ADMIN'] },
        { name: 'Chantiers', href: '/chantiers', icon: Building, roles: ['EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN'] },
        { name: 'Factures', href: '/factures', icon: Receipt, roles: ['MANAGER', 'COMPANY_ADMIN'] },
      ]
    },
    {
      label: 'Ressources',
      items: [
        { name: 'Catalogue', href: '/catalogue', icon: BookOpen, roles: ['MANAGER', 'COMPANY_ADMIN'] },
        { name: 'Employés', href: '/employes', icon: UserCog, roles: ['MANAGER', 'COMPANY_ADMIN'] },
      ]
    },
  ];

  const navGroups = allNavGroups
    .map(g => ({ ...g, items: g.items.filter(item => item.roles.includes(user?.role)) }))
    .filter(g => g.items.length > 0);

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Bannière Période d'essai */}
      {tenant?.statut === 'TRIAL' && tenant?.trial_ends_at && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">Période d'essai</span>
            <span className="text-amber-100">
              — Expire le{' '}
              <strong className="text-white">
                {new Date(tenant.trial_ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </strong>
              {' '}({Math.max(0, Math.ceil((new Date(tenant.trial_ends_at) - new Date()) / (1000*60*60*24)))} jours restants)
            </span>
          </div>
          <button
            onClick={() => navigate('/settings?tab=abonnement')}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-amber-600 rounded font-semibold hover:bg-amber-50 transition-colors text-xs"
          >
            Activer mon compte
          </button>
        </div>
      )}

      {/* Bannière Impersonation */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="font-semibold">Mode impersonation</span>
            <span className="text-red-200">— Vous consultez le compte de <strong className="text-white">{tenant?.nom}</strong></span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-red-600 rounded font-semibold hover:bg-red-50 transition-colors text-xs"
          >
            <AlertTriangle className="w-3 h-3" />
            Quitter le mode impersonation
          </button>
        </div>
      )}
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-600 to-blue-800 shadow-2xl">
          {/* Logo & Toggle */}
          <div className={`flex items-center flex-shrink-0 py-6 border-b border-blue-500/30 ${sidebarCollapsed ? 'px-3 justify-center' : 'px-6 justify-between'}`}>
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${sidebarCollapsed ? '' : ''}`}
            >
              <img src="/Logo_Autobat.png" alt="Autobat" className="w-9 h-9 rounded-xl flex-shrink-0 bg-white p-1 object-contain" />
              {!sidebarCollapsed && <span className="text-xl font-bold text-white">Autobat</span>}
            </button>
            <div className="flex items-center gap-1">
              {!sidebarCollapsed && ['MANAGER', 'COMPANY_ADMIN'].includes(user?.role) && <GlobalSearch />}
              {!sidebarCollapsed && <NotificationBell />}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-white hover:bg-blue-700/50 rounded-lg transition-colors"
                title={sidebarCollapsed ? 'Développer' : 'Réduire'}
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>
          </div>


          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navGroups.map((group, gi) => (
              <div key={gi} className={gi > 0 ? 'pt-3' : ''}>
                {gi > 0 && !sidebarCollapsed && (
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <div className="h-px flex-1 bg-blue-500/30" />
                    <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">{group.label}</span>
                    <div className="h-px flex-1 bg-blue-500/30" />
                  </div>
                )}
                {gi > 0 && sidebarCollapsed && <div className="h-px bg-blue-500/30 mx-2 mb-3" />}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <button
                        key={item.name}
                        onClick={() => navigate(item.href)}
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                          active
                            ? 'bg-white text-blue-600 shadow-lg'
                            : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                        }`}
                        title={sidebarCollapsed ? item.name : ''}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-blue-200 group-hover:text-white'}`} />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User / Paramètres & Logout */}
          <div className="flex-shrink-0 border-t border-blue-500/30">
            <div className="px-4 py-4 space-y-2">
              {/* Carte unifiée entreprise + profil → Paramètres */}
              <button
                onClick={() => navigate('/settings?tab=profil')}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-3'} py-3 bg-blue-700/30 hover:bg-blue-700/60 rounded-xl transition-all duration-200 group`}
                title={sidebarCollapsed ? `${tenant?.nom} — ${user?.prenom} ${user?.nom}` : ''}
              >
                {/* Avatar : logo tenant ou initiales */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-blue-500/30 flex items-center justify-center">
                  {tenant?.logo_url
                    ? <img src={tenant.logo_url} alt="logo" className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-white leading-none">
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                      </span>
                  }
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-white truncate">{tenant?.nom}</p>
                    <p className="text-xs text-blue-200 truncate">{user?.prenom} {user?.nom}</p>
                    <p className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                      <Settings className="w-3 h-3" />
                      Profil & Paramètres
                    </p>
                  </div>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-4'} py-2.5 text-sm font-medium text-red-100 hover:bg-red-500/20 hover:text-white rounded-xl transition-all duration-200`}
                title={sidebarCollapsed ? 'Déconnexion' : ''}
              >
                <LogOut className="w-5 h-5" />
                {!sidebarCollapsed && <span>Déconnexion</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <div className="lg:hidden">
        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-blue-600 to-blue-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-blue-500/30">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <img src="/Logo_Autobat.png" alt="Autobat" className="w-9 h-9 rounded-xl bg-white p-1 object-contain" />
                <span className="text-xl font-bold text-white">Autobat</span>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-white hover:bg-blue-700/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>


            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navGroups.map((group, gi) => (
                <div key={gi} className={gi > 0 ? 'pt-3' : ''}>
                  {gi > 0 && (
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <div className="h-px flex-1 bg-blue-500/30" />
                      <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">{group.label}</span>
                      <div className="h-px flex-1 bg-blue-500/30" />
                    </div>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            navigate(item.href);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-white text-blue-600 shadow-lg'
                              : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-blue-200'}`} />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* User / Paramètres & Logout */}
            <div className="flex-shrink-0 border-t border-blue-500/30">
              <div className="px-4 py-4 space-y-2">
                {/* Carte unifiée entreprise + profil → Paramètres */}
                <button
                  onClick={() => {
                    navigate('/settings?tab=profil');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 bg-blue-700/30 hover:bg-blue-700/60 rounded-xl transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-blue-500/30 flex items-center justify-center">
                    {tenant?.logo_url
                      ? <img src={tenant.logo_url} alt="logo" className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-white leading-none">
                          {user?.prenom?.[0]}{user?.nom?.[0]}
                        </span>
                    }
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-white truncate">{tenant?.nom}</p>
                    <p className="text-xs text-blue-200 truncate">{user?.prenom} {user?.nom}</p>
                    <p className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                      <Settings className="w-3 h-3" />
                      Profil & Paramètres
                    </p>
                  </div>
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-100 hover:bg-red-500/20 hover:text-white rounded-xl transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/Logo_Autobat.png" alt="Autobat" className="w-7 h-7 rounded-lg object-contain" />
            <span className="text-lg font-bold text-blue-600">Autobat</span>
          </div>
          <div className="flex items-center gap-1">
            {['MANAGER', 'COMPANY_ADMIN'].includes(user?.role) && <GlobalSearch light />}
            <NotificationBell light />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'} ${isImpersonating && tenant?.statut === 'TRIAL' ? 'pt-[72px]' : isImpersonating || tenant?.statut === 'TRIAL' ? 'pt-9' : ''}`}>
        {children}
      </main>
    </div>
  );
}
