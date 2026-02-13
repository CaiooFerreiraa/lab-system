import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { testApi, enumApi, sectorApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { getSectorPermissions } from "../../config/permissions";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function LaudoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [laudo, setLaudo] = useState(null);
  const [testTypes, setTestTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  const perms = useMemo(() => getSectorPermissions(user?.setor_nome, user?.role), [user]);
  const canEditResults = perms.canEditTestResults;

  const [isEditingSector, setIsEditingSector] = useState(false);
  const [tempSector, setTempSector] = useState("");

  // Estado para novo teste
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTest, setNewTest] = useState({ fk_tipo_cod_tipo: "", resultado: "", data_fim: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [laudoRes, typesRes, sectorsRes] = await Promise.all([
        testApi.getLaudo(id),
        enumApi.typesTest(),
        sectorApi.list()
      ]);
      setLaudo(laudoRes.data);
      setTestTypes(typesRes.data || []);
      setSectors(sectorsRes.data || []);
      if (laudoRes.data) setTempSector(laudoRes.data.fk_cod_setor);
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao carregar laudo." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdateSector = async () => {
    setLoading(true);
    try {
      await testApi.updateLaudo(id, { fk_cod_setor: tempSector });
      setIsEditingSector(false);
      fetchData();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao atualizar setor." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!canEditResults) return;
    setLoading(true);
    try {
      await testApi.addTestToLaudo(id, newTest);
      setPopup({ show: true, msg: "Teste adicionado ao laudo com sucesso!" });
      setShowAddForm(false);
      setNewTest({ fk_tipo_cod_tipo: "", resultado: "", data_fim: "" });
      fetchData(); // Recarrega laudo
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao adicionar teste." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTestStatus = async (codTeste, resultado) => {
    if (!canEditResults) return;
    setLoading(true);
    try {
      await testApi.update({ cod_teste: codTeste, resultado: parseFloat(resultado) });
      fetchData();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao atualizar teste." });
    } finally {
      setLoading(false);
    }
  };

  if (!laudo && !loading) return <div className="empty-state">Laudo não encontrado.</div>;

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <main className="detail-page" style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        <header className="page-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="page-title" style={{ margin: 0, fontSize: '2rem' }}>{laudo?.codigo_laudo || `Laudo #${id}`}</h1>
              <span className={`tag ${laudo?.status_geral === 'Aprovado' ? 'tag--success' : 'tag--danger'}`} style={{ fontSize: '1rem' }}>
                {laudo?.status_geral}
              </span>
            </div>
            <p className="text-secondary" style={{ marginTop: '8px', fontSize: '1.1rem' }}>
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', fontSize: '18px', marginRight: '4px' }}>inventory_2</span>
              {laudo?.modelo_nome} — <span style={{ color: 'var(--accent-primary)' }}>{laudo?.fk_material}</span>
            </p>
          </div>
          <Link to="/test" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">arrow_back</span> Voltar
          </Link>
        </header>

        <section className="form-container" style={{
          marginBottom: '32px',
          background: 'rgba(255,255,255,0.02)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div className="detail-info-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div className="info-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span className="info-label" style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>Responsável</span>
              <span className="info-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{laudo?.func_nome}</span>
            </div>

            <div className="info-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span className="info-label" style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>Data de Criação</span>
              <span className="info-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{new Date(laudo?.data_criacao).toLocaleDateString()}</span>
            </div>

            <div className="info-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
              <span className="info-label" style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Setor (Requisição)
                {!isEditingSector && (
                  <button className="icon-btn btn-sm" onClick={() => setIsEditingSector(true)} title="Editar Setor">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  </button>
                )}
              </span>

              {isEditingSector ? (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', animation: 'fadeIn 0.2s ease' }}>
                  <select
                    value={tempSector}
                    onChange={(e) => setTempSector(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      outline: 'none',
                      boxShadow: '0 0 0 2px rgba(60, 120, 255, 0.2)'
                    }}
                  >
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="icon-btn icon-btn--success" onClick={handleUpdateSector} style={{ background: 'rgba(34, 197, 94, 0.1)', borderRadius: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4ade80' }}>check</span>
                    </button>
                    <button className="icon-btn icon-btn--danger" onClick={() => { setIsEditingSector(false); setTempSector(laudo?.fk_cod_setor); }} style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#f87171' }}>close</span>
                    </button>
                  </div>
                </div>
              ) : (
                <span className="info-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{laudo?.setor_nome || "N/A"}</span>
              )}
            </div>
          </div>
        </section>

        <section className="test-section" style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div className="form-section-title" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: 0 }}>Testes Vinculados</h3>
            {canEditResults && (
              <button className={`btn btn-sm ${showAddForm ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setShowAddForm(!showAddForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined">{showAddForm ? 'close' : 'add'}</span>
                {showAddForm ? "Cancelar" : "Novo Teste"}
              </button>
            )}
          </div>

          {showAddForm && canEditResults && (
            <div style={{
              background: 'rgba(60,120,255,0.05)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px dashed var(--accent-primary)',
              marginBottom: '24px'
            }}>
              <form onSubmit={handleAddTest}>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label>Tipo de Teste *</label>
                    <select value={newTest.fk_tipo_cod_tipo} onChange={e => setNewTest({ ...newTest, fk_tipo_cod_tipo: e.target.value })} required>
                      <option value="">Selecione</option>
                      {testTypes.map(t => <option key={t.cod_tipo} value={t.cod_tipo}>{t.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Resultado *</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" step="any" value={newTest.resultado} onChange={e => setNewTest({ ...newTest, resultado: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Data Fim (opcional)</label>
                    <input type="date" value={newTest.data_fim} onChange={e => setNewTest({ ...newTest, data_fim: e.target.value })} />
                  </div>
                </div>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-primary">Gravar no Laudo</button>
                </div>
              </form>
            </div>
          )}

          <div className="report-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="report-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TIPO</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>RESULTADO</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>STATUS</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DATA</th>
                  {canEditResults && <th style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>AÇÕES</th>}
                </tr>
              </thead>
              <tbody>
                {laudo?.testes?.map(t => (
                  <tr key={t.cod_teste} className="test-row" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <td style={{ padding: '16px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                      <strong>{t.tipo_nome}</strong>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <input
                        type="number"
                        disabled={!canEditResults}
                        defaultValue={t.resultado}
                        onBlur={(e) => handleUpdateTestStatus(t.cod_teste, e.target.value)}
                        style={{
                          width: '90px',
                          padding: '6px 10px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontWeight: '500',
                          opacity: canEditResults ? 1 : 0.7
                        }}
                      />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={`tag ${t.status === 'Aprovado' ? 'tag--success' : 'tag--danger'}`}
                        style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {t.data_fim ? new Date(t.data_fim).toLocaleDateString() : "-"}
                    </td>
                    {canEditResults && (
                      <td style={{ padding: '16px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link to={`/test/edit/${t.cod_teste}`} className="icon-btn" title="Editar detalhes">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                          </Link>
                          <button
                            className="icon-btn icon-btn--danger"
                            onClick={async () => {
                              if (confirm("Deseja remover este teste do laudo?")) {
                                await testApi.remove(t.cod_teste);
                                fetchData();
                              }
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
