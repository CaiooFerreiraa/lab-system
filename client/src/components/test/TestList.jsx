import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { testApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function TestList() {
  const [laudos, setLaudos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const fetchLaudos = async () => {
    setLoading(true);
    try {
      const res = await testApi.listLaudos();
      setLaudos(res.data || []);
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao carregar laudos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaudos();
  }, []);

  const filtered = laudos.filter(l =>
    (l.codigo_laudo && l.codigo_laudo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    l.id.toString().includes(searchTerm) ||
    l.modelo_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.fk_material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <PageHeader
        title="Laudos Técnicos"
        searchPlaceholder="Buscar por Código, ID, modelo ou material..."
        onSearch={setSearchTerm}
        registerPath="/test/register"
      />

      <div className="data-grid">
        {filtered.map((l) => (
          <div className="data-card" key={l.id} onClick={() => navigate(`/laudo/${l.id}`)} style={{ cursor: 'pointer' }}>
            <div className={`data-card-avatar ${l.status_geral === 'Aprovado' ? 'tag--success' : 'tag--danger'}`}
              style={{ background: l.status_geral === 'Aprovado' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: 'inherit' }}>
              <span className="material-symbols-outlined">{l.status_geral === 'Aprovado' ? 'verified' : 'report'}</span>
            </div>
            <div className="data-card-info">
              <h3 className="data-card-title">{l.codigo_laudo || `Laudo #${l.id}`} - {l.modelo_nome}</h3>
              <p className="data-card-subtitle">{l.fk_material} | {l.setor_nome}</p>
              <div className="data-card-tags">
                <span className={`tag ${l.status_geral === 'Aprovado' ? 'tag--success' : 'tag--danger'}`}>
                  {l.status_geral}
                </span>
                <span className="tag tag--muted">{l.total_testes} Teste(s)</span>
                <span className="tag tag--info">{new Date(l.data_criacao).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="data-card-actions">
              <Link to={`/laudo/${l.id}`} className="icon-btn" title="Visualizar/Editar Laudo">
                <span className="material-symbols-outlined">visibility</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <span className="material-symbols-outlined empty-icon">assignment</span>
          <p>Nenhum laudo encontrado.</p>
        </div>
      )}
    </>
  );
}
