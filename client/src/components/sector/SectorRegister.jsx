import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function SectorRegister() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sectorApi.register({ nome: name });
      setPopup({ show: true, msg: "Setor cadastrado com sucesso!" });
      setName("");
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
        navigate("/sector");
      }} />}

      <main className="form-page">
        <header className="form-page-header">
          <h1>Cadastrar Setor</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="sector">Nome do Setor *</label>
              <input
                type="text" id="sector" value={name} required
                onChange={(e) => {
                  const value = e.target.value.replace(/\//g, "");
                  setName(value);
                }}
              />
            </div>

            <div className="form-actions">
              <Link to="/sector" className="btn btn-secondary">
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
