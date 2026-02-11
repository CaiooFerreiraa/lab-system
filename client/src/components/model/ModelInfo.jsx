import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { modelApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function ModelInfo() {
  const { nome } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await modelApi.search(nome);
        setData(res.data || res.modelo);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [nome]);

  const handleDelete = async () => {
    if (!confirm("Deseja excluir esse modelo?")) return;
    try {
      await modelApi.remove(data.nome);
      navigate("/model");
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    }
  };

  if (loading) return <Loader />;
  if (!data) return <div className="empty-state"><p>Modelo não encontrado</p></div>;

  return (
    <>
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <main className="detail-page">
        <div className="detail-header">
          <Link to="/model" className="btn btn-secondary btn-icon-only">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1>{data.nome}</h1>
          <div className="detail-actions">
            <button className="icon-btn" onClick={() => navigate(`/model/edit/${data.nome}`)}>
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button className="icon-btn icon-btn--danger" onClick={handleDelete}>
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>

        <div className="detail-info-grid">
          <div className="info-card">
            <span className="info-label">Tipo</span>
            <span className="info-value">{data.tipo}</span>
          </div>
          <div className="info-card">
            <span className="info-label">Marca</span>
            <span className="info-value">{data.marca}</span>
          </div>
        </div>

        <section className="detail-section">
          <h2>Especificações</h2>
          <div className="spec-grid">
            {data.especificacoes?.map((esp, i) => (
              <div key={i} className="spec-card">
                <span className="spec-type">{esp.tipo}</span>
                <span className="spec-value">{esp.valor} ± {esp.variacao}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
