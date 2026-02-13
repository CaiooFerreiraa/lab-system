import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getSectorPermissions } from "../config/permissions";

const MODULES = [
  { id: "management", path: "/employee", label: "Funcionários", icon: "group", color: "hsl(210, 80%, 55%)", desc: "Gerenciar cadastros de funcionários" },
  { id: "engineering", path: "/mark", label: "Marcas", icon: "label", color: "hsl(280, 70%, 55%)", desc: "Gerenciar marcas e métodos" },
  { id: "engineering", path: "/model", label: "Modelos", icon: "view_in_ar", color: "hsl(340, 75%, 55%)", desc: "Gerenciar modelos e especificações" },
  { id: "engineering", path: "/msc", label: "Fichas Técnicas (MSC)", icon: "assignment", color: "hsl(45, 90%, 50%)", desc: "Gerenciar padrões DN, BN e Base" },
  { id: "engineering", path: "/product", label: "Produtos", icon: "inventory_2", color: "hsl(160, 60%, 45%)", desc: "Gerenciar materiais e produtos" },
  { id: "management", path: "/sector", label: "Setores", icon: "domain", color: "hsl(30, 85%, 55%)", desc: "Gerenciar setores laboratoriais" },
  { id: "quality", path: "/test", label: "Testes", icon: "science", color: "hsl(190, 70%, 50%)", desc: "Gerenciar testes e resultados" },
  { id: "quality", path: "/test/report", label: "Relatório", icon: "bar_chart", color: "hsl(260, 70%, 60%)", desc: "Dashboard e análise de testes" },
  { id: "peeling", path: "/descolagem", label: "Descolagem", icon: "picture_as_pdf", color: "hsl(15, 80%, 55%)", desc: "Upload e gestão de PDFs de descolagem" },
  { id: "inventory", path: "/balancas", label: "Instrumentação (Balanças)", icon: "scale", color: "hsl(0, 70%, 50%)", desc: "Controle de instrumentos e pesagens" },
];

export default function Home() {
  const { user } = useAuth();
  const perms = getSectorPermissions(user?.setor_nome, user?.role);

  const visibleModules = MODULES.filter(mod => {
    // Admin sempre vê tudo
    if (user?.role === "admin") return true;

    // Se o setor tem restrições de grupos
    if (perms.sidebarGroups) {
      return perms.sidebarGroups.includes(mod.id) || mod.id === "main";
    }

    return true; // Se não houver restrição no setor, vê tudo
  });

  return (
    <main className="home-page">
      <div className="home-hero">
        <h1 className="home-title">
          Bem-vindo ao <span className="gradient-text">Lab System</span>
        </h1>
        <p className="home-subtitle">
          Sistema de gerenciamento laboratorial. Selecione um módulo para começar.
        </p>
      </div>

      <div className="home-grid">
        {visibleModules.map((mod) => (
          <Link key={mod.path} to={mod.path} className="home-card" style={{ "--card-accent": mod.color }}>
            <div className="home-card-icon">
              <span className="material-symbols-outlined">{mod.icon}</span>
            </div>
            <h2>{mod.label}</h2>
            <p>{mod.desc}</p>
            <span className="home-card-arrow material-symbols-outlined">arrow_forward</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
