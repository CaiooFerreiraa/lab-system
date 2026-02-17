import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function SectorEdit() {
  const { nome } = useParams();
  const [oldName, setOldName] = useState("");
  const [newName, setNewName] = useState("");
  const [profile, setProfile] = useState("padrao");
  const [slaDays, setSlaDays] = useState(4);
  const [granularSlas, setGranularSlas] = useState([]); // [{ material_tipo, dias_sla }]
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await sectorApi.search(nome);
        const item = res.data;
        setOldName(item?.nome || nome);
        setNewName(item?.nome || nome);
        setProfile(item?.config_perfil || "padrao");
        setSlaDays(item?.sla_entrega_dias || 4);
        setGranularSlas(item?.slas || []);
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
      await sectorApi.update(oldName, {
        newName,
        config_perfil: profile,
        sla_entrega_dias: parseInt(slaDays),
        slas: granularSlas
      });
      setPopup({ show: true, msg: "Setor atualizado com sucesso!" });
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

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

            <div className="form-group">
              <label>Perfil de Acesso *</label>
              <select value={profile} onChange={(e) => setProfile(e.target.value)} required>
                <option value="padrao">Acesso Padrão (Leitura)</option>
                <option value="laboratório">Laboratório (Total)</option>
                <option value="borracha">Borracha (Apenas BN)</option>
                <option value="injetado">Injetado (Apenas DN)</option>
                <option value="protótipo">Protótipo</option>
                <option value="pré-fabricado">Pré-Fabricado / Descolagem</option>
                <option value="químico">Químico</option>
                <option value="almoxarifado">Almoxarifado</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prazo Padrão (Fallback - Dias Úteis) *</label>
              <input
                type="number" value={slaDays} required min="1" max="60"
                onChange={(e) => setSlaDays(e.target.value)}
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
                      const sla = granularSlas.find(s => s.material_tipo === type)?.dias_sla ?? '';
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
                              value={sla}
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

            <div className="form-actions" style={{ marginTop: '30px' }}>
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
