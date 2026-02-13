import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { testApi, sectorApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";
import { useAuth } from "../../contexts/AuthContext";
import { getSectorPermissions, filterMaterials } from "../../config/permissions";

export default function TestList() {
  const [laudos, setLaudos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const [sectorsList, setSectorsList] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const navigate = useNavigate();

  const { user } = useAuth();
  const sectorPerms = useMemo(
    () => getSectorPermissions(user?.setor_nome, user?.role, user?.config_perfil),
    [user]
  );

  const fetchLaudos = async () => {
    setLoading(true);
    try {
      const [resLaudos, resSectors] = await Promise.all([
        testApi.listLaudos(),
        sectorApi.list()
      ]);
      setLaudos(resLaudos.data || []);
      setSectorsList(resSectors.data || []);
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao carregar dados." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaudos();
  }, []);

  const filtered = useMemo(() => {
    let list = laudos;

    // 1. Filtro de segurança (Materiais permitidos pelo setor)
    // Se for Lab/Admin, allowedMaterialTypes é null, permitindo ver tudo.
    list = filterMaterials(list, sectorPerms.allowedMaterialTypes);

    // 2. Filtro EXCLUSIVO do Laboratório: Selecionar setor específico
    if ((sectorPerms.canEditTestResults || user?.role === 'admin') && selectedSector) {
      list = list.filter(l => String(l.fk_cod_setor) === String(selectedSector));
    }

    // 3. Filtrar pelo termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(l =>
        (l.codigo_laudo && l.codigo_laudo.toLowerCase().includes(term)) ||
        l.id.toString().includes(term) ||
        l.modelo_nome?.toLowerCase().includes(term) ||
        l.fk_material?.toLowerCase().includes(term)
      );
    }

    return list;
  }, [laudos, searchTerm, sectorPerms, selectedSector, user?.role]);

  const showSectorFilter = sectorPerms.canEditTestResults || user?.role === 'admin';

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <div className="page-header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <PageHeader
          title="Laudos Técnicos"
          searchPlaceholder="Buscar por Código, ID, modelo ou material..."
          onSearch={setSearchTerm}
          registerPath="/test/register"
        />

        {showSectorFilter && (
          <div className="sector-filter" style={{ minWidth: '200px' }}>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="form-control"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
            >
              <option value="">Todos os Setores</option>
              {sectorsList.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
        )}
      </div>

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
