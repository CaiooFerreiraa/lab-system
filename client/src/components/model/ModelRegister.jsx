import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { modelApi, markApi, mscApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function ModelRegister() {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [fkMscIdBn, setFkMscIdBn] = useState("");
  const [fkMscIdDn, setFkMscIdDn] = useState("");
  const [mscList, setMscList] = useState([]);
  const [marks, setMarks] = useState([]);
  const [shoeTypes, setShoeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [marksRes, shoeRes, mscRes] = await Promise.all([
          markApi.list(),
          markApi.listTypeShoes(),
          mscApi.list()
        ]);
        const marksData = marksRes.data || marksRes;
        if (Array.isArray(marksData)) setMarks(marksData.map((m) => m.marca));
        setShoeTypes(shoeRes.data || shoeRes.types || []);
        setMscList(mscRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await modelApi.register({
        nome,
        tipo,
        marca,
        fk_msc_id_bn: fkMscIdBn,
        fk_msc_id_dn: fkMscIdDn
      });
      setPopup({ show: true, msg: "Modelo cadastrado com sucesso!" });
      setNome(""); setTipo(""); setMarca(""); setFkMscIdBn(""); setFkMscIdDn("");
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
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nome">Nome do Modelo *</label>
                <input type="text" id="nome" value={nome} required
                  onChange={(e) => setNome(e.target.value.replace(/\//g, ""))} />
              </div>

              <div className="form-group">
                <label htmlFor="marca">Marca *</label>
                <select id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} required>
                  <option value="">Selecione uma marca</option>
                  {marks.map((m, i) => <option key={i} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tipo">Tipo de Calçado *</label>
                <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                  <option value="">Selecione o Tipo</option>
                  {shoeTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Ficha Técnica BN *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={fkMscIdBn} onChange={(e) => setFkMscIdBn(e.target.value)} required style={{ flex: 1 }}>
                    <option value="">Selecione a MSC BN</option>
                    {mscList.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.tipo})</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Ficha Técnica DN *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={fkMscIdDn} onChange={(e) => setFkMscIdDn(e.target.value)} required style={{ flex: 1 }}>
                    <option value="">Selecione a MSC DN</option>
                    {mscList.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.tipo})</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 32 }}>
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
