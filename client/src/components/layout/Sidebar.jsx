import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/", label: "Início", icon: "home", exact: true },
  { path: "/employee", label: "Funcionários", icon: "group" },
  { path: "/mark", label: "Marcas", icon: "label" },
  { path: "/model", label: "Modelos", icon: "view_in_ar" },
  { path: "/msc", label: "Fichas Técnicas (MSC)", icon: "assignment" },
  { path: "/product", label: "Produtos", icon: "inventory_2" },
  { path: "/sector", label: "Setores", icon: "domain" },
  { path: "/test", label: "Testes", icon: "science", excludes: ["/test/report"] },
  { path: "/test/report", label: "Relatórios de Testes", icon: "bar_chart", exact: true },
  { path: "/descolagem", label: "Descolagem", icon: "picture_as_pdf", excludes: ["/descolagem/report"] },
  { path: "/descolagem/report", label: "Performance Descolagem", icon: "analytics", exact: true },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');

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
        {NAV_ITEMS.map((item) => {
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
      </nav>

      <div className="sidebar-footer" style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
        <button
          className="nav-item"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
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
