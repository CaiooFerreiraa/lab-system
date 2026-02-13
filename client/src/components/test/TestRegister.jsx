import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { testApi, enumApi, employeeApi, modelApi, sectorApi, productApi, mscApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";
import { useAuth } from "../../contexts/AuthContext";
import { getSectorPermissions, filterTestTypes, filterMaterials } from "../../config/permissions";

const emptyTest = () => ({ fk_tipo_cod_tipo: "", resultado: "", fk_local_cod_local: "", data_fim: "" });

export default function TestRegister() {
  const { user } = useAuth();
  const sectorPerms = useMemo(
    () => getSectorPermissions(user?.setor_nome, user?.role),
    [user?.setor_nome, user?.role]
  );

  // Listas do Banco
  const [typeTestList, setTypeTestList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [modelList, setModelList] = useState([]);
  const [sectorList, setSectorList] = useState([]);
  const [materialList, setMaterialList] = useState([]);
  const [mscList, setMscList] = useState([]);

  // Filtros dinâmicos
  const [filteredMaterials, setFilteredMaterials] = useState([]);

  // Dados compartilhados (Shared)
  const [fkFuncionario, setFkFuncionario] = useState(user?.fk_funcionario_matricula || "");
  const [fkModelo, setFkModelo] = useState("");
  const [fkMaterial, setFkMaterial] = useState("");
  const [productType, setProductType] = useState(""); // BN/DN/Base
  const [productSetor, setProductSetor] = useState(user?.fk_cod_setor || "");
  const [observacoes, setObservacoes] = useState("");

  // Atualiza os campos automáticos quando o usuário carregar
  useEffect(() => {
    if (user) {
      setFkFuncionario(user.fk_funcionario_matricula || "");
      setProductSetor(user.fk_cod_setor || "");
    }
  }, [user]);

  // Metadados de Produção (específicos para Pré-Fabricado / Descolagem)
  const [metadata, setMetadata] = useState({
    requisitante: "",
    lider: "",
    coordenador: "",
    gerente: "",
    esteira: "",
    adesivo: "",
    adesivo_fornecedor: "",
    lado: "Único",
    data_realizacao: "",
    data_colagem: ""
  });

  // Testes individuais
  const [testes, setTestes] = useState([emptyTest()]);

  // Especificações do modelo (para auto-avaliação no front)
  const [modelSpecs, setModelSpecs] = useState([]);
  const [currentMscName, setCurrentMscName] = useState("");
  const [currentMscId, setCurrentMscId] = useState("");
  const [selectedMscLink, setSelectedMscLink] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  // Tipos de teste filtrados pelas permissões do setor
  const allowedTestTypes = useMemo(
    () => filterTestTypes(typeTestList, sectorPerms.allowedTestTypes),
    [typeTestList, sectorPerms.allowedTestTypes]
  );

  const isPreFabricado = useMemo(() => {
    const selectedSectorName = sectorList.find(s => String(s.id) === String(productSetor))?.nome;
    return (selectedSectorName?.toLowerCase() === "pré-fabricado") || (user?.setor_nome?.toLowerCase() === "pré-fabricado");
  }, [productSetor, sectorList, user?.setor_nome]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [typeRes, empRes, modelRes, sectorRes, matRes, mscRes] = await Promise.all([
          enumApi.typesTest(),
          employeeApi.list(),
          modelApi.list(),
          sectorApi.list(),
          productApi.list(),
          mscApi.list()
        ]);
        setTypeTestList(typeRes.data || []);
        setEmployeeList(empRes.data || []);
        setModelList(modelRes.data || []);
        setSectorList(sectorRes.data || []);
        setMaterialList(matRes.data || []);
        setMscList(mscRes.data || []);
      } catch (err) {
        setPopup({ show: true, msg: "Erro ao carregar dados do banco." });
      }
    };
    loadData();
  }, []);

  // Filtrar materiais por setor selecionado + permissão de tipo
  useEffect(() => {
    let filtered = materialList;

    // Filtro pelo setor selecionado no formulário
    if (productSetor) {
      filtered = filtered.filter((m) => String(m.cod_setor) === String(productSetor) || m.setor === productSetor);
    }

    // Filtro pelo tipo permitido do setor do USUÁRIO (ex: Borracha = só BN)
    filtered = filterMaterials(filtered, sectorPerms.allowedMaterialTypes);

    setFilteredMaterials(filtered);
    setFkMaterial("");
    setProductType("");
  }, [productSetor, materialList, sectorPerms.allowedMaterialTypes]);

  // AUTO-DETECÇÃO DE BN/DN AO SELECIONAR MATERIAL
  useEffect(() => {
    if (!fkMaterial) {
      setProductType("");
      return;
    }
    const mat = materialList.find((m) => m.referencia === fkMaterial);
    if (mat && mat.tipo) {
      setProductType(mat.tipo);
    }
  }, [fkMaterial, materialList]);

  // Carregar especificações do modelo selecionado
  useEffect(() => {
    if (!fkModelo) {
      setModelSpecs([]);
      setCurrentMscName("");
      setCurrentMscId("");
      return;
    }
    fetchModelSpecs();
  }, [fkModelo]);

  const fetchModelSpecs = () => {
    modelApi.search(fkModelo).then((res) => {
      const data = res.data || res;
      setModelSpecs(data?.especificacoes || []);
      setCurrentMscName(data?.msc_nome || "Especificação Manual (Sem MSC)");
      setCurrentMscId(data?.fk_msc_id || "");
      if (data?.fk_msc_id) setSelectedMscLink(data.fk_msc_id);
    }).catch(() => {
      setModelSpecs([]);
      setCurrentMscName("");
    });
  };

  const handleLinkMsc = async () => {
    if (!selectedMscLink) return;
    setLoading(true);
    try {
      await modelApi.linkMSC({ cod_modelo: fkModelo, fk_msc_id: selectedMscLink });
      setPopup({ show: true, msg: "MSC vinculada ao modelo com sucesso!" });
      fetchModelSpecs();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao vincular MSC." });
    } finally {
      setLoading(false);
    }
  };

  const addTest = () => setTestes([...testes, emptyTest()]);
  const removeTest = (i) => testes.length > 1 && setTestes(testes.filter((_, idx) => idx !== i));
  const updateTest = (i, field, value) => {
    const clone = [...testes];
    clone[i] = { ...clone[i], [field]: value };
    setTestes(clone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        shared: {
          fk_funcionario_matricula: fkFuncionario,
          fk_modelo_cod_modelo: parseInt(fkModelo),
          fk_material: fkMaterial,
          fk_cod_setor: productSetor,
          tipo: productType,
          status: "Pendente",
          observacoes: observacoes,
          ...(isPreFabricado ? {
            metadata: {
              ...metadata,
              requisitante: metadata.requisitante || user?.setor_nome
            }
          } : {})
        },
        testes: testes.map((t) => ({
          fk_tipo_cod_tipo: t.fk_tipo_cod_tipo,
          resultado: t.resultado ? parseFloat(t.resultado) : null,
          fk_local_cod_local: t.fk_local_cod_local || null,
          data_fim: t.data_fim || null,
        })),
      };

      const response = await testApi.registerBatch(payload);
      setResults(response.data);
      setPopup({ show: true, msg: "Lote de testes cadastrado!" });
      setTestes([emptyTest()]);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => {
        setPopup({ show: false, msg: "" });
        if (!popup.msg.includes("vinculada")) navigate("/test");
      }} />}

      <main className="form-page" style={{ maxWidth: 900 }}>
        <header className="form-page-header">
          <h1>Emitir Laudo Técnico</h1>
          <p className="text-secondary">Combine múltiplos testes em um único laudo de material</p>
        </header>

        {results ? (
          <div className="batch-results">
            <div className="batch-results-header">
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--accent-success)" }}>check_circle</span>
              <h2>Cadastro Concluído</h2>
            </div>
            <div className="batch-results-summary">
              <div className="batch-stat batch-stat--total">
                <span className="batch-stat-number">{results.total}</span>
                <span className="batch-stat-label">Total</span>
              </div>
              <div className="batch-stat batch-stat--approved">
                <span className="batch-stat-number">{results.aprovados}</span>
                <span className="batch-stat-label">Aprovados</span>
              </div>
              <div className="batch-stat batch-stat--rejected">
                <span className="batch-stat-number">{results.reprovados}</span>
                <span className="batch-stat-label">Reprovados</span>
              </div>
            </div>
            <div className="batch-results-list" style={{ marginTop: 20 }}>
              {results.detalhes.map((r, i) => (
                <div key={i} className={`batch-result-item batch-result-item--${r.status === "Aprovado" ? "pass" : "fail"}`}>
                  <strong>{r.tipo}</strong>: {r.resultado} ({r.status})
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setResults(null)}>Novo Cadastro</button>
          </div>
        ) : (
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-section-title" style={{ marginTop: 0 }}>
                <h3>Informações do Laudo</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Setor: <strong>{user?.setor_nome || 'N/A'}</strong> | Responsável: <strong>{user?.nome}</strong>
                </p>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Material (Referência) *</label>
                  <select value={fkMaterial} onChange={(e) => setFkMaterial(e.target.value)} required>
                    <option value="">Selecione a Referência</option>
                    {filteredMaterials.map((m) => (
                      <option key={m.referencia} value={m.referencia}>{m.referencia} ({m.tipo})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tipo (Detectado)</label>
                  <input type="text" value={productType} readOnly placeholder="BN / DN / Base"
                    style={{ background: "rgba(255,255,255,0.05)", fontWeight: "bold", color: "var(--accent-primary)" }} />
                </div>
              </div>

              <div className="form-group">
                <label>Modelo *</label>
                <select value={fkModelo} onChange={(e) => setFkModelo(e.target.value)} required>
                  <option value="">Selecione o Modelo</option>
                  {modelList.map((m) => <option key={m.cod_modelo} value={m.cod_modelo}>{m.nome} ({m.marca})</option>)}
                </select>

                {fkModelo && (
                  <div style={{ fontSize: '0.85rem', marginTop: '8px', padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '6px', color: 'var(--accent-primary)' }}>assignment</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Ficha Técnica Atual:</strong> {currentMscName}
                    </div>

                    <div className="link-msc-control" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        value={selectedMscLink}
                        onChange={(e) => setSelectedMscLink(e.target.value)}
                        style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }}
                      >
                        <option value="">Selecione para Vincular/Alterar...</option>
                        {mscList.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.tipo})</option>)}
                      </select>
                      <button type="button" className="btn btn-sm btn-outline" onClick={handleLinkMsc} disabled={!selectedMscLink || selectedMscLink == currentMscId}>
                        Vincular
                      </button>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Ao vincular, este modelo passará a usar as regras da MSC selecionada para todos os testes.
                    </div>
                  </div>
                )}
              </div>

              {isPreFabricado && (
                <div className="metadata-section" style={{
                  marginTop: '24px',
                  padding: '20px',
                  background: 'rgba(var(--accent-primary-rgb), 0.03)',
                  border: '1.5px dashed var(--accent-primary)',
                  borderRadius: '12px'
                }}>
                  <div className="form-section-title" style={{ marginTop: 0, marginBottom: '16px' }}>
                    <h3 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
                      <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>analytics</span>
                      Informações de Produção (Descolagem)
                    </h3>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Requisitante *</label>
                      <input type="text" value={metadata.requisitante} onChange={(e) => setMetadata({ ...metadata, requisitante: e.target.value })} placeholder="Ex: Engenharia" required={isPreFabricado} />
                    </div>
                    <div className="form-group">
                      <label>Esteira / Linha *</label>
                      <input type="text" value={metadata.esteira} onChange={(e) => setMetadata({ ...metadata, esteira: e.target.value })} placeholder="Ex: Linha 04" required={isPreFabricado} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Líder *</label>
                      <input type="text" value={metadata.lider} onChange={(e) => setMetadata({ ...metadata, lider: e.target.value })} placeholder="Nome do Líder" required={isPreFabricado} />
                    </div>
                    <div className="form-group">
                      <label>Coordenador</label>
                      <input type="text" value={metadata.coordenador} onChange={(e) => setMetadata({ ...metadata, coordenador: e.target.value })} placeholder="Nome do Coordenador" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Adesivo *</label>
                      <input type="text" value={metadata.adesivo} onChange={(e) => setMetadata({ ...metadata, adesivo: e.target.value })} placeholder="Referência do Adesivo" required={isPreFabricado} />
                    </div>
                    <div className="form-group">
                      <label>Fornecedor Adesivo</label>
                      <input type="text" value={metadata.adesivo_fornecedor} onChange={(e) => setMetadata({ ...metadata, adesivo_fornecedor: e.target.value })} placeholder="Marca/Fornecedor" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Data Colagem</label>
                      <input type="date" value={metadata.data_colagem} onChange={(e) => setMetadata({ ...metadata, data_colagem: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Data Realização</label>
                      <input type="date" value={metadata.data_realizacao} onChange={(e) => setMetadata({ ...metadata, data_realizacao: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Lado</label>
                      <select value={metadata.lado} onChange={(e) => setMetadata({ ...metadata, lado: e.target.value })}>
                        <option value="Único">Único</option>
                        <option value="Esquerdo">Esquerdo</option>
                        <option value="Direito">Direito</option>
                        <option value="Par">Par</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Observações do Laudo (Opcional)</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Descreva detalhes ou anomalias observadas no lote..."
                  style={{ minHeight: '80px', background: 'var(--bg-input)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px' }}
                />
              </div>

              <div className="form-section-title">
                <h3>Testes Individuais</h3>
                <button type="button" className="btn btn-sm btn-outline" onClick={addTest}>+ Adicionar</button>
              </div>

              {testes.map((teste, index) => (
                <div key={index} className="test-row-card">
                  <div className="test-row-header">
                    <span className="test-row-number">Teste #{index + 1}</span>
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeTest(index)}>×</button>
                  </div>
                  <div className="test-row-fields">
                    <div className="form-group">
                      <label>Tipo de Teste *</label>
                      <select value={teste.fk_tipo_cod_tipo} onChange={(e) => updateTest(index, "fk_tipo_cod_tipo", e.target.value)} required>
                        <option value="">Selecione</option>
                        {allowedTestTypes.map((t) => <option key={t.cod_tipo} value={t.cod_tipo}>{t.nome}</option>)}
                      </select>
                    </div>

                    {sectorPerms.canEditTestResults && (
                      <div className="form-group">
                        <label>Resultado *</label>
                        <input
                          type="number"
                          step="any"
                          value={teste.resultado}
                          onChange={(e) => updateTest(index, "resultado", e.target.value)}
                          required={sectorPerms.canEditTestResults}
                          placeholder="Valor do ensaio"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label>Data Fim (opcional)</label>
                      <input type="date" value={teste.data_fim} onChange={(e) => updateTest(index, "data_fim", e.target.value)} />
                    </div>
                  </div>

                  {teste.fk_tipo_cod_tipo && (
                    <div className="test-row-spec-hint">
                      <span className="material-symbols-outlined">info</span>
                      {(() => {
                        const typeName = typeTestList.find(t => String(t.cod_tipo) === String(teste.fk_tipo_cod_tipo))?.nome;
                        const spec = modelSpecs.find(s => s.tipo === typeName);
                        return spec ? (
                          <span>Norma esperada: <strong>{spec.label}</strong></span>
                        ) : (
                          <span>Nenhuma norma específica cadastrada para este teste.</span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}

              <div className="form-actions" style={{ marginTop: 32 }}>
                <Link to="/test" className="btn btn-secondary">Cancelar</Link>
                <button type="submit" className="btn btn-primary">
                  {sectorPerms.canEditTestResults ? 'Gerar Laudo Técnico' : 'Solicitar Laudo / Testes'} ({testes.length})
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
