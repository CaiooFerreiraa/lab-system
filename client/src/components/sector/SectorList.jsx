import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sectorApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function SectorList() {
  const [sectors, setSectors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const fetchSectors = async () => {
    setLoading(true);
    try {
      const res = await sectorApi.list();
      setSectors(res.data || res.setores || []);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSectors(); }, []);

  const handleDelete = async (nome) => {
    if (!confirm("Deseja excluir esse setor?")) return;
    setLoading(true);
    try {
      await sectorApi.remove(nome);
      setPopup({ show: true, msg: "Setor excluído com sucesso!" });
      fetchSectors();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = sectors.filter((s) =>
    s.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <PageHeader
        title="Setores"
        searchPlaceholder="Buscar setor..."
        onSearch={setSearch}
        registerPath="/sector/register"
      />

      <div className="data-grid">
        {filtered.map((sector, i) => (
          <div className="data-card" key={i}>
            <div className="data-card-avatar data-card-avatar--sector">
              {sector.nome?.[0]?.toUpperCase() || "S"}
            </div>
            <div className="data-card-info">
              <h3 className="data-card-title">
                {sector.nome?.[0]?.toUpperCase() + sector.nome?.slice(1)}
              </h3>
            </div>
            <div className="data-card-actions">
              <button
                className="icon-btn"
                onClick={() => navigate(`/sector/view/${encodeURIComponent(sector.nome)}`)}
                title="Ver"
              >
                <span className="material-symbols-outlined">visibility</span>
              </button>
              <button
                className="icon-btn"
                onClick={() => navigate(`/sector/edit/${sector.nome}`)}
                title="Editar"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button
                className="icon-btn icon-btn--danger"
                onClick={() => handleDelete(sector.nome)}
                title="Excluir"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">domain_disabled</span>
            <p>Nenhum setor encontrado.</p>
          </div>
        )}
      </div>
    </>
  );
}
