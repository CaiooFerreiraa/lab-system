import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mscApi } from "../../services/api";
import Loader from "../common/Loader";

export default function MSCList() {
  const [mscs, setMscs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, DN, BN, Base

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

  const filteredMscs = mscs.filter(m => {
    const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.descricao && m.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || m.tipo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <>
      {loading && <Loader />}
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
