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
  const [activeTab, setActiveTab] = useState("geral"); // 'geral' or 'descolagem'
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

  const handleReceiveLaudo = async (id) => {
    setLoading(true);
    try {
      await testApi.receiveLaudo(id);
      fetchLaudos();
      setPopup({ show: true, msg: "Laudo marcado como recebido!" });
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao marcar como recebido: " + err.message });
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

    // 4. Filtro por Aba (Geral vs Descolagem)
    if (activeTab === 'geral') {
      list = list.filter(l => l.setor_nome?.toLowerCase() !== 'pré-fabricado');
    } else if (activeTab === 'descolagem') {
      list = list.filter(l => l.setor_nome?.toLowerCase() === 'pré-fabricado');
    }

    return list;
  }, [laudos, searchTerm, sectorPerms, selectedSector, activeTab, user?.role]);

  const showSectorFilter = sectorPerms.canEditTestResults || user?.role === 'admin';

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <header className="page-header" style={{ marginBottom: '30px' }}>
        <div className="page-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 className="page-title">{sectorPerms.allowedTestTypes ? `Laudos: ${user?.setor_nome}` : 'Todos os Laudos'}</h1>
            <p className="text-secondary" style={{ marginTop: '4px' }}>Gerencie ensaios e certificações laboratoriais.</p>
          </div>
          <Link
            to={`/test/register${activeTab === 'descolagem' ? '?type=peeling' : ''}`}
            className="btn btn-primary"
            style={{ padding: '0 25px', height: '48px' }}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Novo Laudo
          </Link>
        </div>

        <div className="report-tabs-new" style={{
          display: 'inline-flex',
          gap: '4px',
          marginBottom: '28px',
          background: 'var(--bg-card)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            className={`report-tab-btn ${activeTab === 'geral' ? 'active' : ''}`}
            onClick={() => setActiveTab('geral')}
            style={{
              padding: '10px 24px',
              background: activeTab === 'geral' ? 'rgba(60, 120, 255, 0.1)' : 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: activeTab === 'geral' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment</span>
            Laudos Gerais
          </button>
          <button
            className={`report-tab-btn ${activeTab === 'descolagem' ? 'active' : ''}`}
            onClick={() => setActiveTab('descolagem')}
            style={{
              padding: '10px 24px',
              background: activeTab === 'descolagem' ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: activeTab === 'descolagem' ? '#eab308' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>straighten</span>
            Descolagem (Peeling)
          </button>
        </div>

        <div className="filters-bar" style={{
          display: 'flex',
          gap: '15px',
          background: 'var(--bg-card)',
          padding: '16px',
          borderRadius: '12px',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div className="search-container" style={{ flex: 1, margin: 0 }}>
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              className="search-input"
              placeholder="Código, modelo ou material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '45px' }}
            />
          </div>

          {showSectorFilter && (
            <div className="sector-filter" style={{ minWidth: '220px' }}>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="filter-input"
                style={{ height: '42px', margin: 0 }}
              >
                <option value="">Todos os Setores</option>
                {sectorsList.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
          )}

          {(searchTerm || selectedSector) && (
            <button className="btn btn-secondary" onClick={() => { setSearchTerm(""); setSelectedSector(""); }} style={{ height: '42px', padding: '0 15px' }}>
              Limpar
            </button>
          )}
        </div>
      </header>

      <div className="laudo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filtered.map((l, index) => {
          // Lógica de Trava FIFO para Descolagem (Pré-Fabricado)
          let isLocked = false;
          const isPeeling = l.setor_nome?.toLowerCase() === 'pré-fabricado';

          if (sectorPerms.canEditTestResults && isPeeling && l.status_geral === 'Pendente' && !l.peeling_priority) {
            // Se for laboratório e pendente sem prioridade, verifica se há algum descolagem pendente anterior sem prioridade
            const earlierPendingPeeling = filtered.slice(0, index).find(prev =>
              prev.setor_nome?.toLowerCase() === 'pré-fabricado' &&
              prev.status_geral === 'Pendente' &&
              !prev.peeling_priority
            );
            if (earlierPendingPeeling) isLocked = true;
          }

          return (
            <div
              className={`laudo-card ${isLocked ? 'laudo-card--locked' : ''}`}
              key={l.id}
              onClick={() => !isLocked && navigate(`/laudo/${l.id}`)}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border-color)',
                opacity: isLocked ? 0.6 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                filter: isLocked ? 'grayscale(0.5)' : 'none',
                overflow: 'hidden'
              }}
            >
              {isPeeling && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  color: 'white',
                  padding: '4px 12px',
                  fontSize: '0.65rem',
                  fontWeight: '900',
                  letterSpacing: '1px',
                  borderBottomLeftRadius: '12px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  zIndex: 2,
                  textTransform: 'uppercase'
                }}>
                  Descolagem
                </div>
              )}
              <div className="laudo-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div className={`laudo-status-icon status--${l.status_geral.toLowerCase().replace(/\s+/g, '-')}`} style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background:
                      l.status_geral === 'Aprovado' ? 'rgba(34, 197, 94, 0.1)' :
                        l.status_geral === 'Pendente' ? 'rgba(234, 179, 8, 0.1)' :
                          l.status_geral === 'Em Andamento' ? 'rgba(59, 130, 246, 0.1)' :
                            'rgba(239, 68, 68, 0.1)',
                    color:
                      l.status_geral === 'Aprovado' ? 'var(--accent-success)' :
                        l.status_geral === 'Pendente' ? '#eab308' :
                          l.status_geral === 'Em Andamento' ? 'var(--accent-primary)' :
                            'var(--accent-danger)'
                  }}>
                    <span className="material-symbols-outlined">
                      {isLocked ? 'lock' : (
                        l.status_geral === 'Aprovado' ? 'check_circle' :
                          l.status_geral === 'Recebido' ? 'assignment_turned_in' :
                            l.status_geral === 'Pendente' ? 'schedule' :
                              l.status_geral === 'Em Andamento' ? 'sync' :
                                'cancel'
                      )}
                    </span>
                  </div>
                  {l.status_geral === 'Pendente' && sectorPerms.canEditTestResults && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReceiveLaudo(l.id);
                      }}
                      style={{ height: '32px', padding: '0 12px', fontSize: '0.7rem', background: 'var(--accent-success)', borderRadius: '8px' }}
                    >
                      RECEBER
                    </button>
                  )}
                  {l.peeling_priority && (
                    <span className="tag tag--danger" style={{ animation: 'pulse 2s infinite', fontSize: '0.65rem', border: 'none', color: 'white' }}>
                      PRIORIDADE
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{l.codigo_laudo || `#${l.id}`}</span>
                  {sectorPerms.canEditTestResults && (
                    <button
                      className="icon-btn icon-btn--danger"
                      style={{ padding: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Tem certeza que deseja excluir este laudo e todos os seus testes?")) {
                          testApi.removeLaudo(l.id).then(() => fetchLaudos());
                        }
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="laudo-card-body">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{l.modelo_nome}</h3>
                {l.numero_pedido && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '4px' }}>
                    Pedido: {l.numero_pedido}
                  </div>
                )}
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{l.fk_material} • {l.setor_nome}</p>
              </div>

              <div className="laudo-card-footer" style={{
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '15px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div className="laudo-tags" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`tag tag--${l.status_geral === 'Aprovado' ? 'success' :
                    l.status_geral === 'Recebido' ? 'info' :
                      l.status_geral === 'Pendente' ? 'warning' :
                        l.status_geral === 'Em Andamento' ? 'info' : 'danger'
                    }`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                    {l.status_geral}
                  </span>
                  <span className="tag tag--muted" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>{l.total_testes} T</span>
                  {l.data_prazo ? (
                    <span className={`tag ${new Date(l.data_prazo) < new Date() && !['Aprovado', 'Reprovado', 'Concluído'].includes(l.status_geral) ? 'tag--danger' : 'tag--muted'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      Prazo: {new Date(l.data_prazo).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="tag tag--muted" style={{ padding: '2px 8px', fontSize: '0.7rem', fontStyle: 'italic' }}>Aguardando Receb.</span>
                  )}
                </div>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{new Date(l.data_criacao).toLocaleDateString()}</span>
              </div>

              <div className="laudo-card-hover-icon" style={{ position: 'absolute', top: '15px', right: '15px', opacity: 0.3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
              </div>
            </div>
          );
        })}
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
