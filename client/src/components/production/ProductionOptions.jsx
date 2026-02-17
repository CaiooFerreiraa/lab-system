import { useState, useEffect } from "react";
import { productionApi } from "../../services/api";
import PopUp from "../common/PopUp";
import Loader from "../common/Loader";

export default function ProductionOptions() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  const [newVal, setNewVal] = useState("");
  const [newCat, setNewCat] = useState("requisitante");

  const categories = [
    { id: "requisitante", label: "Requisitante", icon: "person_outline" },
    { id: "lider", label: "Líder", icon: "supervisor_account" },
    { id: "coordenador", label: "Coordenador", icon: "engineering" },
    { id: "gerente", label: "Gerente", icon: "manage_accounts" },
    { id: "esteira", label: "Esteira / Linha", icon: "factory" }
  ];

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const res = await productionApi.listOptions();
      setOptions(res.data || []);
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao carregar opções." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newVal.trim()) return;
    try {
      await productionApi.registerOption({ categoria: newCat, valor: newVal });
      setNewVal("");
      fetchOptions();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao salvar opção." });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover esta opção?")) return;
    try {
      await productionApi.removeOption(id);
      fetchOptions();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao remover." });
    }
  };

  if (loading && options.length === 0) return <Loader />;

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), hsl(250, 70%, 60%))',
            width: '48px', height: '48px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '28px' }}>settings_suggest</span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>Gerenciar Opções de Produção</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Cadastre e remova as opções que aparecem nos campos de seleção do registro de laudos.</p>
          </div>
        </div>
      </header>

      <div className="card" style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)',
        padding: '30px',
        borderRadius: '20px',
        marginBottom: '50px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label style={{ color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Categoria alvo</label>
            <select
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                height: '48px',
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '2', minWidth: '250px', marginBottom: 0 }}>
            <label style={{ color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Novo valor para a lista</label>
            <input
              type="text"
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              placeholder="Ex: Engenharia, Líder Alpha, Linha 03..."
              style={{
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                height: '48px',
                borderRadius: '12px',
                padding: '0 16px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: '48px',
                padding: '0 30px',
                borderRadius: '12px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(60, 120, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
              Cadastrar
            </button>
          </div>
        </form>
      </div>

      <div className="options-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {categories.map(cat => {
          const catOptions = options.filter(o => o.categoria === cat.id);
          return (
            <div key={cat.id} className="card" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '22px' }}>{cat.icon}</span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>{cat.label}</h3>
                </div>
                <span style={{
                  background: 'rgba(60, 120, 255, 0.1)',
                  color: 'var(--accent-primary)',
                  padding: '2px 10px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  {catOptions.length}
                </span>
              </div>

              <div style={{ padding: '20px 24px', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {catOptions.map(opt => (
                    <div
                      key={opt.id}
                      className="option-item-row"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.valor}</span>
                      <button
                        onClick={() => handleDelete(opt.id)}
                        style={{
                          background: 'rgba(255, 59, 92, 0.05)',
                          border: 'none',
                          color: 'var(--accent-danger)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255, 59, 92, 0.15)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255, 59, 92, 0.05)';
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  ))}

                  {catOptions.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 0',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.2 }}>inventory_2</span>
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PopUp
        show={popup.show}
        msg={popup.msg || "Ocorreu um erro inesperado."}
        onClose={() => setPopup({ show: false, msg: "" })}
      />

      <style>{`
        .option-item-row:hover {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.05) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
