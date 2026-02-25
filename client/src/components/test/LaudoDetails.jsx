import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { testApi, enumApi, sectorApi, descolagemApi } from "../../services/api";
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

  const perms = useMemo(() => getSectorPermissions(user?.setor_nome, user?.role, user?.config_perfil), [user]);
  const canEditResults = perms.canEditTestResults;

  const MULTI_VALUE_TESTS = {
    'ALONG': 3,
    'ALONGAMENTO': 3,
    'TRACAO': 3,
    'RASGAMENTO': 3,
    'DENSIDADE': 3,
    'MODULO 300%': 3,
    'ABRASAO DIN': 3,
    'ABRASÃO DIN': 3,
    'ABRASAO AKRON': 3,
    'ABRASÃO AKRON': 3,
    'DUREZA': 5,
    'COMPRESSION SET': 5,
    'ENCOLHIMENTO': 6
  };

  const PERCENT_TESTS = ['ALONGAMENTO', 'COMPRESSION SET'];

  const [isEditingSector, setIsEditingSector] = useState(false);
  const [tempSector, setTempSector] = useState("");

  // Estado para novo teste
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTest, setNewTest] = useState({ fk_tipo_cod_tipo: "", resultado: "", data_fim: "", valores: [] });

  // Estado para valores temporários dos testes da tabela (para cálculo de média)
  const [rowValues, setRowValues] = useState({});
  const [changedResults, setChangedResults] = useState({}); // { [cod_teste]: { resultado, status? } }

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

  const handleUpdateStatus = async (newStatus) => {
    if (!canEditResults) return;

    // Se o status for 'Recebido' e o laudo ainda não tiver data de recebimento,
    // usamos a função específica de recebimento para calcular o prazo.
    if (newStatus === 'Recebido' && !laudo.data_recebimento) {
      await handleReceiveLaudo();
      return;
    }

    // Se houver alterações pendentes e estiver concluindo, salva antes
    if (newStatus === 'Concluído' && Object.keys(changedResults).length > 0) {
      const ok = confirm("Existem resultados de testes não salvos. Deseja aplicá-los agora ao concluir o laudo?");
      if (ok) {
        await handleSaveAllTests(false); // Salva mas não recarrega aqui, recarrega depois do status
      }
    }

    setLoading(true);
    try {
      await testApi.updateLaudo(id, { status_geral: newStatus });
      fetchData();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao atualizar status." });
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveLaudo = async () => {
    if (!canEditResults) return;
    setLoading(true);
    try {
      await testApi.receiveLaudo(id);
      fetchData();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao marcar como recebido: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!canEditResults) return;
    setLoading(true);
    try {
      const payload = {
        ...newTest,
        resultado: (newTest.resultado && !isNaN(parseFloat(newTest.resultado))) ? parseFloat(newTest.resultado) : null
      };
      await testApi.addTestToLaudo(id, payload);
      setPopup({ show: true, msg: "Teste adicionado ao laudo com sucesso!" });
      setShowAddForm(false);
      setNewTest({ fk_tipo_cod_tipo: "", resultado: "", data_fim: "", valores: [] });
      fetchData(); // Recarrega laudo
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao adicionar teste." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllTests = async (shouldFetch = true) => {
    if (!canEditResults) return;
    setLoading(true);
    try {
      const promises = Object.entries(changedResults).map(([cod_teste, data]) => {
        const numericVal = (data.resultado && !isNaN(parseFloat(data.resultado))) ? parseFloat(data.resultado) : null;
        return testApi.update({ cod_teste, resultado: numericVal });
      });
      await Promise.all(promises);
      setChangedResults({});
      if (shouldFetch) {
        setPopup({ show: true, msg: "Todos os resultados foram salvos e processados!" });
        fetchData();
      }
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao salvar um ou mais resultados." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTestStatus = (codTeste, resultado) => {
    setChangedResults(prev => ({
      ...prev,
      [codTeste]: { ...prev[codTeste], resultado }
    }));
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
              {canEditResults ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="status-selector-wrapper">
                    <select
                      value={laudo?.status_geral}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className={`filter-input status-select status-select--${laudo?.status_geral?.toLowerCase().replace(/\s+/g, '-')}`}
                      style={{ height: '42px', minWidth: '160px' }}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Recebido">Recebido</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Reprovado">Reprovado</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                </div>
              ) : (
                <span className={`tag ${laudo?.status_geral === 'Aprovado' ? 'tag--success' :
                  laudo?.status_geral === 'Recebido' ? 'tag--info' :
                    laudo?.status_geral === 'Pendente' ? 'tag--warning' :
                      laudo?.status_geral === 'Em Andamento' ? 'tag--info' : 'tag--danger'
                  }`} style={{ fontSize: '1rem' }}>
                  {laudo?.status_geral}
                </span>
              )}
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

            <div className="info-card" style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '12px',
              border: laudo?.data_prazo && new Date(laudo.data_prazo) < new Date() && !['Aprovado', 'Reprovado', 'Concluído'].includes(laudo.status_geral)
                ? '1px solid var(--accent-danger)'
                : '1px solid var(--border-color)',
              boxShadow: laudo?.data_prazo && new Date(laudo.data_prazo) < new Date() && !['Aprovado', 'Reprovado', 'Concluído'].includes(laudo.status_geral)
                ? '0 0 10px rgba(239, 68, 68, 0.2)'
                : 'none'
            }}>
              <span className="info-label" style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                PRAZO DE ENTREGA
                {laudo?.setor_sla_dias && <span style={{ fontSize: '0.65rem' }}>SLA: {laudo.setor_sla_dias} dias úteis</span>}
              </span>
              <div className="info-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {laudo?.data_prazo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {new Date(laudo.data_prazo).toLocaleDateString()}
                    {new Date(laudo.data_prazo) < new Date() && !['Aprovado', 'Reprovado', 'Concluído'].includes(laudo.status_geral) && (
                      <span className="tag tag--danger" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>ATRASADO</span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aguardando Recebimento</span>
                )}
              </div>
            </div>

            <div className="info-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span className="info-label" style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>Recebido em</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="info-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {laudo?.data_recebimento ? new Date(laudo.data_recebimento).toLocaleDateString() : '-'}
                </span>
                {canEditResults && !laudo?.data_recebimento && laudo?.status_geral === 'Pendente' && (
                  <button
                    onClick={handleReceiveLaudo}
                    className="btn btn-sm"
                    style={{
                      borderRadius: '8px',
                      padding: '8px 12px',
                      background: 'rgba(34,197,94,0.15)',
                      border: '1px solid var(--accent-success)',
                      color: 'var(--accent-success)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      letterSpacing: '0.5px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.25)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.15)'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                    Marcar Recebido
                  </button>
                )}
              </div>
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
                      boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)'
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

        {laudo?.setor_nome === 'Pré-Fabricado' && (
          <section className="descolagem-meta-section" style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--accent-primary)',
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(22, 163, 74, 0.1)'
          }}>
            <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)', marginBottom: '20px' }}>
              <span className="material-symbols-outlined">analytics</span>
              <h3 style={{ margin: 0 }}>Dados Técnicos de Descolagem (Peeling)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Painel de Metadados Herdados */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '15px' }}>Informações de Produção</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                  <div className="meta-item"><span>Requisitante:</span> <strong>{laudo.descolagem?.[0]?.requisitante || '-'}</strong></div>
                  <div className="meta-item"><span>Líder:</span> <strong>{laudo.descolagem?.[0]?.lider || '-'}</strong></div>
                  <div className="meta-item"><span>Coordenador:</span> <strong>{laudo.descolagem?.[0]?.coordenador || '-'}</strong></div>
                  <div className="meta-item"><span>Gerente:</span> <strong>{laudo.descolagem?.[0]?.gerente || '-'}</strong></div>
                  <div className="meta-item"><span>Esteira:</span> <strong>{laudo.descolagem?.[0]?.esteira || '-'}</strong></div>
                  <div className="meta-item"><span>Adesivo:</span> <strong>{laudo.descolagem?.[0]?.adesivo || '-'}</strong></div>
                  <div className="meta-item"><span>Fornecedor:</span> <strong>{laudo.descolagem?.[0]?.adesivo_fornecedor || '-'}</strong></div>
                  <div className="meta-item"><span>Data Colagem:</span> <strong>{laudo.descolagem?.[0]?.data_colagem ? new Date(laudo.descolagem[0].data_colagem).toLocaleDateString() : '-'}</strong></div>
                </div>
              </div>

              {/* Painel de Upload de PDFs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>Vincular Laudos Técnicos (PDF)</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FileUploadBox
                    label="PÉ ESQUERDO"
                    lado="Esquerdo"
                    laudoId={id}
                    current={laudo.descolagem?.find(d => d.lado === 'Esquerdo')}
                    onUploaded={fetchData}
                  />
                  <FileUploadBox
                    label="PÉ DIREITO"
                    lado="Direito"
                    laudoId={id}
                    current={laudo.descolagem?.find(d => d.lado === 'Direito')}
                    onUploaded={fetchData}
                  />
                </div>

                <div style={{ marginTop: '5px' }}>
                  <FileUploadBox
                    label="LAUDO ÚNICO / OUTROS"
                    lado="Único"
                    laudoId={id}
                    current={laudo.descolagem?.find(d => d.lado === 'Único')}
                    onUploaded={fetchData}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

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
            <div style={{ display: 'flex', gap: '12px' }}>
              {Object.keys(changedResults).length > 0 && (
                <button className="btn btn-sm btn-success" onClick={() => handleSaveAllTests()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-success)', color: '#fff' }}>
                  <span className="material-symbols-outlined">save</span>
                  Salvar Alterações ({Object.keys(changedResults).length})
                </button>
              )}
              {canEditResults && (
                <button className={`btn btn-sm ${showAddForm ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setShowAddForm(!showAddForm)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined">{showAddForm ? 'close' : 'add'}</span>
                  {showAddForm ? "Cancelar" : "Novo Teste"}
                </button>
              )}
            </div>
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
                    <select
                      value={newTest.fk_tipo_cod_tipo}
                      onChange={e => setNewTest({ ...newTest, fk_tipo_cod_tipo: e.target.value, valores: [], resultado: "" })}
                      required
                    >
                      <option value="">Selecione</option>
                      {testTypes.map(t => <option key={t.cod_tipo} value={t.cod_tipo}>{t.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{
                    flex: MULTI_VALUE_TESTS[testTypes.find(t => String(t.cod_tipo) === String(newTest.fk_tipo_cod_tipo))?.nome?.toUpperCase()] ? '2' : '1'
                  }}>
                    <label>
                      Resultado {testTypes.find(t => String(t.cod_tipo) === String(newTest.fk_tipo_cod_tipo))?.nome?.toUpperCase() === 'DESCOLAGEM' ? '' : '*'} {MULTI_VALUE_TESTS[testTypes.find(t => String(t.cod_tipo) === String(newTest.fk_tipo_cod_tipo))?.nome?.toUpperCase()] && "(Média Automática)"}
                    </label>

                    {(() => {
                      const typeName = testTypes.find(t => String(t.cod_tipo) === String(newTest.fk_tipo_cod_tipo))?.nome?.toUpperCase();
                      const numFields = MULTI_VALUE_TESTS[typeName];
                      const isPercent = PERCENT_TESTS.includes(typeName);

                      if (numFields) {
                        return (
                          <div className="test-inputs-container" style={{ marginTop: '10px' }}>
                            <div className="test-inputs-grid" style={{ gridTemplateColumns: `repeat(${numFields}, 68px)` }}>
                              {[...Array(numFields)].map((_, i) => (
                                <input
                                  key={i}
                                  type="number"
                                  step="any"
                                  className="filter-input"
                                  placeholder={`V${i + 1}`}
                                  style={{ textAlign: 'center', width: '100%', padding: '10px 4px' }}
                                  value={newTest.valores?.[i] || ""}
                                  onChange={(e) => {
                                    const newVals = [...(newTest.valores || [])];
                                    newVals[i] = e.target.value;
                                    const validVals = newVals.map(v => parseFloat(v)).filter(v => !isNaN(v));
                                    let avg = "";
                                    if (validVals.length > 0) {
                                      avg = (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(2);
                                    }
                                    setNewTest({ ...newTest, valores: newVals, resultado: avg });
                                  }}
                                />
                              ))}
                            </div>
                            {isPercent && (
                              <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1.2rem', padding: '0 4px' }}>%</span>
                            )}
                            <div className="result-badge-premium">
                              {newTest.resultado || "---"}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type={testTypes.find(t => String(t.cod_tipo) === String(newTest.fk_tipo_cod_tipo))?.nome?.toUpperCase() === 'DESCOLAGEM' ? "text" : "number"}
                            step="any"
                            value={newTest.resultado}
                            className="filter-input"
                            onChange={e => setNewTest({ ...newTest, resultado: e.target.value })}
                            required={testTypes.find(t => String(t.cod_tipo) === String(newTest.fk_tipo_cod_tipo))?.nome?.toUpperCase() !== 'DESCOLAGEM'}
                            placeholder={testTypes.find(t => String(t.cod_tipo) === String(newTest.fk_tipo_cod_tipo))?.nome?.toUpperCase() === 'DESCOLAGEM' ? "Opcional..." : "Valor..."}
                            style={{ width: '100px', fontWeight: '700', fontSize: '1rem' }}
                          />
                          {isPercent && (
                            <span style={{
                              color: 'var(--accent-primary)',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              background: 'rgba(60,120,255,0.1)',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(60,120,255,0.2)'
                            }}>%</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="form-group">
                    <label>Data Fim (opcional)</label>
                    <input type="date" value={newTest.data_fim} onChange={e => setNewTest({ ...newTest, data_fim: e.target.value })} />
                  </div>
                </div>

                {newTest.fk_tipo_cod_tipo && (
                  <div className="test-spec-hint-clean">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
                    {(() => {
                      const typeName = testTypes.find(t => String(t.cod_tipo) === String(newTest.fk_tipo_cod_tipo))?.nome;
                      const spec = modelSpecs.find(s => s.tipo === typeName);
                      return spec ? (
                        <span>Norma esperada: <strong style={{ color: 'var(--text-primary)' }}>{spec.label}</strong></span>
                      ) : (
                        <span>Nenhuma norma específica cadastrada para este teste.</span>
                      );
                    })()}
                  </div>
                )}
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
                    <td style={{ padding: '20px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', minWidth: '220px' }}>
                      <div className="test-type-label">{t.tipo_nome}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          const typeName = t.tipo_nome?.toUpperCase();
                          const numFields = MULTI_VALUE_TESTS[typeName];
                          const isPercent = PERCENT_TESTS.includes(typeName);
                          const isDescolagemTest = typeName === 'DESCOLAGEM';

                          // DESCOLAGEM: resultado é o PDF anexado na seção acima
                          if (isDescolagemTest) {
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--accent-primary)' }}>picture_as_pdf</span>
                                <span>Ver PDFs acima</span>
                              </div>
                            );
                          }

                          if (numFields) {
                            return (
                              <div className="test-inputs-container">
                                <div className="test-inputs-grid" style={{ gridTemplateColumns: `repeat(${numFields}, 68px)` }}>
                                  {[...Array(numFields)].map((_, i) => (
                                    <input
                                      key={i}
                                      type="number"
                                      step="any"
                                      className="filter-input"
                                      placeholder={`V${i + 1}`}
                                      disabled={!canEditResults}
                                      style={{ textAlign: 'center', width: '100%', padding: '10px 4px' }}
                                      onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                      value={rowValues[t.cod_teste]?.[i] ?? ""}
                                      onChange={(e) => {
                                        const newVals = [...(rowValues[t.cod_teste] || Array(numFields).fill(""))];
                                        newVals[i] = e.target.value;
                                        setRowValues({ ...rowValues, [t.cod_teste]: newVals });

                                        const validVals = newVals.map(v => parseFloat(v)).filter(v => !isNaN(v));
                                        if (validVals.length > 0) {
                                          const avg = (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(2);
                                          handleUpdateTestStatus(t.cod_teste, avg);
                                        }
                                      }}
                                    />
                                  ))}
                                </div>

                                {isPercent && (
                                  <span style={{
                                    color: 'var(--accent-primary)',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    padding: '0 4px'
                                  }}>%</span>
                                )}

                                <div className={`result-badge-premium ${changedResults[t.cod_teste] ? 'result-badge-changed' : ''}`}>
                                  {changedResults[t.cod_teste]?.resultado || t.resultado || "---"}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                disabled={!canEditResults}
                                className="filter-input"
                                value={changedResults[t.cod_teste]?.resultado ?? t.resultado}
                                onChange={(e) => handleUpdateTestStatus(t.cod_teste, e.target.value)}
                                style={{
                                  width: '100px',
                                  border: changedResults[t.cod_teste] ? '2px solid #fb923c' : '1px solid var(--border-color)',
                                  fontWeight: '700',
                                  fontSize: '1rem',
                                  boxShadow: changedResults[t.cod_teste] ? '0 0 10px rgba(251, 146, 60, 0.2)' : 'inset 0 1px 3px rgba(0,0,0,0.2)',
                                  opacity: canEditResults ? 1 : 0.7
                                }}
                              />
                              {isPercent && (
                                <span style={{
                                  color: 'var(--accent-primary)',
                                  fontWeight: 'bold',
                                  fontSize: '0.9rem',
                                  background: 'rgba(60,120,255,0.1)',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(60,120,255,0.2)'
                                }}>%</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={`tag ${t.status === 'Aprovado' ? 'tag--success' :
                        t.status === 'Reprovado' ? 'tag--danger' :
                          'tag--info'
                        }`}
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
                          {/* Link de edição removido a pedido do usuário */}
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

