import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getSectorPermissions } from "../../config/permissions";
import Logo from "../common/Logo";

const NAV_GROUPS = [
  {
    id: "main",
    label: "Main",
    items: [
      { path: "/", label: "Início", icon: "home", exact: true },
    ]
  },
  {
    id: "management",
    label: "Gestão & Base",
    icon: "settings_accessibility",
    items: [
      { path: "/employee", label: "Funcionários", icon: "group" },
      { path: "/sector", label: "Setores", icon: "domain" },
      { path: "/mark", label: "Marcas", icon: "label" },
    ]
  },
  {
    id: "engineering",
    label: "Produtos & Engenharia",
    icon: "engineering",
    items: [
      { path: "/model", label: "Modelos", icon: "view_in_ar" },
      { path: "/msc", label: "Fichas Técnicas", icon: "assignment" },
      { path: "/product", label: "Referências/Produtos", icon: "inventory_2" },
    ]
  },
  {
    id: "quality",
    label: "Qualidade & Testes",
    icon: "verified",
    items: [
      { path: "/test", label: "Lançar Testes", icon: "science", excludes: ["/test/report"] },
      { path: "/test/report", label: "Relatórios", icon: "bar_chart", exact: true },
    ]
  },
  {
    id: "inventory",
    label: "Instrumentação",
    icon: "precision_manufacturing",
    items: [
      { path: "/balancas", label: "Balanças", icon: "scale" },
    ]
  },
  {
    id: "admin",
    label: "Administração",
    icon: "admin_panel_settings",
    // Visível apenas para admin e moderator (gerenciado no filtro abaixo)
    items: [
      { path: "/users", label: "Usuários", icon: "manage_accounts" },
    ]
  },
  {
    id: "config",
    label: "Configurações",
    icon: "settings",
    items: [
      { path: "/production/settings", label: "Opções de Produção", icon: "settings_suggest" },
      { path: "/advanced/settings", label: "Máquinas & Notificações", icon: "settings_input_component" },
    ]
  }
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const [openGroups, setOpenGroups] = useState({
    management: true,
    engineering: true,
    quality: true,
    inventory: true,
    admin: true
  });

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filtra os grupos de navegação baseado no cargo + setor do usuário
  const getVisibleGroups = () => {
    const userRole = user?.role;
    const userSector = user?.setor_nome;
    const perms = getSectorPermissions(userSector, userRole);

    return NAV_GROUPS.filter((group) => {
      // Filtro por cargo: se o grupo exige roles específicas
      if (group.requiredRoles && !group.requiredRoles.includes(userRole)) {
        return false;
      }

      // Sem restrição de setor → vê tudo
      if (!perms.isRestricted || !perms.sidebarGroups) return true;

      // Com restrição: vê apenas os grupos permitidos
      return perms.sidebarGroups.includes(group.id);
    });
  };

  const visibleGroups = getVisibleGroups();

  // Pega a primeira letra do nome ou email para o avatar
  const userInitial = user?.nome
    ? user.nome.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Logo size={collapsed ? 32 : 36} className="logo-icon" />
          {!collapsed && <h1 className="logo-text">Lab System</h1>}
        </div>
        <button
          className="sidebar-toggle material-symbols-outlined"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? "chevron_right" : "chevron_left"}
        </button>
      </div>

      <nav className="sidebar-nav">
        {visibleGroups.map((group) => (
          <div key={group.id} className="nav-group">
            {group.label !== "Main" && !collapsed && (
              <button className="nav-group-header" onClick={() => toggleGroup(group.id)}>
                <span>{group.label}</span>
                <span className={`material-symbols-outlined group-arrow ${openGroups[group.id] ? "group-arrow--open" : ""}`}>
                  expand_more
                </span>
              </button>
            )}
            {(group.label === "Main" || openGroups[group.id] || collapsed) && (
              <div className="nav-group-items">
                {group.items.map((item) => {
                  let isActive;
                  if (item.exact) {
                    isActive = location.pathname === item.path;
                  } else if (item.excludes) {
                    isActive = location.pathname.startsWith(item.path) &&
                      !item.excludes.some((ex) => location.pathname.startsWith(ex));
                  } else {
                    isActive = location.pathname.startsWith(item.path);
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-item ${isActive ? "nav-item--active" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="material-symbols-outlined nav-icon">
                        {item.icon}
                      </span>
                      {!collapsed && <span className="nav-label">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitial}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.nome || user?.email || "Usuário"}</span>
              <span className="sidebar-user-role">
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'moderator' ? 'Moderador' : 'Operador'}
                {user?.setor_nome ? ` · ${user.setor_nome}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          className="nav-item sidebar-action-btn"
          onClick={toggleTheme}
          title={collapsed ? (theme === 'light' ? 'Modo Escuro' : 'Modo Claro') : undefined}
        >
          <span className="material-symbols-outlined nav-icon">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
          {!collapsed && <span className="nav-label">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
        </button>

        {/* Logout */}
        <button
          className="nav-item sidebar-action-btn sidebar-logout-btn"
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
        >
          <span className="material-symbols-outlined nav-icon">logout</span>
          {!collapsed && <span className="nav-label">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
