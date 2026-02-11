import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { mscApi, enumApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function MSCRegister() {
  const { id } = useParams();
  const isEditing = !!id;

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("DN");
  const [descricao, setDescricao] = useState("");
  const [especificacoes, setEspecificacoes] = useState([]);
  const [typeTestList, setTypeTestList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  useEffect(() => {
    enumApi.typesTest().then(res => setTypeTestList(res.data || [])).catch(console.error);

    if (isEditing) {
      setLoading(true);
      mscApi.getOne(id).then(res => {
        const data = res.data;
        if (data) {
          setNome(data.nome);
          setTipo(data.tipo || "DN");
          setDescricao(data.descricao || "");
          setEspecificacoes(data.especificacoes || []);
        }
      }).catch(err => {
        console.error(err);
        setPopup({ show: true, msg: "Erro ao carregar dados da MSC." });
      }).finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const addEspec = () => {
    setEspecificacoes([...especificacoes, {
      tipo_teste: "",
      regra_tipo: "fixed",
      v_alvo: "",
      v_variacao: "",
      v_min: "",
      v_max: ""
    }]);
  };

  const updateEspec = (index, field, value) => {
    const newSpecs = [...especificacoes];
    newSpecs[index][field] = value;
    setEspecificacoes(newSpecs);
  };

  const removeEspec = (index) => {
    setEspecificacoes(especificacoes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (especificacoes.length === 0) {
      setPopup({ show: true, msg: "Adicione pelo menos uma especificação." });
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await mscApi.update({ id, nome, tipo, descricao, especificacoes });
        setPopup({ show: true, msg: "MSC atualizada com sucesso!" });
      } else {
        await mscApi.register({ nome, tipo, descricao, especificacoes });
        setPopup({ show: true, msg: "MSC cadastrada com sucesso!" });
      }
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
        if (popup.msg.includes("sucesso")) navigate("/msc");
      }} />}

      <main className="form-page" style={{ maxWidth: 800 }}>
        <header className="page-header">
          <h1 className="page-title">{isEditing ? "Editar Ficha Técnica" : "Nova Ficha Técnica (MSC)"}</h1>
          <p className="text-secondary">Defina as regras de aprovação para um grupo de materiais</p>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Nome da MSC (Identificador) *</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
                  placeholder="Ex: Borracha Nike - Padrão 45" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tipo de Material *</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                  <option value="DN">DN</option>
                  <option value="BN">BN</option>
                  <option value="Base">Base</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descrição Opcional</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes sobre a aplicação desta ficha..." rows="2" />
            </div>

            <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Especificações dos Testes</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={addEspec}>+ Adicionar Regra</button>
            </div>

            <div className="msc-specs-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {especificacoes.map((esp, index) => (
                <div key={index} className="data-card" style={{ display: 'block' }}>
                  <div className="form-row" style={{ alignItems: 'flex-start' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Ensaio *</label>
                      <select value={esp.tipo_teste} onChange={(e) => updateEspec(index, 'tipo_teste', e.target.value)} required>
                        <option value="">Selecione o Teste</option>
                        {typeTestList.map(t => <option key={t.cod_tipo} value={t.nome}>{t.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Tipo de Regra</label>
                      <select value={esp.regra_tipo} onChange={(e) => updateEspec(index, 'regra_tipo', e.target.value)}>
                        <option value="fixed">Fixo (+/-)</option>
                        <option value="range">Intervalo (A a B)</option>
                        <option value="max">Máximo (Abaixo de)</option>
                        <option value="min">Mínimo (Acima de)</option>
                      </select>
                    </div>
                    <div style={{ marginTop: '28px' }}>
                      <button type="button" className="icon-btn icon-btn--danger" title="Remover regra" onClick={() => removeEspec(index)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: '10px' }}>
                    {esp.regra_tipo === 'fixed' && (
                      <>
                        <div className="form-group">
                          <label>Valor Alvo</label>
                          <input type="number" step="any" placeholder="Ex: 45" value={esp.v_alvo} onChange={(e) => updateEspec(index, 'v_alvo', e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Variação (+/-)</label>
                          <input type="number" step="any" placeholder="Ex: 3" value={esp.v_variacao} onChange={(e) => updateEspec(index, 'v_variacao', e.target.value)} required />
                        </div>
                      </>
                    )}
                    {esp.regra_tipo === 'range' && (
                      <>
                        <div className="form-group">
                          <label>Mínimo</label>
                          <input type="number" step="any" placeholder="Ex: 45" value={esp.v_min} onChange={(e) => updateEspec(index, 'v_min', e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Máximo</label>
                          <input type="number" step="any" placeholder="Ex: 50" value={esp.v_max} onChange={(e) => updateEspec(index, 'v_max', e.target.value)} required />
                        </div>
                      </>
                    )}
                    {esp.regra_tipo === 'max' && (
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Valor Máximo Permitido</label>
                        <input type="number" step="any" placeholder="Ex: 150" value={esp.v_max} onChange={(e) => updateEspec(index, 'v_max', e.target.value)} required />
                      </div>
                    )}
                    {esp.regra_tipo === 'min' && (
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Valor Mínimo Permitido</label>
                        <input type="number" step="any" placeholder="Ex: 2.5" value={esp.v_min} onChange={(e) => updateEspec(index, 'v_min', e.target.value)} required />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions" style={{ marginTop: 30 }}>
              <Link to="/msc" className="btn btn-secondary">Cancelar</Link>
              <button type="submit" className="btn btn-primary">Salvar Ficha Técnica</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
