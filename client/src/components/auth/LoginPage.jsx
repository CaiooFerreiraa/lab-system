import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../services/api";
import Logo from "../common/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authApi.login({ email, senha });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-effect" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Logo size={64} className="login-logo-svg" />
          </div>
          <h1 className="login-title">Lab System</h1>
          <p className="login-subtitle">Sistema de Gerenciamento Laboratorial</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">Email</label>
            <div className="login-input-wrapper">
              <span className="material-symbols-outlined login-input-icon">mail</span>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="senha">Senha</label>
            <div className="login-input-wrapper">
              <span className="material-symbols-outlined login-input-icon">lock</span>
              <input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div className="login-btn-loading">
                <div className="login-spinner" />
                Entrando...
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>shield</span>
          Acesso restrito a funcionários autorizados
        </div>
      </div>
    </div>
  );
}
