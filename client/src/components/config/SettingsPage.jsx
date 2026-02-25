import { useState, useEffect } from "react";
import { maquinaApi, enumApi, notificacaoApi, sectorApi, request } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("machines");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  const [machines, setMachines] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [emails, setEmails] = useState([]);
  const [allConfigs, setAllConfigs] = useState([]);

  // Form states for Machine
  const [newMachine, setNewMachine] = useState({ nome: "", descricao: "", fk_cod_setor: "", status: "Ativo" });

  // Form states for Config (Machine + Test Type)
  const [newConfig, setNewConfig] = useState({ fk_maquina_id: "", fk_tipo_cod_tipo: "", tempo_estimado_segundos: 60 });

  // Form states for Email
  const [newEmail, setNewEmail] = useState({ email: "", tipo: "fallback_atraso", nome_contato: "" });

  // Form states for SMTP
  const [smtp, setSmtp] = useState({ host: "", port: 587, user: "", pass: "", from: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, sRes, tRes, eRes, smtpRes, cRes] = await Promise.all([
        maquinaApi.list(),
        sectorApi.list(),
        enumApi.typesTest(),
        notificacaoApi.listEmails(),
        request("/config/smtp"),
        maquinaApi.listAllConfigs()
      ]);
      setMachines(mRes.data || []);
      setSectors(sRes.data || []);
      setTestTypes(tRes.data || []);
      setEmails(eRes.data || []);
      setSmtp(smtpRes.data || { host: "smtp.gmail.com", port: 587, user: "", pass: "", from: "" });
      setAllConfigs(cRes.data || []);
    } catch (err) {
      setPopup({ show: true, msg: "Erro ao carregar dados de configuração." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    try {
      // Garantir tipos corretos
      const payload = {
        ...newMachine,
        fk_cod_setor: newMachine.fk_cod_setor ? parseInt(newMachine.fk_cod_setor) : null
      };
      await maquinaApi.register(payload);
      setPopup({ show: true, msg: "Máquina cadastrada!" });
      setNewMachine({ nome: "", descricao: "", fk_cod_setor: "", status: "Ativo" });
      fetchData();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    }
  };

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fk_maquina_id: parseInt(newConfig.fk_maquina_id),
        fk_tipo_cod_tipo: parseInt(newConfig.fk_tipo_cod_tipo),
        tempo_estimado_segundos: parseInt(newConfig.tempo_estimado_segundos)
      };
      await maquinaApi.saveConfig(payload);
      setPopup({ show: true, msg: "Vínculo de tempo salvo!" });
      fetchData();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    }
  };

  const handleCreateEmail = async (e) => {
    e.preventDefault();
    try {
      await notificacaoApi.registerEmail(newEmail);
      setPopup({ show: true, msg: "Email cadastrado!" });
      setNewEmail({ email: "", tipo: "fallback_atraso", nome_contato: "" });
      fetchData();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    }
  };

  const handleDeleteMachine = async (id) => {
    if (!confirm("Excluir máquina? Isso removerá seus vínculos de tempo.")) return;
    try {
      await maquinaApi.remove(id);
      fetchData();
    } catch (err) { setPopup({ show: true, msg: err.message }); }
  };

  const handleDeleteConfig = async (id) => {
    if (!confirm("Remover este vínculo de tempo?")) return;
    try {
      await maquinaApi.removeConfig(id);
      fetchData();
    } catch (err) { setPopup({ show: true, msg: err.message }); }
  };

  const handleDeleteEmail = async (id) => {
    if (!confirm("Remover este email de contato?")) return;
    try {
      await notificacaoApi.removeEmail(id);
      fetchData();
    } catch (err) { setPopup({ show: true, msg: err.message }); }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    try {
      await request("/config/smtp", { method: "POST", body: JSON.stringify(smtp) });
      setPopup({ show: true, msg: "Configuração de SMTP salva!" });
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    }
  };

  return (
    <main className="app-content-inner">
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <header className="page-header">
        <div className="header-info">
          <h1 className="page-title">Configurações Avançadas</h1>
          <p className="text-secondary">Gerencie infraestrutura, SLAs e automação</p>
        </div>
      </header>

      <div className="tabs-container">
        <div className="tabs-header">
          <button className={`tab-btn ${activeTab === 'machines' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('machines')}>
            <span className="material-symbols-outlined">precision_manufacturing</span>
            Máquinas
          </button>
          <button className={`tab-btn ${activeTab === 'timings' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('timings')}>
            <span className="material-symbols-outlined">timer</span>
            Tempos de Teste
          </button>
          <button className={`tab-btn ${activeTab === 'notifications' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span className="material-symbols-outlined">mail</span>
            Notificações
          </button>
          <button className={`tab-btn ${activeTab === 'smtp' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('smtp')}>
            <span className="material-symbols-outlined">forward_to_inbox</span>
            Servidor SMTP
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'machines' && (
            <div className="settings-layout">
              <div className="card-custom form-card">
                <div className="card-header">
                  <span className="material-symbols-outlined header-icon">add_circle</span>
                  <h3>Nova Máquina</h3>
                </div>
                <form onSubmit={handleCreateMachine} className="form-settings">
                  <div className="form-group">
                    <label>Nome da Máquina</label>
                    <input type="text" className="filter-input" value={newMachine.nome} onChange={e => setNewMachine({ ...newMachine, nome: e.target.value })} required placeholder="Ex: Dinamômetro 01" />
                  </div>
                  <div className="form-group">
                    <label>Setor</label>
                    <select className="filter-input" value={newMachine.fk_cod_setor} onChange={e => setNewMachine({ ...newMachine, fk_cod_setor: e.target.value })}>
                      <option value="">Opcional (Uso Geral)</option>
                      {sectors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Descrição</label>
                    <textarea className="filter-input" value={newMachine.descricao} onChange={e => setNewMachine({ ...newMachine, descricao: e.target.value })} rows={3} placeholder="Detalhes técnicos ou localização..." />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">
                    <span className="material-symbols-outlined">save</span>
                    Cadastrar Máquina
                  </button>
                </form>
              </div>

              <div className="card-custom table-card">
                <div className="card-header">
                  <span className="material-symbols-outlined header-icon">list</span>
                  <h3>Parque de Máquinas</h3>
                </div>
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Máquina</th>
                        <th>Setor</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machines.length === 0 ? (
                        <tr><td colSpan="4" className="empty-row">Nenhuma máquina cadastrada</td></tr>
                      ) : (
                        machines.map(m => (
                          <tr key={m.id}>
                            <td>
                              <div className="machine-info">
                                <strong>{m.nome}</strong>
                                <span className="desc-text">{m.descricao || "Sem descrição"}</span>
                              </div>
                            </td>
                            <td>
                              <span className="sector-badge">{m.setor_nome || "Geral"}</span>
                            </td>
                            <td>
                              <span className={`tag ${m.status === 'Ativo' ? 'tag--success' : m.status === 'Manutenção' ? 'tag--warning' : 'tag--muted'}`}>
                                {m.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="icon-btn icon-btn--danger" onClick={() => handleDeleteMachine(m.id)} title="Excluir">
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timings' && (
            <div className="settings-layout">
              <div className="card-custom form-card">
                <div className="card-header">
                  <span className="material-symbols-outlined header-icon">timer</span>
                  <h3>Definir SLAs</h3>
                </div>
                <form onSubmit={handleCreateConfig} className="form-settings">
                  <div className="form-group">
                    <label>Máquina</label>
                    <select className="filter-input" value={newConfig.fk_maquina_id} onChange={e => setNewConfig({ ...newConfig, fk_maquina_id: e.target.value })} required>
                      <option value="">Selecione a máquina...</option>
                      {machines.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo de Teste</label>
                    <select className="filter-input" value={newConfig.fk_tipo_cod_tipo} onChange={e => setNewConfig({ ...newConfig, fk_tipo_cod_tipo: e.target.value })} required>
                      <option value="">Selecione o tipo de teste...</option>
                      {testTypes.map(t => <option key={t.cod_tipo} value={t.cod_tipo}>{t.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tempo Estimado (Segundos)</label>
                    <div className="input-with-icon">
                      <input type="number" className="filter-input" value={newConfig.tempo_estimado_segundos} onChange={e => setNewConfig({ ...newConfig, tempo_estimado_segundos: e.target.value })} required min="1" />
                      <span className="input-suffix">seg</span>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">
                    <span className="material-symbols-outlined">link</span>
                    Vincular Tempo
                  </button>
                </form>
              </div>

              <div className="card-custom table-card">
                <div className="card-header">
                  <span className="material-symbols-outlined header-icon">hub</span>
                  <h3>Matriz de Tempos (SLA)</h3>
                </div>
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Máquina</th>
                        <th>Tipo de Teste</th>
                        <th>SLA (Tempo)</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allConfigs.length === 0 ? (
                        <tr><td colSpan="4" className="empty-row">Nenhum vínculo de tempo definido</td></tr>
                      ) : (
                        allConfigs.map(c => (
                          <tr key={c.id}>
                            <td><strong>{c.maquina_nome}</strong></td>
                            <td>{c.tipo_nome}</td>
                            <td>
                              <div className="sla-time">
                                <span className="material-symbols-outlined">schedule</span>
                                {c.tempo_estimado_segundos}s
                                <small>({(c.tempo_estimado_segundos / 60).toFixed(1)} min)</small>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="icon-btn icon-btn--danger" onClick={() => handleDeleteConfig(c.id)} title="Excluir">
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-layout">
              <div className="card-custom form-card">
                <div className="card-header">
                  <span className="material-symbols-outlined header-icon">person_add</span>
                  <h3>Novo Contato</h3>
                </div>
                <form onSubmit={handleCreateEmail} className="form-settings">
                  <div className="form-group">
                    <label>Email do Destinatário</label>
                    <input type="email" className="filter-input" value={newEmail.email} onChange={e => setNewEmail({ ...newEmail, email: e.target.value })} required placeholder="responsavel@empresa.com" />
                  </div>
                  <div className="form-group">
                    <label>Nome do Contato</label>
                    <input type="text" className="filter-input" value={newEmail.nome_contato} onChange={e => setNewEmail({ ...newEmail, nome_contato: e.target.value })} placeholder="Ex: João Laboratório" />
                  </div>
                  <div className="form-group">
                    <label>Finalidade das Notificações</label>
                    <select className="filter-input" value={newEmail.tipo} onChange={e => setNewEmail({ ...newEmail, tipo: e.target.value })}>
                      <option value="fallback_atraso">⚠️ Alertas de Atraso (SLA)</option>
                      <option value="relatorio_diario">📊 Relatório Gerencial (Diário)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">
                    <span className="material-symbols-outlined">add</span>
                    Adicionar Contato
                  </button>
                </form>
              </div>

              <div className="card-custom table-card">
                <div className="card-header">
                  <span className="material-symbols-outlined header-icon">contact_mail</span>
                  <h3>Lista de Destinatários</h3>
                </div>
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Contato</th>
                        <th>Email</th>
                        <th>Finalidade</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emails.length === 0 ? (
                        <tr><td colSpan="4" className="empty-row">Nenhum email cadastrado</td></tr>
                      ) : (
                        emails.map(e => (
                          <tr key={e.id}>
                            <td><strong>{e.nome_contato || "-"}</strong></td>
                            <td>{e.email}</td>
                            <td>
                              <span className={`tag ${e.tipo === 'fallback_atraso' ? 'tag--warning' : 'tag--primary'}`} style={e.tipo === 'relatorio_diario' ? { background: 'rgba(5, 150, 105, 0.1)', color: 'var(--accent-primary)' } : {}}>
                                {e.tipo === 'fallback_atraso' ? '⚠️ Atrasos' : '📊 Relatório'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="icon-btn icon-btn--danger" onClick={() => handleDeleteEmail(e.id)} title="Excluir">
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'smtp' && (
            <div className="smtp-container">
              <div className="card-custom smtp-card">
                <div className="card-header">
                  <span className="material-symbols-outlined header-icon">dns</span>
                  <h3>Configuração do Servidor SMTP</h3>
                </div>
                <p className="text-secondary" style={{ marginBottom: '24px' }}>
                  Credenciais usadas pelo sistema para enviar e-mails automatizados.
                </p>
                <form onSubmit={handleSaveSmtp} className="form-settings">
                  <div className="form-row">
                    <div className="form-group flex-2">
                      <label>Servidor (Host)</label>
                      <input type="text" className="filter-input" value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.gmail.com" required />
                    </div>
                    <div className="form-group flex-1">
                      <label>Porta</label>
                      <input type="number" className="filter-input" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: parseInt(e.target.value) })} placeholder="587" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Usuário / Email</label>
                    <input type="email" className="filter-input" value={smtp.user} onChange={e => setSmtp({ ...smtp, user: e.target.value })} placeholder="seu-email@exemplo.com" required />
                  </div>
                  <div className="form-group">
                    <label>Senha / Token de App</label>
                    <div className="password-input-wrapper">
                      <input type="password" className="filter-input" value={smtp.pass} onChange={e => setSmtp({ ...smtp, pass: e.target.value })} placeholder="••••••••••••" required />
                    </div>
                    <small className="hint-text">No Gmail, utilize uma "Senha de App".</small>
                  </div>
                  <div className="form-group">
                    <label>Nome para Exibição (From)</label>
                    <input type="text" className="filter-input" value={smtp.from} onChange={e => setSmtp({ ...smtp, from: e.target.value })} placeholder="Lab System <noreply@empresa.com>" />
                  </div>

                  <div className="info-box accent-box">
                    <span className="material-symbols-outlined">info</span>
                    <p>Ao salvar, o serviço de e-mail será reiniciado automaticamente com as novas credenciais.</p>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full">
                    <span className="material-symbols-outlined">sync_alt</span>
                    Atualizar Servidor SMTP
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .settings-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 24px;
          align-items: start;
        }

        .card-custom {
          background: var(--bg-card);
          padding: 24px;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-md);
          animation: fadeIn 0.3s ease;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .header-icon {
          color: var(--accent-primary);
          font-size: 24px;
        }

        h3 { 
          margin: 0; 
          font-size: 1.1rem; 
          font-weight: 600;
          color: var(--text-primary); 
        }

        .form-settings { 
          display: flex; 
          flex-direction: column; 
          gap: 18px; 
        }

        .btn-full {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-weight: 600;
          margin-top: 10px;
        }

        .tabs-header { 
          display: flex; 
          gap: 8px; 
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .tab-btn { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          padding: 14px 24px; 
          border-radius: 12px 12px 0 0; 
          color: var(--text-secondary); 
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
          font-weight: 500;
        }

        .tab-btn:hover { 
          background: rgba(255,255,255,0.03); 
          color: var(--text-primary); 
        }

        .tab-btn--active { 
          color: var(--accent-primary); 
          border-bottom-color: var(--accent-primary);
          background: rgba(16, 185, 129, 0.08);
        }

        .machine-info strong {
          display: block;
          color: var(--text-primary);
          font-size: 1rem;
          margin-bottom: 2px;
        }

        .desc-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .sector-badge {
          font-size: 0.7rem;
          padding: 4px 12px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 20px;
          color: var(--accent-primary);
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
        }

        .sla-time {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent-primary);
          font-weight: 700;
          font-size: 1.05rem;
        }

        .sla-time small {
          color: var(--text-muted);
          font-weight: 400;
          font-size: 0.8rem;
        }

        .tag {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .tag--success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .tag--warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .tag--muted {
          background: rgba(156, 163, 175, 0.1);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.2);
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.2s;
          background: transparent;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: scale(1.05);
        }

        .icon-btn--danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .empty-row {
          text-align: center;
          padding: 60px 0;
          color: var(--text-muted);
          font-style: italic;
        }

        .custom-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 8px;
        }

        .custom-table th {
          text-align: left;
          padding: 12px 16px;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--border-color);
        }

        .custom-table td {
          padding: 16px;
          vertical-align: middle;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s ease;
        }

        .custom-table tr:last-child td {
          border-bottom: none;
        }

        .custom-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }

        .smtp-container {
          display: flex;
          justify-content: center;
          padding: 40px 0;
        }

        .smtp-card {
          width: 100%;
          max-width: 600px;
        }

        .info-box {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-top: 8px;
        }

        .accent-box {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--accent-primary);
        }

        .input-with-icon {
          position: relative;
        }

        .input-suffix {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
