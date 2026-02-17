import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { balancaApi, sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function BalancaRegister() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [patrimonio, setPatrimonio] = useState("");
  const [calibracaoExterna, setCalibracaoExterna] = useState(false);
  const [fkSetor, setFkSetor] = useState("");
  const [status, setStatus] = useState("Aprovado");
  const [diferenca, setDiferenca] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [sectorList, setSectorList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    sectorApi.list().then(res => setSectorList(res.data || [])).catch(console.error);

    if (isEditing) {
      setLoading(true);
      balancaApi.getOne(id).then(res => {
        const d = res.data;
        if (d) {
          setPatrimonio(d.patrimonio);
          setCalibracaoExterna(d.calibracao_externa);
          setFkSetor(d.fk_cod_setor);
          setStatus(d.status);
          setDiferenca(d.diferenca_reprovacao || "");
          setObservacoes(d.observacoes || "");
        }
      }).catch(() => setPopup({ show: true, msg: "Erro ao carregar dados." }))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        patrimonio,
        calibracao_externa: calibracaoExterna,
        fk_cod_setor: fkSetor,
        status,
        diferenca_reprovacao: status === "Reprovado" ? parseFloat(diferenca) : null,
        observacoes
      };

      if (isEditing) {
        await balancaApi.update({ id, ...payload });
        setPopup({ show: true, msg: "Balança atualizada com sucesso!" });
      } else {
        await balancaApi.register(payload);
        setPopup({ show: true, msg: "Balança cadastrada com sucesso!" });
      }
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
        if (popup.msg.includes("sucesso")) navigate("/balancas");
      }} />}

      <main className="form-page">
        <header className="page-header">
          <h1 className="page-title">{isEditing ? "Editar Balança" : "Novo Lançamento de Balança"}</h1>
          <p className="text-secondary">Registre o controle patrimonial e status de calibração</p>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Código do Patrimônio *</label>
                <input type="text" value={patrimonio} onChange={(e) => setPatrimonio(e.target.value)} required placeholder="Ex: PAT-2024-001" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Setor *</label>
                <select value={fkSetor} onChange={(e) => setFkSetor(e.target.value)} required>
                  <option value="">Selecione o Setor</option>
                  {sectorList.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row" style={{ alignItems: 'center', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={calibracaoExterna} onChange={(e) => setCalibracaoExterna(e.target.checked)} />
                Possui Calibração Externa?
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status Final *</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Reprovado">Reprovado</option>
                </select>
              </div>

              {status === "Reprovado" && (
                <div className="form-group">
                  <label>Diferença Observada (Reprovação) *</label>
                  <input type="number" step="any" value={diferenca} onChange={(e) => setDiferenca(e.target.value)} required placeholder="Ex: 0.05" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Detalhes adicionais sobre a balança ou calibração..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <Link to="/balancas" className="btn btn-secondary">Cancelar</Link>
              <button type="submit" className="btn btn-primary">Salvar Registro</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
