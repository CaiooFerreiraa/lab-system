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
  const [valores, setValores] = useState([]);
  const [tempoMinutos, setTempoMinutos] = useState(0);
  const [tempoSegundos, setTempoSegundos] = useState(0);

  const MULTI_VALUE_TESTS = {
    'ALONGAMENTO': 3,
    'TRACAO': 3,
    'RASGAMENTO': 3,
    'DENSIDADE': 3,
    'MODULO 300%': 3,
    'COMPRESSION SET': 5,
    'ENCOLHIMENTO': 6
  };

  const PERCENT_TESTS = ['ALONGAMENTO', 'COMPRESSION SET'];

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
          const totalSec = t.tempo_real_segundos || 0;
          setTempoMinutos(Math.floor(totalSec / 60));
          setTempoSegundos(totalSec % 60);

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
        resultado: (resultado && !isNaN(parseFloat(resultado))) ? parseFloat(resultado) : null,
        data_fim: dataFim,
        status: status,
        tempo_real_segundos: (parseInt(tempoMinutos || 0) * 60) + parseInt(tempoSegundos || 0)
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

            <div className="form-group" style={{
              flex: MULTI_VALUE_TESTS[typeTestList.find(t => t.cod_tipo === data?.fk_tipo_cod_tipo)?.nome?.toUpperCase()] ? '2' : '1'
            }}>
              <label>Resultado {typeTestList.find(t => t.cod_tipo === data?.fk_tipo_cod_tipo)?.nome?.toUpperCase() === 'DESCOLAGEM' ? '' : '*'} {MULTI_VALUE_TESTS[typeTestList.find(t => t.cod_tipo === data?.fk_tipo_cod_tipo)?.nome?.toUpperCase()] && "(Média Automática)"}</label>

              {(() => {
                const typeName = typeTestList.find(t => t.cod_tipo === data?.fk_tipo_cod_tipo)?.nome?.toUpperCase();
                const numFields = MULTI_VALUE_TESTS[typeName];
                const isPercent = PERCENT_TESTS.includes(typeName);

                if (numFields) {
                  return (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {[...Array(numFields)].map((_, i) => (
                        <input
                          key={i}
                          type="number"
                          step="any"
                          placeholder={`V${i + 1}`}
                          style={{
                            width: '100px',
                            padding: '12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            color: 'var(--text-primary)',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3)'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                          value={valores[i] || ""}
                          onChange={(e) => {
                            const newVals = [...(valores || [])];
                            newVals[i] = e.target.value;
                            setValores(newVals);
                            const validVals = newVals.map(v => parseFloat(v)).filter(v => !isNaN(v));
                            if (validVals.length > 0) {
                              const avg = (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(2);
                              setResultado(avg);
                            }
                          }}
                        />
                      ))}
                      {isPercent && (
                        <span style={{
                          color: 'var(--accent-primary)',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          background: 'rgba(60,120,255,0.1)',
                          padding: '10px 16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(60,120,255,0.2)'
                        }}>%</span>
                      )}
                      <div style={{
                        padding: '12px 24px',
                        background: 'rgba(60,120,255,0.1)',
                        borderRadius: '12px',
                        fontWeight: '800',
                        border: '1px solid var(--accent-primary)',
                        color: 'var(--accent-primary)',
                        boxShadow: '0 4px 15px rgba(60,120,255,0.2)',
                        minWidth: '100px',
                        textAlign: 'center',
                        fontSize: '1.2rem'
                      }}>
                        {resultado || "---"}
                      </div>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type={typeTestList.find(t => t.cod_tipo === data?.fk_tipo_cod_tipo)?.nome?.toUpperCase() === 'DESCOLAGEM' ? "text" : "number"}
                      step="any"
                      value={resultado}
                      onChange={(e) => setResultado(e.target.value)}
                      required={typeTestList.find(t => t.cod_tipo === data?.fk_tipo_cod_tipo)?.nome?.toUpperCase() !== 'DESCOLAGEM'}
                      placeholder={typeTestList.find(t => t.cod_tipo === data?.fk_tipo_cod_tipo)?.nome?.toUpperCase() === 'DESCOLAGEM' ? "Opcional..." : "Valor..."}
                      style={{
                        width: '140px',
                        padding: '12px 16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    {isPercent && (
                      <span style={{
                        color: 'var(--accent-primary)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        background: 'rgba(60,120,255,0.1)',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: '1px solid rgba(60,120,255,0.2)'
                      }}>%</span>
                    )}
                  </div>
                );
              })()}

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

            <div className="form-group">
              <label>Tempo de Execução (Real)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input type="number" className="filter-input" value={tempoMinutos} onChange={e => setTempoMinutos(e.target.value)} min="0" />
                  <small className="text-secondary">Minutos</small>
                </div>
                <div style={{ flex: 1 }}>
                  <input type="number" className="filter-input" value={tempoSegundos} onChange={e => setTempoSegundos(e.target.value)} min="0" max="59" />
                  <small className="text-secondary">Segundos</small>
                </div>
              </div>
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
