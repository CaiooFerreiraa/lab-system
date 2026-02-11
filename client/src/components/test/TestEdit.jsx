import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { testApi, enumApi, employeeApi, modelApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function TestEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  const [data, setData] = useState(null);
  const [resultado, setResultado] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState("");

  const [typeTestList, setTypeTestList] = useState([]);
  const [modelSpecs, setModelSpecs] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [types, testRes] = await Promise.all([
          enumApi.typesTest(),
          testApi.search(id)
        ]);

        setTypeTestList(types.data || []);
        const t = testRes.data?.[0];
        if (t) {
          setData(t);
          setResultado(t.resultado);
          setDataFim(t.data_fim ? t.data_fim.split('T')[0] : "");
          setStatus(t.status);

          // Carrega specs do modelo
          const modRes = await modelApi.search(t.fk_modelo_cod_modelo);
          setModelSpecs(modRes.data?.especificacoes || []);
        }
      } catch (err) {
        setPopup({ show: true, msg: "Erro ao carregar dados do teste." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await testApi.update({
        cod_teste: id,
        resultado: parseFloat(resultado),
        data_fim: dataFim,
        status: status // O backend reavalia se resultado mudar
      });
      setPopup({ show: true, msg: "Teste atualizado com sucesso!" });
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!data && !loading) return <div className="empty-state">Teste não encontrado.</div>;

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => {
        setPopup({ show: false, msg: "" });
        if (popup.msg.includes("sucesso")) navigate("/test");
      }} />}

      <main className="form-page" style={{ maxWidth: 600 }}>
        <header className="page-header">
          <h1 className="page-title">Editar Teste #{id}</h1>
          <p className="text-secondary">Atualize o resultado ou data de finalização</p>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tipo de Teste</label>
              <input type="text" value={typeTestList.find(t => t.cod_tipo === data?.fk_tipo_cod_tipo)?.nome || ""} readOnly disabled />
            </div>

            <div className="form-group">
              <label>Resultado *</label>
              <input type="number" step="any" value={resultado} onChange={(e) => setResultado(e.target.value)} required />
              {data && (
                <div style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--accent-primary)' }}>
                  {(() => {
                    const typeName = typeTestList.find(t => t.cod_tipo === data.fk_tipo_cod_tipo)?.nome;
                    const spec = modelSpecs.find(s => s.tipo === typeName);
                    return spec ? `Norma esperada: ${spec.label}` : "Sem norma específica vinculada.";
                  })()}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Data de Finalização</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>

            <div className="form-actions" style={{ marginTop: 30 }}>
              <Link to="/test" className="btn btn-secondary">Cancelar</Link>
              <button type="submit" className="btn btn-primary">Salvar Alterações</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
