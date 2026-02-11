import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { markApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function MarkList() {
  const [marks, setMarks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const res = await markApi.list();
      setMarks(res.data || res || []);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarks(); }, []);

  const handleDelete = async (name) => {
    if (!confirm("Deseja excluir essa marca?")) return;
    setLoading(true);
    try {
      await markApi.remove(name);
      setPopup({ show: true, msg: "Marca excluída com sucesso!" });
      fetchMarks();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = marks.filter((m) =>
    m.marca?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <PageHeader
        title="Marcas"
        searchPlaceholder="Buscar marca..."
        onSearch={setSearch}
        registerPath="/mark/register"
      />

      <div className="data-grid">
        {filtered.map((mark, i) => (
          <div className="data-card" key={i}>
            <div className="data-card-avatar data-card-avatar--brand">
              {mark.marca?.[0]?.toUpperCase() || "M"}
            </div>
            <div className="data-card-info">
              <h3 className="data-card-title">{mark.marca}</h3>
              <span className="data-card-subtitle">
                {mark.metodo?.length || 0} método(s)
              </span>
              <div className="data-card-tags">
                {mark.metodo?.slice(0, 3).map((m, j) => (
                  <span className="tag" key={j}>{m.nome}</span>
                ))}
                {mark.metodo?.length > 3 && (
                  <span className="tag tag--muted">+{mark.metodo.length - 3}</span>
                )}
              </div>
            </div>
            <div className="data-card-actions">
              <button
                className="icon-btn"
                onClick={() => navigate(`/mark/edit/${mark.marca}`)}
                title="Editar"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button
                className="icon-btn icon-btn--danger"
                onClick={() => handleDelete(mark.marca)}
                title="Excluir"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">label_off</span>
            <p>Nenhuma marca encontrada.</p>
          </div>
        )}
      </div>
    </>
  );
}
