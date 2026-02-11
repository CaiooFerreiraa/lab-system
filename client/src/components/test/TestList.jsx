import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { testApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function TestList() {
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await testApi.list();
      setTests(res.data || res.modelos || []);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const handleDelete = async (cod_teste) => {
    if (!confirm("Deseja excluir esse teste?")) return;
    setLoading(true);
    try {
      await testApi.remove(cod_teste);
      setPopup({ show: true, msg: "Teste excluído com sucesso!" });
      fetchTests();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = tests.filter((t) =>
    String(t.cod_teste)?.includes(search) ||
    t.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <PageHeader
        title="Testes"
        searchPlaceholder="Buscar por código ou status..."
        onSearch={setSearch}
        registerPath="/test/register"
      />

      <div className="data-grid">
        {filtered.map((test, i) => (
          <div className="data-card" key={i}>
            <div className="data-card-avatar data-card-avatar--test">
              <span className="material-symbols-outlined">science</span>
            </div>
            <div className="data-card-info">
              <h3 className="data-card-title">Teste #{test.cod_teste}</h3>
              <div className="data-card-tags">
                <span className={`tag ${test.status === "Aprovado" ? "tag--success" : test.status === "Reprovado" ? "tag--danger" : ""}`}>
                  {test.status}
                </span>
                <span className="tag tag--muted">{test.resultado}</span>
              </div>
            </div>
            <div className="data-card-actions">
              <button
                className="icon-btn icon-btn--danger"
                onClick={() => handleDelete(test.cod_teste)}
                title="Excluir"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">science</span>
            <p>Nenhum teste encontrado.</p>
          </div>
        )}
      </div>
    </>
  );
}
