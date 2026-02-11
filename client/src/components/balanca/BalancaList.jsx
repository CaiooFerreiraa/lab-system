import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { balancaApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function BalancaList() {
  const [balancas, setBalancas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  const fetchBalancas = async () => {
    setLoading(true);
    try {
      const res = await balancaApi.list();
      setBalancas(res.data || []);
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao carregar balanças." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalancas();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Deseja excluir esta balança?")) return;
    try {
      await balancaApi.remove(id);
      setPopup({ show: true, msg: "Balança excluída com sucesso!" });
      fetchBalancas();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao excluir balança." });
    }
  };

  const filtered = balancas.filter(b =>
    b.patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.setor_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <PageHeader
        title="Balanças"
        searchPlaceholder="Buscar por patrimônio ou setor..."
        onSearch={setSearchTerm}
        registerPath="/balanca/register"
      />

      <div className="data-grid">
        {filtered.map((b) => (
          <div className="data-card" key={b.id}>
            <div className="data-card-avatar" style={{ background: 'var(--accent-primary-transparent)', color: 'var(--accent-primary)' }}>
              <span className="material-symbols-outlined">scale</span>
            </div>
            <div className="data-card-info">
              <h3 className="data-card-title">{b.patrimonio}</h3>
              <p className="data-card-subtitle">{b.setor_nome || "Setor não definido"}</p>
              <div className="data-card-tags">
                <span className={`tag ${b.status === 'Aprovado' ? 'tag--success' : 'tag--danger'}`}>
                  {b.status}
                </span>
                {b.calibracao_externa && <span className="tag tag--muted">Calibração Ext.</span>}
                {b.status === 'Reprovado' && (
                  <span className="tag tag--danger" style={{ opacity: 0.8 }}>
                    Diff: {b.diferenca_reprovacao}
                  </span>
                )}
              </div>
            </div>
            <div className="data-card-actions">
              <Link to={`/balanca/edit/${b.id}`} className="icon-btn" title="Editar">
                <span className="material-symbols-outlined">edit</span>
              </Link>
              <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(b.id)} title="Excluir">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <span className="material-symbols-outlined empty-icon">scale</span>
          <p>Nenhuma balança encontrada.</p>
        </div>
      )}
    </>
  );
}
