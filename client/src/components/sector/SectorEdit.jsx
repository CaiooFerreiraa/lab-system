import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function SectorEdit() {
  const { nome } = useParams();
  const [oldName, setOldName] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await sectorApi.search(nome);
        const data = res.data || res.setor;
        const sectorName = Array.isArray(data) ? data[0]?.nome : data?.nome;
        setOldName(sectorName || nome);
        setNewName(sectorName || nome);
      } catch (err) {
        setPopup({ show: true, msg: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [nome]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sectorApi.update(oldName, newName);
      setPopup({ show: true, msg: "Setor atualizado com sucesso!" });
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
          <h1>Editar Setor</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome atual</label>
              <input type="text" value={oldName} disabled />
            </div>

            <div className="form-group">
              <label>Novo nome *</label>
              <input
                type="text" value={newName} required
                onChange={(e) => {
                  const value = e.target.value.replace(/\//g, "");
                  setNewName(value);
                }}
              />
            </div>

            <div className="form-actions">
              <Link to="/sector" className="btn btn-secondary">
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar
              </Link>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
