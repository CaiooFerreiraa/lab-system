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
  const [slaDays, setSlaDays] = useState(4);
  const [granularSlas, setGranularSlas] = useState([]); // [{ material_tipo, dias_sla }]
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const handleGranularSlaChange = (type, value) => {
    setGranularSlas(prev => {
      const exists = prev.find(s => s.material_tipo === type);
      if (exists) {
        return prev.map(s => s.material_tipo === type ? { ...s, dias_sla: parseInt(value) } : s);
      } else {
        return [...prev, { material_tipo: type, dias_sla: parseInt(value) }];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sectorApi.register({
        nome: name,
        config_perfil: profile,
        sla_entrega_dias: parseInt(slaDays),
        slas: granularSlas
      });
      setPopup({ show: true, msg: "Setor cadastrado com sucesso!" });
      setName("");
      setProfile("padrao");
      setSlaDays(4);
      setGranularSlas([]);
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

            <div className="form-group">
              <label htmlFor="sla">Prazo Padrão (Fallback - Dias Úteis) *</label>
              <input
                type="number" id="sla" value={slaDays} required min="1" max="60"
                onChange={(e) => setSlaDays(e.target.value)}
                placeholder="Ex: 4"
              />
              <small className="form-text text-muted" style={{ display: 'block', marginTop: '5px' }}>
                Usado apenas se não houver um prazo específico definido abaixo.
              </small>
            </div>

            <div className="sla-config-section" style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--accent-primary)' }}>Prazos por Tipo de Material</h3>
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px' }}>Tipo de Material</th>
                      <th style={{ padding: '10px' }}>Prazo (Dias Úteis)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['BN', 'DN', 'Base'].map(type => {
                      const slaValue = granularSlas.find(s => s.material_tipo === type)?.dias_sla ?? '';
                      return (
                        <tr key={type} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>
                            {type === 'BN' ? 'Borracha (BN)' : type === 'DN' ? 'Injetado (DN)' : 'Base'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={slaValue}
                              onChange={(e) => handleGranularSlaChange(type, e.target.value)}
                              placeholder="Ex: 4"
                              className="filter-input"
                              style={{ width: '100px' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
