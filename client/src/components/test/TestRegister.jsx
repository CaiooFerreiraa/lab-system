import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { testApi, enumApi, employeeApi, modelApi, sectorApi, productApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

const emptyTest = () => ({ fk_tipo_cod_tipo: "", resultado: "", fk_local_cod_local: "", data_fim: "" });

export default function TestRegister() {
  // Listas do Banco
  const [typeTestList, setTypeTestList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [modelList, setModelList] = useState([]);
  const [sectorList, setSectorList] = useState([]);
  const [materialList, setMaterialList] = useState([]); // Referências do banco

  // Filtros dinâmicos
  const [filteredMaterials, setFilteredMaterials] = useState([]);

  // Dados compartilhados (Shared)
  const [fkFuncionario, setFkFuncionario] = useState("");
  const [fkModelo, setFkModelo] = useState("");
  const [fkMaterial, setFkMaterial] = useState("");
  const [productType, setProductType] = useState(""); // BN/DN/Base
  const [productSetor, setProductSetor] = useState("");

  // Testes individuais
  const [testes, setTestes] = useState([emptyTest()]);

  // Especificações do modelo (para auto-avaliação no front)
  const [modelSpecs, setModelSpecs] = useState([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [typeRes, empRes, modelRes, sectorRes, matRes] = await Promise.all([
          enumApi.typesTest(),
          employeeApi.list(),
          modelApi.list(),
          sectorApi.list(),
          productApi.list(),
        ]);
        setTypeTestList(typeRes.data || []);
        setEmployeeList(empRes.data || []);
        setModelList(modelRes.data || []);
        setSectorList(sectorRes.data || []);
        setMaterialList(matRes.data || []);
      } catch (err) {
        setPopup({ show: true, msg: "Erro ao carregar dados do banco." });
      }
    };
    loadData();
  }, []);

  // Filtrar materiais por setor e resetar seleção quando setor muda
  useEffect(() => {
    if (!productSetor) {
      setFilteredMaterials(materialList);
    } else {
      const filtered = materialList.filter((m) => String(m.cod_setor) === String(productSetor) || m.setor === productSetor);
      setFilteredMaterials(filtered);
    }
    setFkMaterial("");
    setProductType("");
  }, [productSetor, materialList]);

  // AUTO-DETECÇÃO DE BN/DN AO SELECIONAR MATERIAL
  useEffect(() => {
    if (!fkMaterial) {
      setProductType("");
      return;
    }
    const mat = materialList.find((m) => m.referencia === fkMaterial);
    if (mat && mat.tipo) {
      setProductType(mat.tipo); // Seta BN, DN ou Base automaticamente
    }
  }, [fkMaterial, materialList]);

  // Carregar especificações do modelo selecionado
  useEffect(() => {
    if (!fkModelo) {
      setModelSpecs([]);
      return;
    }
    modelApi.search(fkModelo).then((res) => {
      const data = res.data || res;
      setModelSpecs(data?.especificacoes || []);
    }).catch(() => setModelSpecs([]));
  }, [fkModelo]);

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
          fk_cod_setor: isNaN(productSetor) ? (sectorList.find(s => s.nome === productSetor)?.id) : parseInt(productSetor),
          tipo: productType,
          status: "Pendente",
        },
        testes: testes.map((t) => ({
          fk_tipo_cod_tipo: t.fk_tipo_cod_tipo,
          resultado: parseFloat(t.resultado),
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
        navigate("/test");
      }} />}

      <main className="form-page" style={{ maxWidth: 900 }}>
        <header className="form-page-header">
          <h1>Cadastrar Testes</h1>
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
                <h3>Informações do Material e Origem</h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Setor *</label>
                  <select value={productSetor} onChange={(e) => setProductSetor(e.target.value)} required>
                    <option value="">Selecione o Setor</option>
                    {sectorList.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Material (Referência) *</label>
                  <select value={fkMaterial} onChange={(e) => setFkMaterial(e.target.value)} required disabled={!productSetor}>
                    <option value="">{productSetor ? "Selecione a Referência" : "Selecione o Setor Primeiro"}</option>
                    {filteredMaterials.map((m) => (
                      <option key={m.referencia} value={m.referencia}>{m.referencia} ({m.tipo})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo (Detectado)</label>
                  <input type="text" value={productType} readOnly placeholder="BN / DN / Base"
                    style={{ background: "rgba(255,255,255,0.05)", fontWeight: "bold", color: "var(--accent-primary)" }} />
                </div>
                <div className="form-group">
                  <label>Responsável *</label>
                  <select value={fkFuncionario} onChange={(e) => setFkFuncionario(e.target.value)} required>
                    <option value="">Selecione o Funcionário</option>
                    {employeeList.map((f) => <option key={f.matricula} value={f.matricula}>{f.nome} {f.sobrenome}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Modelo *</label>
                <select value={fkModelo} onChange={(e) => setFkModelo(e.target.value)} required>
                  <option value="">Selecione o Modelo</option>
                  {modelList.map((m) => <option key={m.cod_modelo} value={m.cod_modelo}>{m.nome} ({m.marca})</option>)}
                </select>
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
                        {typeTestList.map((t) => <option key={t.cod_tipo} value={t.nome}>{t.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Resultado *</label>
                      <input type="number" step="any" value={teste.resultado} onChange={(e) => updateTest(index, "resultado", e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Data Fim (opcional)</label>
                      <input type="date" value={teste.data_fim} onChange={(e) => updateTest(index, "data_fim", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="form-actions" style={{ marginTop: 32 }}>
                <Link to="/test" className="btn btn-secondary">Cancelar</Link>
                <button type="submit" className="btn btn-primary">Cadastrar {testes.length} Testes</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
