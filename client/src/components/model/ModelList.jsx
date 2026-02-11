import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { modelApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function ModelList() {
  const [models, setModels] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await modelApi.list();
      setModels(res.data || res.modelos || []);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModels(); }, []);

  const handleDelete = async (nome) => {
    if (!confirm("Deseja excluir esse modelo?")) return;
    setLoading(true);
    try {
      await modelApi.remove(nome);
      setPopup({ show: true, msg: "Modelo excluído com sucesso!" });
      fetchModels();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = models.filter((m) =>
    m.nome?.toLowerCase().includes(search.toLowerCase()) ||
    m.marca?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <PageHeader
        title="Modelos"
        searchPlaceholder="Buscar por nome ou marca..."
        onSearch={setSearch}
        registerPath="/model/register"
      />

      <div className="data-grid">
        {filtered.map((model, i) => (
          <div className="data-card" key={i}>
            <div className="data-card-avatar data-card-avatar--model">
              {model.nome?.[0]?.toUpperCase() || "M"}
            </div>
            <div className="data-card-info">
              <h3 className="data-card-title">{model.nome}</h3>
              <div className="data-card-tags">
                <span className="tag">{model.tipo}</span>
                <span className="tag tag--muted">{model.marca}</span>
                <span className="tag tag--info">{model.especificacoes?.length || 0} especificação(ões)</span>
              </div>
            </div>
            <div className="data-card-actions">
              <button
                className="icon-btn"
                onClick={() => navigate(`/model/view/${encodeURIComponent(model.nome)}`)}
                title="Ver"
              >
                <span className="material-symbols-outlined">visibility</span>
              </button>
              <button
                className="icon-btn"
                onClick={() => navigate(`/model/edit/${encodeURIComponent(model.nome)}`)}
                title="Editar"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button
                className="icon-btn icon-btn--danger"
                onClick={() => handleDelete(model.nome)}
                title="Excluir"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">view_in_ar</span>
            <p>Nenhum modelo encontrado.</p>
          </div>
        )}
      </div>
    </>
  );
}
