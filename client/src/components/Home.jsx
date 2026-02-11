import { Link } from "react-router-dom";

const MODULES = [
  { path: "/employee", label: "Funcionários", icon: "group", color: "hsl(210, 80%, 55%)", desc: "Gerenciar cadastros de funcionários" },
  { path: "/mark", label: "Marcas", icon: "label", color: "hsl(280, 70%, 55%)", desc: "Gerenciar marcas e métodos" },
  { path: "/model", label: "Modelos", icon: "view_in_ar", color: "hsl(340, 75%, 55%)", desc: "Gerenciar modelos e especificações" },
  { path: "/msc", label: "Fichas Técnicas (MSC)", icon: "assignment", color: "hsl(45, 90%, 50%)", desc: "Gerenciar padrões DN, BN e Base" },
  { path: "/product", label: "Produtos", icon: "inventory_2", color: "hsl(160, 60%, 45%)", desc: "Gerenciar materiais e produtos" },
  { path: "/sector", label: "Setores", icon: "domain", color: "hsl(30, 85%, 55%)", desc: "Gerenciar setores laboratoriais" },
  { path: "/test", label: "Testes", icon: "science", color: "hsl(190, 70%, 50%)", desc: "Gerenciar testes e resultados" },
  { path: "/test/report", label: "Relatório", icon: "bar_chart", color: "hsl(260, 70%, 60%)", desc: "Dashboard e análise de testes" },
  { path: "/descolagem", label: "Descolagem", icon: "picture_as_pdf", color: "hsl(15, 80%, 55%)", desc: "Upload e gestão de PDFs de descolagem" },
];

export default function Home() {
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
        {MODULES.map((mod) => (
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
