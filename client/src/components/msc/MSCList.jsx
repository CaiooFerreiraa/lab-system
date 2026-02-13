import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mscApi } from "../../services/api";
import Loader from "../common/Loader";

export default function MSCList() {
  const [mscs, setMscs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, DN, BN, Base
  const [viewMsc, setViewMsc] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await mscApi.list();
        setMscs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleView = async (id) => {
    setLoading(true);
    try {
      const res = await mscApi.getOne(id);
      setViewMsc(res.data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar detalhes da MSC");
    } finally {
      setLoading(false);
    }
  };

  const filteredMscs = mscs.filter(m => {
    const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.descricao && m.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || m.tipo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <>
      {loading && <Loader />}

      {/* Modal de Visualização */}
      {viewMsc && (
        <div className="popup-overlay" onClick={() => setViewMsc(null)}>
          <div className="popup-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto', alignItems: 'flex-start', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>{viewMsc.nome}</h2>
              <button className="icon-btn" onClick={() => setViewMsc(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', width: '100%', marginBottom: '24px' }}>
              <div>
                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Tipo de Material</span>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{viewMsc.tipo}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Descrição</span>
                <div>{viewMsc.descricao || "Sem descrição"}</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--accent-primary)' }}>Especificações Técnicas</h3>

            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Ensaio</th>
                    <th>Regra</th>
                    <th>Valores</th>
                  </tr>
                </thead>
                <tbody>
                  {viewMsc.especificacoes?.length > 0 ? viewMsc.especificacoes.map((spec, i) => (
                    <tr key={i}>
                      <td><strong>{spec.tipo_teste}</strong></td>
                      <td>
                        {spec.regra_tipo === 'fixed' ? 'Fixo (+/-)' :
                          spec.regra_tipo === 'range' ? 'Intervalo' :
                            spec.regra_tipo === 'max' ? 'Máximo' : 'Mínimo'}
                      </td>
                      <td>
                        {spec.regra_tipo === 'fixed' ? `${spec.v_alvo ?? '?'} ± ${spec.v_variacao ?? '?'}` :
                          spec.regra_tipo === 'range' ? `${spec.v_min ?? '?'} a ${spec.v_max ?? '?'}` :
                            spec.regra_tipo === 'max' ? `< ${spec.v_max ?? '?'}` :
                              `> ${spec.v_min ?? '?'}`}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>Nenhuma especificação cadastrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Link to={`/msc/edit/${viewMsc.id}`} className="btn btn-primary">
                <span className="material-symbols-outlined">edit</span> Editar
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="list-page">
        <header className="list-page-header">
          <div className="page-header-top">
            <div className="header-content">
              <h1 className="page-title">Fichas Técnicas (MSC)</h1>
              <p className="text-secondary">Gerencie as especificações técnicas de materiais (DN, BN e Base)</p>
            </div>
            <Link to="/msc/register" className="btn btn-primary">
              <span className="material-symbols-outlined">add</span>
              Nova MSC
            </Link>
          </div>

          <div className="filter-bar" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
            <div className="search-container" style={{ flex: 1, minWidth: '250px' }}>
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group" style={{ display: 'flex', gap: '8px' }}>
              {['all', 'DN', 'BN', 'Base'].map(type => (
                <button
                  key={type}
                  className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'all' ? 'Todas' : type}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="data-grid">
          {filteredMscs.length > 0 ? (
            filteredMscs.map((msc) => (
              <div key={msc.id} className="data-card">
                <div className="data-card-avatar data-card-avatar--model">
                  {msc.tipo?.substring(0, 2).toUpperCase() || "DN"}
                </div>
                <div className="data-card-info">
                  <h3 className="data-card-title">{msc.nome}</h3>
                  <span className="data-card-subtitle">
                    {msc.descricao || "Sem descrição"}
                  </span>
                  <div className="data-card-tags">
                    <span className={`tag tag--${msc.tipo === 'DN' ? 'info' : msc.tipo === 'BN' ? 'success' : 'muted'}`}>
                      {msc.tipo}
                    </span>
                    <span className="tag tag--muted">{new Date(msc.data_criacao).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="data-card-actions">
                  <button className="icon-btn" title="Visualizar Detalhes" onClick={() => handleView(msc.id)}>
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <Link to={`/msc/edit/${msc.id}`} className="icon-btn" title="Editar MSC">
                    <span className="material-symbols-outlined">edit</span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>Nenhuma ficha técnica cadastrada.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
