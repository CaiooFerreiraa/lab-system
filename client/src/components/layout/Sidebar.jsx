import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

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
      { path: "/descolagem", label: "Descolagem", icon: "picture_as_pdf", excludes: ["/descolagem/report"] },
      { path: "/descolagem/report", label: "Perf. Descolagem", icon: "analytics", exact: true },
    ]
  },
  {
    id: "inventory",
    label: "Instrumentação",
    icon: "precision_manufacturing",
    items: [
      { path: "/balancas", label: "Balanças", icon: "scale" },
    ]
  }
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const [openGroups, setOpenGroups] = useState({
    management: true,
    engineering: true,
    quality: true,
    inventory: true
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

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined logo-icon">biotech</span>
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
        {NAV_GROUPS.map((group) => (
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

      <div className="sidebar-footer" style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
        <button
          className="nav-item"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', padding: '10px' }}
          onClick={toggleTheme}
        >
          <span className="material-symbols-outlined nav-icon">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
          {!collapsed && <span className="nav-label">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
        </button>
      </div>
    </aside>
  );
}
