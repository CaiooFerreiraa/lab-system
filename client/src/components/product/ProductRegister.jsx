import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productApi, sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function ProductRegister() {
  const [product, setProduct] = useState("");
  const [sector, setSector] = useState("");
  const [type, setType] = useState("");
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const res = await sectorApi.list();
        setSectors(res.data || res.setores || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSectors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await productApi.register({ referencia: product, tipo: type, setor: sector });
      setPopup({ show: true, msg: "Produto cadastrado com sucesso!" });
      setProduct("");
      setSector("");
      setType("");
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <main className="form-page">
        <header className="form-page-header">
          <h1>Registrar Produto</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tipo *</label>
              <div className="radio-group">
                {["DN", "BN", "Base"].map((t) => (
                  <label key={t} className={`radio-option ${type === t ? "radio-option--active" : ""}`}>
                    <input type="radio" name="tipo" value={t} checked={type === t}
                      onChange={(e) => setType(e.target.value)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="product">Código do Produto *</label>
              <input
                type="text" id="product" value={product} required
                onChange={(e) => {
                  const value = e.target.value.replace(/\//g, "");
                  setProduct(value);
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sector">Setor *</label>
              <select id="sector" value={sector} onChange={(e) => setSector(e.target.value)} required>
                <option value="">Selecione um Setor</option>
                {sectors.map((s, i) => (
                  <option key={i} value={s.nome}>{s.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <Link to="/product" className="btn btn-secondary">
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
