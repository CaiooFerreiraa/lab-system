import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

const profiles = [
  { value: "padrao", label: "Acesso Padrão (Leitura)" },
  { value: "laboratório", label: "Laboratório (Total)" },
  { value: "borracha", label: "Borracha (Apenas BN)" },
  { value: "injetado", label: "Injetado (Apenas DN)" },
  { value: "protótipo", label: "Protótipo" },
  { value: "pré-fabricado", label: "Pré-Fabricado / Descolagem" },
  { value: "químico", label: "Químico" },
  { value: "almoxarifado", label: "Almoxarifado" },
];

export default function SectorRegister() {
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("padrao");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sectorApi.register({ nome: name, config_perfil: profile });
      setPopup({ show: true, msg: "Setor cadastrado com sucesso!" });
      setName("");
      setProfile("padrao");
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
                placeholder="Ex: Engenharia Avançada"
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile">Perfil de Acesso *</label>
              <select id="profile" value={profile} onChange={(e) => setProfile(e.target.value)} required>
                {profiles.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <small className="form-text text-muted" style={{ display: 'block', marginTop: '5px' }}>
                Define quais ferramentas e materiais este setor poderá acessar.
              </small>
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
