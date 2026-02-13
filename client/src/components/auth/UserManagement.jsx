import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authApi, sectorApi } from "../../services/api";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [form, setForm] = useState({
    email: "",
    senha: "",
    role: "user",
    setor: "",
    matricula: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, sectorsRes] = await Promise.all([
        authApi.listUsers(),
        sectorApi.list()
      ]);
      setUsers(usersRes.data || []);
      setSectors(sectorsRes.data || []);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await authApi.register({
        email: form.email,
        senha: form.senha,
        role: form.role,
        setor: form.setor || null,
        matricula: form.matricula || null
      });
      setMessage({ text: "Usuário cadastrado com sucesso!", type: "success" });
      setForm({ email: "", senha: "", role: "user", setor: "", matricula: "" });
      setShowForm(false);
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemove = async (id, email) => {
    if (!confirm(`Tem certeza que deseja remover o usuário ${email}?`)) return;
    try {
      await authApi.removeUser(id);
      setMessage({ text: "Usuário removido.", type: "success" });
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await authApi.updateRole(id, newRole);
      setMessage({ text: "Cargo atualizado.", type: "success" });
      loadData();
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin": return "tag--danger";
      case "moderator": return "tag--info";
      default: return "tag--muted";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin": return "Admin";
      case "moderator": return "Moderador";
      default: return "Usuário";
    }
  };

  // Moderator: só pode criar 'user'
  const availableRoles = currentUser?.role === "admin"
    ? ["user", "moderator", "admin"]
    : ["user"];

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: "50vh" }}>
        <div className="loading-spinner" />
        <span>Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="form-page" style={{ maxWidth: "900px" }}>
      <div className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">
            <span className="material-symbols-outlined" style={{ fontSize: "28px", verticalAlign: "middle", marginRight: "8px" }}>
              manage_accounts
            </span>
            Gerenciar Usuários
          </h1>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <span className="material-symbols-outlined">
              {showForm ? "close" : "person_add"}
            </span>
            {showForm ? "Cancelar" : "Novo Usuário"}
          </button>
        </div>
      </div>

      {/* Mensagem */}
      {message.text && (
        <div className={`user-mgmt-message user-mgmt-message--${message.type}`}>
          <span className="material-symbols-outlined">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          {message.text}
          <button className="user-mgmt-message-close" onClick={() => setMessage({ text: "", type: "" })}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Formulário de Cadastro */}
      {showForm && (
        <div className="form-container" style={{ marginBottom: "24px", animation: "slideDown 0.3s ease-out" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "6px" }}>
              person_add
            </span>
            Cadastrar Novo Usuário
          </h2>
          <form onSubmit={handleRegister}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@empresa.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Senha *</label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Cargo</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{getRoleLabel(r)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Setor</label>
                <select
                  value={form.setor}
                  onChange={(e) => setForm({ ...form, setor: e.target.value })}
                  disabled={!!form.matricula}
                >
                  <option value="">
                    {form.matricula ? "Herdado do Funcionário" : "Sem setor (acesso total)"}
                  </option>
                  {!form.matricula && sectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Matrícula (opcional)</label>
                <input
                  type="text"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  placeholder="Vincular a funcionário"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="btn btn-primary" type="submit" disabled={formLoading}>
                {formLoading ? "Cadastrando..." : "Cadastrar Usuário"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="user-mgmt-table-wrapper">
        <table className="user-mgmt-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Cargo</th>
              <th>Setor</th>
              <th>Data Cadastro</th>
              {currentUser?.role === "admin" && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.id === currentUser?.id ? "user-mgmt-current" : ""}>
                <td>
                  <div className="user-mgmt-user-cell">
                    <div className="user-mgmt-avatar">
                      {(u.nome || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="user-mgmt-name">{u.nome ? `${u.nome} ${u.sobrenome || ""}` : u.email}</div>
                      <div className="user-mgmt-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {currentUser?.role === "admin" && u.id !== currentUser?.id ? (
                    <select
                      className="user-mgmt-role-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="user">Usuário</option>
                      <option value="moderator">Moderador</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`tag ${getRoleBadgeClass(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  )}
                </td>
                <td>
                  <span className="user-mgmt-sector">
                    {u.setor_nome || "Todos"}
                  </span>
                </td>
                <td>
                  <span className="user-mgmt-date">
                    {u.data_criacao ? new Date(u.data_criacao).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </td>
                {currentUser?.role === "admin" && (
                  <td>
                    {u.id !== currentUser?.id && (
                      <button
                        className="icon-btn icon-btn--danger"
                        title="Remover"
                        onClick={() => handleRemove(u.id, u.email)}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
