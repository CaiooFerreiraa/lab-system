import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { modelApi, markApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function ModelRegister() {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [especificacoes, setEspecificacoes] = useState([{ tipo: "", valor: "", variacao: "" }]);
  const [marks, setMarks] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [shoeTypes, setShoeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [marksRes, typesRes, shoeRes] = await Promise.all([
          markApi.list(),
          markApi.listTypes(),
          markApi.listTypeShoes(),
        ]);
        const marksData = marksRes.data || marksRes;
        if (Array.isArray(marksData)) setMarks(marksData.map((m) => m.marca));
        setTestTypes(typesRes.data || typesRes.types || []);
        setShoeTypes(shoeRes.data || shoeRes.types || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const addSpec = () => setEspecificacoes([...especificacoes, { tipo: "", valor: "", variacao: "" }]);
  const removeSpec = (i) => setEspecificacoes(especificacoes.filter((_, idx) => idx !== i));
  const updateSpec = (i, field, value) => {
    const clone = [...especificacoes];
    clone[i][field] = value;
    setEspecificacoes(clone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await modelApi.register({ nome, tipo, marca, especificacoes });
      setPopup({ show: true, msg: "Modelo cadastrado com sucesso!" });
      setNome(""); setTipo(""); setMarca("");
      setEspecificacoes([{ tipo: "", valor: "", variacao: "" }]);
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
        navigate("/model");
      }} />}

      <main className="form-page">
        <header className="form-page-header">
          <h1>Cadastrar Modelo</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nome">Nome do Modelo *</label>
              <input type="text" id="nome" value={nome} required
                onChange={(e) => setNome(e.target.value.replace(/\//g, ""))} />
            </div>

            <div className="form-group">
              <label htmlFor="tipo">Tipo *</label>
              <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                <option value="">Selecione o Tipo</option>
                {shoeTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="marca">Marca *</label>
              <select id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} required>
                <option value="">Selecione uma marca</option>
                {marks.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="form-section-title">
              <h3>Especificações</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={addSpec}>
                <span className="material-symbols-outlined">add</span>
                Adicionar
              </button>
            </div>

            {especificacoes.map((esp, index) => (
              <div key={index} className="dynamic-field-group dynamic-field-group--row">
                <select value={esp.tipo} onChange={(e) => updateSpec(index, "tipo", e.target.value)} required>
                  <option value="">Tipo de Teste</option>
                  {testTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
                <input type="number" placeholder="Valor" value={esp.valor}
                  onChange={(e) => updateSpec(index, "valor", e.target.value)} required />
                <input type="number" placeholder="Variação" value={esp.variacao}
                  onChange={(e) => updateSpec(index, "variacao", e.target.value)} required />
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeSpec(index)}>
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}

            <div className="form-actions">
              <Link to="/model" className="btn btn-secondary">
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
