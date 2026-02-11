import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { testApi, enumApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function LaudoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [laudo, setLaudo] = useState(null);
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  // Estado para novo teste
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTest, setNewTest] = useState({ fk_tipo_cod_tipo: "", resultado: "", data_fim: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [laudoRes, typesRes] = await Promise.all([
        testApi.getLaudo(id),
        enumApi.typesTest()
      ]);
      setLaudo(laudoRes.data);
      setTestTypes(typesRes.data || []);
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao carregar laudo." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await testApi.addTestToLaudo(id, newTest);
      setPopup({ show: true, msg: "Teste adicionado ao laudo com sucesso!" });
      setShowAddForm(false);
      setNewTest({ fk_tipo_cod_tipo: "", resultado: "", data_fim: "" });
      fetchData(); // Recarrega laudo
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao adicionar teste." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTestStatus = async (codTeste, resultado) => {
    setLoading(true);
    try {
      await testApi.update({ cod_teste: codTeste, resultado: parseFloat(resultado) });
      fetchData();
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao atualizar teste." });
    } finally {
      setLoading(false);
    }
  };

  if (!laudo && !loading) return <div className="empty-state">Laudo não encontrado.</div>;

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <main className="detail-page">
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Laudo Técnico #{id}</h1>
            <p className="text-secondary">{laudo?.modelo_nome} - {laudo?.fk_material}</p>
          </div>
          <div className={`tag ${laudo?.status_geral === 'Aprovado' ? 'tag--success' : 'tag--danger'}`} style={{ fontSize: '1.2rem', padding: '8px 20px' }}>
            {laudo?.status_geral}
          </div>
        </header>

        <section className="form-container" style={{ marginBottom: '24px' }}>
          <div className="detail-info-grid">
            <div className="info-card">
              <span className="info-label">Responsável</span>
              <span className="info-value">{laudo?.func_nome}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Data de Criação</span>
              <span className="info-value">{new Date(laudo?.data_criacao).toLocaleDateString()}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Setor</span>
              <span className="info-value">{laudo?.setor_nome || "N/A"}</span>
            </div>
          </div>
        </section>

        <section className="test-section">
          <div className="form-section-title">
            <h3>Testes Vinculados</h3>
            <button className="btn btn-sm btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Cancelar" : "+ Adicionar Teste ao Laudo"}
            </button>
          </div>

          {showAddForm && (
            <form className="form-container" onSubmit={handleAddTest} style={{ marginBottom: '20px', background: 'rgba(60,120,255,0.05)' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Teste *</label>
                  <select value={newTest.fk_tipo_cod_tipo} onChange={e => setNewTest({ ...newTest, fk_tipo_cod_tipo: e.target.value })} required>
                    <option value="">Selecione</option>
                    {testTypes.map(t => <option key={t.cod_tipo} value={t.cod_tipo}>{t.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Resultado *</label>
                  <input type="number" step="any" value={newTest.resultado} onChange={e => setNewTest({ ...newTest, resultado: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Data Fim (opcional)</label>
                  <input type="date" value={newTest.data_fim} onChange={e => setNewTest({ ...newTest, data_fim: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Gravar no Laudo</button>
            </form>
          )}

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Resultado</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {laudo?.testes?.map(t => (
                  <tr key={t.cod_teste}>
                    <td><strong>{t.tipo_nome}</strong></td>
                    <td>
                      <input
                        type="number"
                        defaultValue={t.resultado}
                        onBlur={(e) => handleUpdateTestStatus(t.cod_teste, e.target.value)}
                        style={{ width: '80px', padding: '4px', background: 'transparent', border: '1px solid transparent' }}
                      />
                    </td>
                    <td>
                      <span className={`tag ${t.status === 'Aprovado' ? 'tag--success' : 'tag--danger'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{t.data_fim ? new Date(t.data_fim).toLocaleDateString() : "-"}</td>
                    <td>
                      <Link to={`/test/edit/${t.cod_teste}`} className="icon-btn" title="Editar detalhes">
                        <span className="material-symbols-outlined">edit</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="form-actions" style={{ marginTop: '30px' }}>
          <Link to="/test" className="btn btn-secondary">Voltar para Lista</Link>
        </div>
      </main>
    </>
  );
}