function FileUploadBox({ label, lado, laudoId, current, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "";
  const hasFile = current && current.arquivo_path;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", file);
      formData.append("fk_laudo_id", laudoId);
      formData.append("lado", lado);
      formData.append("titulo", `Laudo Técnico ${lado} - #${laudoId}`);

      await descolagemApi.upload(formData);
      onUploaded();
    } catch (err) {
      alert("Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      padding: '15px',
      borderRadius: '10px',
      border: hasFile ? '1px solid var(--accent-success)' : '1px dashed var(--border-color)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      <span style={{ fontSize: '0.7rem', fontWeight: '900', color: hasFile ? 'var(--accent-success)' : 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
        {label}
      </span>

      {uploading ? (
        <div className="spinner-small" style={{ margin: '10px auto' }}></div>
      ) : hasFile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-success)', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
            VINCULADO
          </div>
          {(current.valor_media != null || current.status_final) && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {current.valor_media != null && <>Média: <strong>{current.valor_media}</strong></>}
              {current.valor_media != null && current.status_final && <span> | </span>}
              {current.status_final && <span>{current.status_final}</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: '5px' }}>
            <a href={`${API_URL}${current.arquivo_path}`} target="_blank" rel="noreferrer" className="tag tag--info" style={{ textDecoration: 'none', cursor: 'pointer', padding: '2px 8px' }}>Ver PDF</a>
            <label style={{ cursor: 'pointer', padding: '2px 8px' }} className="tag tag--muted">
              Trocar
              <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
          </div>
        </div>
      ) : (
        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>upload_file</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Anexar PDF</span>
          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
        </label>
      )}

      <style>{`
        .meta-item { border-bottom: 1px solid rgba(255,255,255,0.05); padding: 4px 0; display: flex; justify-content: space-between; }
        .meta-item span { color: var(--text-muted); }
        .spinner-small { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .status-select {
          padding: 6px 30px 6px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          border: 1.5px solid currentColor;
          outline: none;
          transition: all 0.2s ease;
          background: transparent;
          width: auto;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 5 3 3 3-3'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
        .status-select:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .status-select option { background: #1a1d27; color: #f8fafc; padding: 12px; font-weight: 600; }
        .status-select--pendente { color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
        .status-select--recebido { color: #00bcd4; background: rgba(0, 188, 212, 0.1); }
        .status-select--em-andamento { color: var(--accent-primary); background: rgba(22, 163, 74, 0.1); }
        .status-select--aprovado { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
        .status-select--reprovado { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .status-select--concluido { color: #a78bfa; background: rgba(167, 139, 250, 0.1); }
      `}</style>
    </div>
  );
}
