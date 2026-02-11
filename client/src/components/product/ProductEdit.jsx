import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { productApi, sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function ProductEdit() {
  const { uuid } = useParams();
  const [productData, setProductData] = useState({ referencia: "", tipo: "", setor: "" });
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prodRes, sectorRes] = await Promise.all([
          productApi.search(uuid),
          sectorApi.list(),
        ]);
        const prod = (prodRes.data || prodRes.material)?.[0];
        if (prod) {
          setProductData({
            referencia: prod.referencia,
            tipo: prod.tipo,
            setor: prod.setor || prod.nome_setor || "",
          });
        }
        setSectors(sectorRes.data || sectorRes.setores || []);
      } catch (err) {
        setPopup({ show: true, msg: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uuid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await productApi.update({
        uuid,
        newcode: productData.referencia,
        newtipo: productData.tipo,
        newsector: productData.setor,
      });
      setPopup({ show: true, msg: "Produto atualizado com sucesso!" });
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
          <h1>Editar Produto: {uuid}</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tipo *</label>
              <div className="radio-group">
                {["DN", "BN", "Base"].map((t) => (
                  <label key={t} className={`radio-option ${productData.tipo === t ? "radio-option--active" : ""}`}>
                    <input type="radio" name="tipo" value={t} checked={productData.tipo === t}
                      onChange={(e) => setProductData({ ...productData, tipo: e.target.value })} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Código do Produto *</label>
              <input
                type="text" value={productData.referencia} required
                onChange={(e) => {
                  const value = e.target.value.replace(/\//g, "");
                  setProductData({ ...productData, referencia: value });
                }}
              />
            </div>

            <div className="form-group">
              <label>Setor *</label>
              <select value={productData.setor}
                onChange={(e) => setProductData({ ...productData, setor: e.target.value })} required>
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
              <button type="submit" className="btn btn-primary">Atualizar</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
