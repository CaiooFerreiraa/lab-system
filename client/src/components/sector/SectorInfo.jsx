import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function SectorInfo() {
  const { nome } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await sectorApi.search(nome);
        const sectorData = res.data || res.setor;
        if (Array.isArray(sectorData) && sectorData.length > 0) {
          setData(sectorData[0]);
        } else {
          setData({ nome });
        }
      } catch (err) {
        setPopup({ show: true, msg: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nome]);

  useEffect(() => {
    if (!data) return;
    const fetchMateriais = async () => {
      try {
        const res = await sectorApi.listMateriais(nome);
        setMateriais(res.data || res.setor || []);
      } catch {
        setMateriais([]);
      }
    };
    fetchMateriais();
  }, [data, nome]);

  const handleDelete = async () => {
    if (!confirm("Deseja excluir este setor?")) return;
    setLoading(true);
    try {
      await sectorApi.remove(nome);
      setPopup({ show: true, msg: "Setor excluído com sucesso!" });
      setTimeout(() => navigate("/sector"), 1000);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!data) return <div className="empty-state"><p>Setor não encontrado</p></div>;

  return (
    <>
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <main className="detail-page">
        <div className="detail-header">
          <Link to="/sector" className="btn btn-secondary btn-icon-only">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1>Setor: {data.nome}</h1>
          <div className="detail-actions">
            <button className="icon-btn" onClick={() => navigate(`/sector/edit/${nome}`)}>
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button className="icon-btn icon-btn--danger" onClick={handleDelete}>
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>

        <section className="detail-section">
          <h2>Materiais ({materiais.length})</h2>
          <div className="detail-list">
            {materiais.length === 0 ? (
              <p className="text-muted">Nenhum material encontrado neste setor.</p>
            ) : (
              materiais.map((material, i) => (
                <div key={i} className="detail-item">
                  <h3>{material.Tipo || material.tipo} — {material["Referência"] || material.referencia}</h3>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="detail-footer">
          <button className="btn btn-primary" onClick={() => navigate("/product/register")}>
            <span className="material-symbols-outlined">add</span>
            Adicionar Material
          </button>
        </div>
      </main>
    </>
  );
}
