import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { testApi, enumApi, employeeApi, modelApi, sectorApi, productApi, mscApi, productionApi, maquinaApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";
import { useAuth } from "../../contexts/AuthContext";
import { getSectorPermissions, filterTestTypes, filterMaterials } from "../../config/permissions";

const emptyTest = () => ({ fk_tipo_cod_tipo: "", resultado: "", fk_local_cod_local: "", data_fim: "", valores: [], fk_maquina_id: "" });

export default function TestRegister() {
  const { user } = useAuth();
  const sectorPerms = useMemo(
    () => getSectorPermissions(user?.setor_nome, user?.role),
    [user?.setor_nome, user?.role]
  );

  const MULTI_VALUE_TESTS = {
    'ALONGAMENTO': 3,
    'TRACAO': 3,
    'RASGAMENTO': 3,
    'DENSIDADE': 3,
    'MODULO 300%': 3,
    'ABRASAO DIN': 3,
    'ABRASAO AKRON': 3,
    'DUREZA': 5,
    'COMPRESSION SET': 5,
    'ENCOLHIMENTO': 6
  };

  const PERCENT_TESTS = ['ALONGAMENTO', 'COMPRESSION SET'];

  // Listas do Banco
  const [typeTestList, setTypeTestList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [modelList, setModelList] = useState([]);
  const [sectorList, setSectorList] = useState([]);
  const [materialList, setMaterialList] = useState([]);
  const [mscList, setMscList] = useState([]);
  const [maquinaList, setMaquinaList] = useState([]);
  const [prodOptions, setProdOptions] = useState({ requisitante: [], lider: [], coordenador: [], gerente: [], esteira: [] });
  const [isDescolagem, setIsDescolagem] = useState(false);

  // Filtros dinâmicos
  const [filteredMaterials, setFilteredMaterials] = useState([]);

  // Dados compartilhados (Shared)
  const [fkFuncionario, setFkFuncionario] = useState(user?.fk_funcionario_matricula || "");
  const [fkModelo, setFkModelo] = useState("");
  const [fkMaterial, setFkMaterial] = useState("");
  const [productType, setProductType] = useState(""); // BN/DN/Base
  const [productSetor, setProductSetor] = useState(
    (user?.role === 'admin' || user?.setor_nome?.toLowerCase() === 'laboratório') ? "" : (user?.fk_cod_setor || "")
  );
  const [observacoes, setObservacoes] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");

  // Atualiza os campos automáticos quando o usuário carregar
  useEffect(() => {
    if (user) {
      setFkFuncionario(user.fk_funcionario_matricula || "");
      const isLabOrAdmin = user?.role === 'admin' || user?.setor_nome?.toLowerCase() === 'laboratório';
      setProductSetor(isLabOrAdmin ? "" : (user.fk_cod_setor || ""));
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
    data_colagem: "",
    prioridade: false
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
  const location = useLocation();

  // Tratamento de Deep Link (ex: vindo da aba Descolagem)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("type") === "peeling") {
      setIsDescolagem(true);
      // Busca o ID do setor Pré-Fabricado se disponível
      if (sectorList.length > 0) {
        const pSetor = sectorList.find(s => s.nome?.toLowerCase().includes("pré-fabricado"));
        if (pSetor) setProductSetor(String(pSetor.id));
      }
    }
  }, [location.search, sectorList]);

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
        const [typeRes, empRes, modelRes, sectorRes, matRes, mscRes, prodRes, maquinaRes] = await Promise.all([
          enumApi.typesTest(),
          employeeApi.list(),
          modelApi.list(),
          sectorApi.list(),
          productApi.list(),
          mscApi.list(),
          productionApi.listOptions(),
          maquinaApi.list()
        ]);
        setTypeTestList(typeRes.data || []);
        setEmployeeList(empRes.data || []);
        setModelList(modelRes.data || []);
        setSectorList(sectorRes.data || []);
        setMaterialList(matRes.data || []);
        setMscList(mscRes.data || []);
        setMaquinaList(maquinaRes.data || []);

        const opts = prodRes.data || [];
        const grouped = { requisitante: [], lider: [], coordenador: [], gerente: [], esteira: [] };
        opts.forEach(o => {
          if (grouped[o.categoria]) grouped[o.categoria].push(o.valor);
        });
        setProdOptions(grouped);
      } catch (err) {
        setPopup({ show: true, msg: "Erro ao carregar dados do banco." });
      }
    };
    loadData();
  }, []);

  // Lógica para bloquear testes quando for Descolagem
  useEffect(() => {
    if (isDescolagem) {
      const type = typeTestList.find(t => t.nome?.toUpperCase() === 'DESCOLAGEM');
      if (type) {
        setTestes([{
          fk_tipo_cod_tipo: type.cod_tipo,
          resultado: "",
          fk_local_cod_local: "",
          data_fim: "",
          valores: []
        }]);
      }
    }
  }, [isDescolagem, typeTestList]);

  // Filtrar materiais por setor selecionado + permissão de tipo
  useEffect(() => {
    let filtered = materialList;

    // Filtro pelo setor selecionado no formulário
    // Se for Lab/Admin, não restringe a lista de materiais pelo setor (vê todos conforme regra de tipo BN/DN)
    const isLabOrAdmin = user?.role === 'admin' || user?.setor_nome?.toLowerCase() === 'laboratório';
    if (productSetor && !isLabOrAdmin) {
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
    if (mat) {
      if (mat.tipo) setProductType(mat.tipo);

      // Se for Lab/Admin e não tiver setor selecionado, assume o do material para consistência
      const isLabOrAdmin = user?.role === 'admin' || user?.setor_nome?.toLowerCase() === 'laboratório';
      if (isLabOrAdmin && !productSetor && mat.cod_setor) {
        setProductSetor(String(mat.cod_setor));
      }
    }
  }, [fkMaterial, materialList, user?.role, user?.setor_nome, productSetor]);

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

    // Se mudou o tipo, limpa os valores
    if (field === 'fk_tipo_cod_tipo') {
      clone[i].valores = [];
      clone[i].resultado = "";
    }

    // Se mudou o resultado ou os valores individuais, recalcula a média se necessário
    if (field === 'valores') {
      const values = value.map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (values.length > 0) {
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
        clone[i].resultado = avg;
      }
    }

    setTestes(clone);
  };

  const handleBateriaCompleta = () => {
    if (!productType) {
      setPopup({ show: true, msg: "Selecione um material/modelo para detectar o tipo (BN/DN)." });
      return;
    }

    const selectedModel = modelList.find(m => String(m.cod_modelo) === String(fkModelo));
    const brand = selectedModel?.marca?.toUpperCase() || "";
    const isNike = brand.includes("NIKE");
    const isIU007 = currentMscName && currentMscName.includes("IU-007");

    let testsToSelect = [];
    if (productType === 'BN') {
      testsToSelect = ['DUREZA', 'DENSIDADE', 'ALONGAMENTO', 'TRACAO', 'RASGAMENTO', 'MODULO 300%'];
      if (isNike) testsToSelect.push('ABRASAO AKRON');
      else testsToSelect.push('ABRASAO DIN');
    } else if (productType === 'DN') {
      testsToSelect = ['DUREZA', 'DENSIDADE', 'RESILIENCIA', 'COMPRESSION SET', 'DELAMINAÇÃO', 'ALONGAMENTO', 'TRACAO', 'RASGAMENTO', 'ENCOLHIMENTO'];
      if (isIU007) testsToSelect.push('ABRASAO AKRON');
    }

    const standardTests = testsToSelect.map(name => {
      const type = typeTestList.find(t =>
        t.nome?.toUpperCase() === name ||
        t.nome?.toUpperCase().replace(/\s+/g, '_') === name.replace(/\s+/g, '_')
      );
      return type ? { fk_tipo_cod_tipo: type.cod_tipo, resultado: "", fk_local_cod_local: "", data_fim: "", valores: [] } : null;
    }).filter(Boolean);

    if (standardTests.length === 0) {
      setPopup({ show: true, msg: "Nenhum teste padrão encontrado para este material." });
      return;
    }

    setTestes(prev => {
      if (prev.length === 1 && !prev[0].fk_tipo_cod_tipo) return standardTests;
      return [...prev, ...standardTests];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        shared: {
          fk_funcionario_matricula: fkFuncionario,
          fk_modelo_cod_modelo: fkModelo ? parseInt(fkModelo) : null,
          fk_material: fkMaterial || (isDescolagem ? (numeroPedido || "DESCOLAGEM_" + Date.now()) : "AVULSO"),
          fk_cod_setor: productSetor ? parseInt(productSetor) : null,
          tipo: productType || "Base",
          status: "Pendente",
          observacoes: observacoes,
          numero_pedido: numeroPedido || null,
          ...(isPreFabricado ? {
            metadata: {
              ...metadata,
              requisitante: metadata.requisitante || user?.setor_nome
            }
          } : {})
        },
        testes: testes.map((t) => ({
          fk_tipo_cod_tipo: t.fk_tipo_cod_tipo,
          resultado: (t.resultado && !isNaN(parseFloat(t.resultado))) ? parseFloat(t.resultado) : null,
          fk_local_cod_local: t.fk_local_cod_local || null,
          data_fim: t.data_fim || null,
          fk_maquina_id: t.fk_maquina_id || null
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
        // Se já temos resultados (sucesso), não navegamos para deixar o usuário ver o card
        if (results) return;
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => setResults(null)}>Novo Cadastro</button>
              <button className="btn btn-secondary" onClick={() => navigate("/test")}>Área de Testes</button>
            </div>
          </div>
        ) : (
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-section-title" style={{ marginTop: 0, display: isDescolagem ? 'none' : 'block' }}>
                <h3>Informações do Laudo</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Setor Logado: <strong>{user?.setor_nome || 'N/A'}</strong> | Responsável: <strong>{user?.nome}</strong>
                </p>
              </div>

              <div className="form-row">
                {(user?.role === 'admin' || user?.setor_nome?.toLowerCase() === 'laboratório') && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Setor do Produto *</label>
                    <select
                      value={productSetor}
                      onChange={(e) => setProductSetor(e.target.value)}
                      required
                    >
                      <option value="">Selecione o Setor</option>
                      {sectorList.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                {isPreFabricado && (
                  <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '25px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                      <input
                        type="checkbox"
                        checked={isDescolagem}
                        onChange={(e) => setIsDescolagem(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      REGISTRAR DESCOLAGEM / LOTE
                    </label>
                  </div>
                )}
              </div>

              {!isDescolagem && (
                <>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Material (Referência) *</label>
                      <select value={fkMaterial} onChange={(e) => setFkMaterial(e.target.value)} required={!isDescolagem}>
                        <option value="">Selecione a Referência</option>
                        {filteredMaterials.map((m) => (
                          <option key={m.referencia} value={m.referencia}>{m.referencia} ({m.tipo})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Modelo *</label>
                      <select value={fkModelo} onChange={(e) => setFkModelo(e.target.value)} required={!isDescolagem}>
                        <option value="">Selecione o Modelo</option>
                        {modelList.map((m) => <option key={m.cod_modelo} value={m.cod_modelo}>{m.nome} ({m.marca})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Tipo (Detectado)</label>
                      <input type="text" value={productType} readOnly placeholder="BN / DN / Base"
                        style={{ background: "rgba(255,255,255,0.05)", fontWeight: "bold", color: "var(--accent-primary)" }} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Nº do Pedido</label>
                      <input type="text" value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} placeholder="Opcional" />
                    </div>
                  </div>
                </>
              )}

              {!isDescolagem && fkModelo && (
                <div style={{ fontSize: '0.85rem', marginBottom: '20px', padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
                </div>
              )}

              {isPreFabricado && isDescolagem && (
                <div className="metadata-section" style={{
                  marginTop: '24px',
                  padding: '24px',
                  background: 'rgba(var(--accent-primary-rgb), 0.03)',
                  border: isDescolagem ? '2px solid var(--accent-primary)' : '1.5px dashed var(--accent-primary)',
                  borderRadius: '16px',
                  marginBottom: '24px',
                  transition: 'all 0.3s ease'
                }}>
                  <div className="form-section-title" style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
                      <span className="material-symbols-outlined">{isDescolagem ? 'manufacturing' : 'analytics'}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {isDescolagem ? 'DADOS DE PRODUÇÃO - DESCOLAGEM' : 'Dados de Produção'}
                      </span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', cursor: 'pointer', color: 'var(--accent-danger)' }}>
                      <input
                        type="checkbox"
                        checked={metadata.prioridade}
                        onChange={(e) => setMetadata({ ...metadata, prioridade: e.target.checked })}
                        style={{ width: '18px', height: '18px' }}
                      />
                      PRIORIDADE
                    </label>
                  </div>

                  {isDescolagem && (
                    <div className="form-row" style={{ marginBottom: '25px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Modelo *</label>
                        <select value={fkModelo} onChange={(e) => setFkModelo(e.target.value)} required={isDescolagem}>
                          <option value="">Selecione o Modelo</option>
                          {modelList.map((m) => <option key={m.cod_modelo} value={m.cod_modelo}>{m.nome} ({m.marca})</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Nº do Pedido</label>
                        <input type="text" value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} placeholder="Opcional" />
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Requisitante *</label>
                      <select value={metadata.requisitante} onChange={(e) => setMetadata({ ...metadata, requisitante: e.target.value })} required={isPreFabricado}>
                        <option value="">Selecione...</option>
                        {prodOptions.requisitante.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Esteira / Linha *</label>
                      <select value={metadata.esteira} onChange={(e) => setMetadata({ ...metadata, esteira: e.target.value })} required={isPreFabricado}>
                        <option value="">Selecione...</option>
                        {prodOptions.esteira.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Líder *</label>
                      <select value={metadata.lider} onChange={(e) => setMetadata({ ...metadata, lider: e.target.value })} required={isPreFabricado}>
                        <option value="">Selecione...</option>
                        {prodOptions.lider.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Coordenador</label>
                      <select value={metadata.coordenador} onChange={(e) => setMetadata({ ...metadata, coordenador: e.target.value })}>
                        <option value="">Selecione...</option>
                        {prodOptions.coordenador.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
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
                      <label>Gerente</label>
                      <select value={metadata.gerente} onChange={(e) => setMetadata({ ...metadata, gerente: e.target.value })}>
                        <option value="">Selecione...</option>
                        {prodOptions.gerente.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Data Colagem</label>
                      <input type="date" value={metadata.data_colagem} onChange={(e) => setMetadata({ ...metadata, data_colagem: e.target.value })} />
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

              <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Testes a Realizar</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!isDescolagem && (fkModelo || fkMaterial) && (
                    <button type="button" className="btn btn-sm" onClick={handleBateriaCompleta}
                      style={{
                        background: 'rgba(22, 163, 74, 0.1)',
                        color: 'var(--accent-primary)',
                        border: '1px solid var(--accent-primary)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>playlist_add_check</span>
                      Bateria Completa ({productType || '?'})
                    </button>
                  )}
                  {!isDescolagem && (
                    <button type="button" className="btn btn-sm btn-primary" onClick={addTest}
                      style={{
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontWeight: '600',
                        boxShadow: '0 4px 10px rgba(22, 163, 74, 0.2)'
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '4px', verticalAlign: 'middle' }}>add</span>
                      Adicionar Teste
                    </button>
                  )}
                </div>
              </div>

              {testes.map((teste, index) => (
                <div key={index} className="test-row-card" style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  marginBottom: '20px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div className="test-row-header" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="test-row-number" style={{ background: 'var(--accent-primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Teste #{index + 1}</span>
                    {!isDescolagem && (
                      <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeTest(index)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      </button>
                    )}
                  </div>
                  <div className="test-row-fields" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
                    <div className="form-group" style={{ flex: '1', minWidth: '220px' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de Teste *</label>
                      <select
                        value={teste.fk_tipo_cod_tipo}
                        onChange={(e) => updateTest(index, "fk_tipo_cod_tipo", e.target.value)}
                        required
                        disabled={isDescolagem}
                      >
                        <option value="">Selecione o Teste</option>
                        {allowedTestTypes.map((t) => <option key={t.cod_tipo} value={t.cod_tipo}>{t.nome}</option>)}
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: '1', minWidth: '220px' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Máquina / Equipamento</label>
                      <select
                        value={teste.fk_maquina_id}
                        onChange={(e) => updateTest(index, "fk_maquina_id", e.target.value)}
                        className="filter-input"
                      >
                        <option value="">Nenhuma / Manual</option>
                        {maquinaList.map((m) => <option key={m.id} value={m.id}>{m.nome} ({m.setor_nome || 'Laboratório'})</option>)}
                      </select>
                    </div>

                    {sectorPerms.canEditTestResults && (
                      <div className="form-group" style={{
                        flex: MULTI_VALUE_TESTS[typeTestList.find(t => String(t.cod_tipo) === String(teste.fk_tipo_cod_tipo))?.nome?.toUpperCase()] ? '2' : '1',
                        minWidth: '250px'
                      }}>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {(() => {
                            const tn = typeTestList.find(t => String(t.cod_tipo) === String(teste.fk_tipo_cod_tipo))?.nome?.toUpperCase();
                            if (tn === 'DESCOLAGEM') return 'Resultado';
                            if (MULTI_VALUE_TESTS[tn]) return 'Resultado * (Média Automática)';
                            return 'Resultado *';
                          })()}
                        </label>

                        {(() => {
                          const typeName = typeTestList.find(t => String(t.cod_tipo) === String(teste.fk_tipo_cod_tipo))?.nome?.toUpperCase();
                          const numFields = MULTI_VALUE_TESTS[typeName];
                          const isPercent = PERCENT_TESTS.includes(typeName);
                          const isDescolagemTest = typeName === 'DESCOLAGEM';

                          // DESCOLAGEM não tem campo de resultado — é representado pelo PDF
                          if (isDescolagemTest) {
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', padding: '12px 0' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>picture_as_pdf</span>
                                Resultado via PDF (Laudo Técnico)
                              </div>
                            );
                          }

                          if (numFields) {
                            return (
                              <div className="test-inputs-container" style={{ marginTop: '10px' }}>
                                <div className="test-inputs-grid" style={{ gridTemplateColumns: `repeat(${numFields}, 68px)` }}>
                                  {[...Array(numFields)].map((_, valIdx) => (
                                    <input
                                      key={valIdx}
                                      type="number"
                                      step="any"
                                      className="filter-input"
                                      value={teste.valores?.[valIdx] || ""}
                                      placeholder={`V${valIdx + 1}`}
                                      style={{ textAlign: 'center', width: '100%', padding: '10px 4px' }}
                                      onChange={(e) => {
                                        const newVals = [...(teste.valores || [])];
                                        newVals[valIdx] = e.target.value;
                                        updateTest(index, "valores", newVals);
                                      }}
                                    />
                                  ))}
                                </div>
                                {isPercent && (
                                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1.2rem', padding: '0 4px' }}>%</span>
                                )}
                                <div className="result-badge-premium">
                                  {teste.resultado || "---"}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                step="any"
                                value={teste.resultado}
                                className="filter-input"
                                onChange={(e) => updateTest(index, "resultado", e.target.value)}
                                required={sectorPerms.canEditTestResults}
                                placeholder="Valor..."
                                style={{ width: '140px', fontWeight: '700', fontSize: '1.1rem' }}
                              />
                              {isPercent && (
                                <span style={{
                                  color: 'var(--accent-primary)',
                                  fontWeight: 'bold',
                                  fontSize: '1.1rem',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  padding: '12px 18px',
                                  borderRadius: '12px',
                                  border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>%</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Fim (opcional)</label>
                      <input type="date" value={teste.data_fim} onChange={(e) => updateTest(index, "data_fim", e.target.value)}
                        style={{ padding: '12px', borderRadius: '10px' }}
                      />
                    </div>
                  </div>

                  {teste.fk_tipo_cod_tipo && (
                    <div className="test-spec-hint-clean">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
                      {(() => {
                        const typeName = typeTestList.find(t => String(t.cod_tipo) === String(teste.fk_tipo_cod_tipo))?.nome;
                        const spec = modelSpecs.find(s => s.tipo === typeName);
                        return spec ? (
                          <span>Norma esperada: <strong style={{ color: 'var(--text-primary)' }}>{spec.label}</strong></span>
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
