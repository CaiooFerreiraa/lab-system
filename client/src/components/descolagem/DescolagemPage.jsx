import { useEffect, useState } from "react";
import { descolagemApi, modelApi, sectorApi, employeeApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function DescolagemPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const [showForm, setShowForm] = useState(false);

  // Listas
  const [modelList, setModelList] = useState([]);
  const [sectorList, setSectorList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);

  // Form Geral
  const [fkFuncionario, setFkFuncionario] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Deteccao Manual de Nike
  const [isNike, setIsNike] = useState(false);

  // Estados dos Laudos (lado único ou duplo)
  const [laudoE, setLaudoE] = useState({ arquivo: null });
  const [laudoD, setLaudoD] = useState({ arquivo: null });
  const [laudoU, setLaudoU] = useState({ arquivo: null, titulo: "" });

  const [viewRecord, setViewRecord] = useState(null);

  // Filtros
  const [filterText, setFilterText] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const cleanFileName = (name) => {
    if (!name) return "";
    return name.replace(/\.pdf$/i, '')
      .replace(/\.?\.is_ptf/gi, '')
      .replace(/\./g, ' ')
      .trim();
  };

  const filteredRecords = records.filter(rec => {
    const matchesText = rec.titulo.toLowerCase().includes(filterText.toLowerCase()) ||
      (rec.modelo_nome && rec.modelo_nome.toLowerCase().includes(filterText.toLowerCase()));
    const matchesModel = !filterModel || rec.fk_modelo_cod_modelo?.toString() === filterModel;
    const matchesStatus = !filterStatus || rec.status_final === filterStatus;
    return matchesText && matchesModel && matchesStatus;
  });

  useEffect(() => {
    loadRecords();
    loadLists();
  }, []);

  const loadRecords = async () => {
    try {
      const res = await descolagemApi.list();
      setRecords(res.data || []);
    } catch {
      setPopup({ show: true, msg: "Erro ao carregar registros." });
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async () => {
    try {
      const empRes = await employeeApi.list();
      setEmployeeList(empRes.data || []);
      const modRes = await modelApi.list();
      setModelList(modRes.data || []);
    } catch { /* erro silencioso */ }
  };

  const handleUploadSingle = async (lado, data) => {
    if (!data.arquivo) return;

    const formData = new FormData();
    formData.append("arquivo", data.arquivo);
    formData.append("titulo", data.titulo || data.arquivo.name);
    formData.append("fk_funcionario_matricula", fkFuncionario);
    formData.append("lado", lado);
    formData.append("observacoes", observacoes);

    return descolagemApi.upload(formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (isNike) {
        const promises = [];
        if (laudoE.arquivo) promises.push(handleUploadSingle("Esquerdo", laudoE));
        if (laudoD.arquivo) promises.push(handleUploadSingle("Direito", laudoD));
        if (promises.length === 0) throw new Error("Selecione ao menos um laudo (Direito ou Esquerdo).");
        await Promise.all(promises);
      } else {
        if (!laudoU.arquivo) throw new Error("Selecione o arquivo do laudo.");
        await handleUploadSingle("Único", laudoU);
      }
      setPopup({ show: true, msg: "Upload concluído! O sistema está processando Modelo, Setor e Marca dos PDFs." });
      resetForm();
      setShowForm(false);
      loadRecords();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFkFuncionario(""); setObservacoes("");
    setLaudoE({ arquivo: null });
    setLaudoD({ arquivo: null });
    setLaudoU({ arquivo: null, titulo: "" });
  };

  const API_URL = import.meta.env.VITE_API_URL || "";

  return (
    <>
      {loading && <Loader />}
      {uploading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <main className="report-page">
        <header className="report-header">
          <div>
            <h1 className="page-title">Descolagem</h1>
            <p className="text-muted">Processamento automático de Laudos Técnicos.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              <span className="material-symbols-outlined">{showForm ? "close" : "add_circle"}</span>
              {showForm ? "Cancelar" : "Novo Laudo"}
            </button>
          </div>
        </header>

        <div className="filters-bar" style={{
          display: 'flex', gap: '15px', background: 'var(--bg-card)', padding: '16px',
          borderRadius: '12px', marginBottom: '25px', alignItems: 'center',
          border: '1px solid var(--border-color)'
        }}>
          <div className="filter-group" style={{ flex: 2, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}>search</span>
            <input
              type="text"
              placeholder="Buscar por laudo ou modelo..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="filter-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <div className="filter-group" style={{ flex: 1 }}>
            <select value={filterModel} onChange={(e) => setFilterModel(e.target.value)} className="filter-input">
              <option value="">Todos os Modelos</option>
              {modelList.map(m => <option key={m.cod_modelo} value={m.cod_modelo}>{m.nome}</option>)}
            </select>
          </div>
          <div className="filter-group" style={{ flex: 0.8 }}>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-input">
              <option value="">Status (Todos)</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
            </select>
          </div>

          {(filterText || filterModel || filterStatus) && (
            <button className="btn btn-secondary" onClick={() => { setFilterText(""); setFilterModel(""); setFilterStatus(""); }} style={{ height: '42px', padding: '0 15px' }}>
              Limpar
            </button>
          )}
        </div>

        {showForm && (
          <div className="descolagem-form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-section-title" style={{ marginTop: 0 }}>
                <h3>Configuração de Upload</h3>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tipo de Laudo</label>
                  <div className="toggle-group" style={{ display: 'flex', gap: '10px' }}>
                    <button type="button"
                      className={`btn ${!isNike ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setIsNike(false)}
                      style={{ flex: 1, height: '45px' }}>
                      <span className="material-symbols-outlined">description</span> Padrão (Único)
                    </button>
                    <button type="button"
                      className={`btn ${isNike ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setIsNike(true)}
                      style={{ flex: 1, height: '45px' }}>
                      <span className="material-symbols-outlined">straighten</span> Padrão Nike (Par)
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '15px' }}>
                <div className="form-group">
                  <label>Responsável pelo Upload *</label>
                  <select
                    value={fkFuncionario}
                    onChange={(e) => setFkFuncionario(e.target.value)}
                    required
                    className="filter-input"
                  >
                    <option value="">Quem está enviando?</option>
                    {employeeList.map(f => <option key={f.matricula} value={f.matricula}>{f.nome} {f.sobrenome}</option>)}
                  </select>
                </div>
              </div>

              {isNike ? (
                <div className="nike-upload-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                  <div className="upload-box" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <label style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '0.8rem', display: 'block', marginBottom: '12px' }}>PÉ ESQUERDO</label>
                    <div className="file-select" style={{ position: 'relative', overflow: 'hidden' }}>
                      <button type="button" className={`btn ${laudoE.arquivo ? 'btn-success' : 'btn-secondary'}`} style={{ width: '100%', height: '45px' }}>
                        <span className="material-symbols-outlined">{laudoE.arquivo ? 'check_circle' : 'upload_file'}</span>
                        {laudoE.arquivo ? 'Trocar PDF' : 'Selecionar PDF'}
                      </button>
                      <input type="file" accept=".pdf" onChange={(e) => setLaudoE({ arquivo: e.target.files[0] })}
                        style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                    </div>
                    {laudoE.arquivo && <p style={{ fontSize: '0.75rem', marginTop: '8px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{laudoE.arquivo.name}</p>}
                  </div>

                  <div className="upload-box" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <label style={{ color: 'var(--accent-success)', fontWeight: 'bold', fontSize: '0.8rem', display: 'block', marginBottom: '12px' }}>PÉ DIREITO</label>
                    <div className="file-select" style={{ position: 'relative', overflow: 'hidden' }}>
                      <button type="button" className={`btn ${laudoD.arquivo ? 'btn-success' : 'btn-secondary'}`} style={{ width: '100%', height: '45px' }}>
                        <span className="material-symbols-outlined">{laudoD.arquivo ? 'check_circle' : 'upload_file'}</span>
                        {laudoD.arquivo ? 'Trocar PDF' : 'Selecionar PDF'}
                      </button>
                      <input type="file" accept=".pdf" onChange={(e) => setLaudoD({ arquivo: e.target.files[0] })}
                        style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                    </div>
                    {laudoD.arquivo && <p style={{ fontSize: '0.75rem', marginTop: '8px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{laudoD.arquivo.name}</p>}
                  </div>
                </div>
              ) : (
                <div className="standard-upload-container" style={{ marginTop: '20px' }}>
                  <div className="upload-box" style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <label style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', display: 'block', marginBottom: '15px' }}>ARQUIVO DO LAUDO *</label>
                    <div className="file-select" style={{ position: 'relative', overflow: 'hidden', maxWidth: '300px', margin: '0 auto' }}>
                      <button type="button" className={`btn ${laudoU.arquivo ? 'btn-success' : 'btn-primary'}`} style={{ width: '100%', height: '50px' }}>
                        <span className="material-symbols-outlined">{laudoU.arquivo ? 'check_circle' : 'attach_file'}</span>
                        {laudoU.arquivo ? 'PDF Selecionado' : 'Carregar Arquivo PDF'}
                      </button>
                      <input type="file" accept=".pdf" onChange={(e) => setLaudoU({ ...laudoU, arquivo: e.target.files[0] })} required={!isNike}
                        style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                    </div>
                    {laudoU.arquivo && <p style={{ fontSize: '0.8rem', marginTop: '12px', color: 'var(--accent-success)' }}>{laudoU.arquivo.name}</p>}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: 20 }}>
                <label>Observações</label>
                <textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Opcional..." />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" style={{ width: "100%", height: '50px', fontSize: '1rem' }}>
                  {uploading ? "Processando e Extraindo..." : "Finalizar e Processar PDF"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="descolagem-grid">
          {filteredRecords.length > 0 ? filteredRecords.map(rec => (
            <div key={rec.id} className="descolagem-card" onClick={() => setViewRecord(rec)}>
              <div className="descolagem-card-icon" style={{
                background: rec.status_final === 'Aprovado' ? 'var(--accent-success)' : rec.status_final === 'Reprovado' ? 'var(--accent-danger)' : 'var(--accent-primary)',
                color: '#fff'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>picture_as_pdf</span>
              </div>
              <div className="descolagem-card-info">
                <h3>{cleanFileName(rec.titulo)} <small style={{ color: "var(--accent-primary)" }}>[{rec.lado}]</small></h3>
                <div className="descolagem-card-meta">
                  <span className={`tag tag--${rec.status_final === 'Aprovado' ? 'success' : 'danger'}`}>{rec.status_final}</span>
                  <span className="tag tag--muted">Média: {rec.valor_media} {rec.marca === 'NIKE' ? 'kgf/cm' : 'N/mm'}</span>
                  <span className="tag tag--info">{rec.modelo_nome || 'Modelo não vinculado'}</span>
                </div>
                <p className="text-muted" style={{ fontSize: "0.8rem" }}>{new Date(rec.data_upload).toLocaleDateString()} • {rec.funcionario_nome || 'N/A'}</p>
              </div>
              <div className="descolagem-card-actions">
                <button onClick={() => setViewRecord(rec)} className="icon-btn"><span className="material-symbols-outlined">visibility</span></button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm("Excluir?")) { descolagemApi.remove(rec.id).then(() => loadRecords()); } }} className="icon-btn icon-btn--danger"><span className="material-symbols-outlined">delete</span></button>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed #444' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#666', marginBottom: '10px' }}>search_off</span>
              <p className="text-muted">Nenhum laudo encontrado com esses filtros.</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE VISUALIZAÇÃO DETALHADA */}
      {viewRecord && (
        <div className="modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="modal-content large-modal" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: '95vh', width: '95vw', maxWidth: '1600px' }}>
            <header className="modal-header" style={{
              padding: '15px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-secondary)'
            }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Detalhes do Laudo: {cleanFileName(viewRecord.titulo)}</h2>
                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{viewRecord.lado} | {viewRecord.modelo_nome || 'Processado'}</span>
              </div>
              <button className="icon-btn" onClick={() => setViewRecord(null)} style={{ color: 'var(--text-primary)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="modal-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* PDF Preview */}
              <div className="pdf-viewer-container" style={{ flex: 2, background: '#1a1d27', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #333', background: '#252836' }}>
                  <a href={`${API_URL}${viewRecord.arquivo_path}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>open_in_new</span>
                    Abrir PDF em nova aba
                  </a>
                </div>
                <iframe
                  src={`${API_URL}${viewRecord.arquivo_path}#toolbar=1`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', flex: 1 }}
                  title="PDF Preview"
                />
              </div>

              {/* Data Panel */}
              <div className="data-display-panel" style={{ flex: 0.8, padding: '20px', overflowY: 'auto', background: 'var(--bg-card)' }}>
                <div className="data-group">
                  <h4>Valores Técnicos Extraídos</h4>
                  <div className="data-grid-item"><span>Média:</span> <strong>{viewRecord.valor_media} {viewRecord.marca === 'NIKE' ? 'kgf/cm' : 'N/mm'}</strong></div>
                  <div className="data-grid-item"><span>Mínimo:</span> <strong>{viewRecord.valor_minimo} {viewRecord.marca === 'NIKE' ? 'kgf/cm' : 'N/mm'}</strong></div>
                  <div className="data-grid-item"><span>Máximo:</span> <strong>{viewRecord.valor_maximo} {viewRecord.marca === 'NIKE' ? 'kgf/cm' : 'N/mm'}</strong></div>
                  <div className="data-grid-item"><span>Especificação:</span> <strong>{viewRecord.especificacao_valor || '—'} {viewRecord.marca === 'NIKE' ? 'kgf/cm' : 'N/mm'}</strong></div>
                  <div className="data-grid-item"><span>Status Final:</span> <strong className={viewRecord.status_final === 'Aprovado' ? 'text-success' : 'text-danger'}>{viewRecord.status_final}</strong></div>
                </div>

                <div className="data-group" style={{ marginTop: 25 }}>
                  <h4>Informações de Produção</h4>
                  <div className="data-grid-item"><span>Líder:</span> <strong>{viewRecord.lider || '—'}</strong></div>
                  <div className="data-grid-item"><span>Coordenador:</span> <strong>{viewRecord.coordenador || '—'}</strong></div>
                  <div className="data-grid-item"><span>Gerente:</span> <strong>{viewRecord.gerente || '—'}</strong></div>
                  <div className="data-grid-item"><span>Esteira:</span> <strong>{viewRecord.esteira || '—'}</strong></div>
                  <div className="data-grid-item"><span>Marca:</span> <strong>{viewRecord.marca || '—'}</strong></div>
                  <div className="data-grid-item"><span>Requisitante:</span> <strong>{viewRecord.requisitante || '—'}</strong></div>
                  <div className="data-grid-item"><span>Modelo:</span> <strong style={{ color: 'var(--accent-primary)' }}>{viewRecord.modelo_nome || '—'}</strong></div>
                  <div className="data-grid-item"><span>Setor:</span> <strong style={{ color: 'var(--accent-success)' }}>{viewRecord.setor_nome || '—'}</strong></div>
                  <div className="data-grid-item"><span>Cor:</span> <strong>{viewRecord.cores || '—'}</strong></div>
                  <div className="data-grid-item"><span>Pedido:</span> <strong>{viewRecord.numero_pedido || '—'}</strong></div>
                  <div className="data-grid-item"><span>Realizado por:</span> <strong>{viewRecord.realizado_por || '—'}</strong></div>
                </div>

                <div className="data-group" style={{ marginTop: 25 }}>
                  <h4>Materiais e Datas</h4>
                  <div className="data-grid-item"><span>Adesivo:</span> <strong>{viewRecord.adesivo || '—'}</strong></div>
                  <div className="data-grid-item"><span>Fornecedor:</span> <strong>{viewRecord.adesivo_fornecedor || '—'}</strong></div>
                  <div className="data-grid-item"><span>Data Realização:</span> <strong>{viewRecord.data_realizacao ? new Date(viewRecord.data_realizacao).toLocaleDateString() : '—'}</strong></div>
                  <div className="data-grid-item"><span>Data Colagem:</span> <strong>{viewRecord.data_colagem ? new Date(viewRecord.data_colagem).toLocaleDateString() : '—'}</strong></div>
                </div>

                {viewRecord.observacoes && (
                  <div className="data-group" style={{ marginTop: 25 }}>
                    <h4>Observações</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{viewRecord.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; top:0; left:0; width:100%; height:100%;
          background: rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center;
          z-index: 1000; backdrop-filter: blur(4px);
        }
        .large-modal { 
          background: var(--bg-card); 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: var(--shadow-lg); 
          border: 1px solid var(--border-color); 
        }
        .data-group h4 { 
          color: var(--accent-primary); 
          border-bottom: 2px solid var(--border-color); 
          padding-bottom: 8px; 
          margin-bottom: 15px; 
          font-size: 0.85rem; 
          text-transform: uppercase; 
          letter-spacing: 1.5px; 
          font-weight: 700;
        }
        .data-grid-item { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 12px; 
          font-size: 0.95rem; 
          border-bottom: 1px solid var(--border-color); 
          padding-bottom: 6px; 
        }
        .data-grid-item span { color: var(--text-secondary); font-weight: 500; }
        .data-grid-item strong { color: var(--text-primary); font-weight: 600; }
      `}</style>
    </>
  );
}
