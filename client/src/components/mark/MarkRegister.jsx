import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { markApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function MarkRegister() {
  const [methods, setMethods] = useState([{ id: Date.now(), name: "", description: "" }]);
  const [mark, setMark] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);

    const dataMark = {
      marca: mark,
      metodos: methods.map(({ name, description }) => ({ name, description })),
    };

    try {
      await markApi.register(dataMark);
      setPopup({ show: true, msg: "Marca cadastrada com sucesso!" });
      setMark("");
      setMethods([{ id: Date.now(), name: "", description: "" }]);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const addMethod = () => {
    setMethods((prev) => [...prev, { id: Date.now(), name: "", description: "" }]);
  };

  const removeMethod = (id) => {
    if (confirm("Deseja remover este método?")) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleChange = (id, field, value) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => {
        setPopup({ show: false, msg: "" });
        navigate("/mark");
      }} />}

      <main className="form-page">
        <header className="form-page-header">
          <h1>Registrar Marca</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="mark">Nome da Marca *</label>
              <input
                type="text" id="mark" value={mark} required
                onChange={(e) => {
                  const value = e.target.value.replace(/\//g, "");
                  setMark(value);
                }}
              />
            </div>

            <div className="form-section-title">
              <h3>Métodos</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={addMethod}>
                <span className="material-symbols-outlined">add</span>
                Adicionar Método
              </button>
            </div>

            {methods.map((method, index) => (
              <div key={method.id} className="dynamic-field-group">
                <div className="form-group">
                  <label>Método {index + 1}</label>
                  <input
                    type="text" value={method.name}
                    onChange={(e) => handleChange(method.id, "name", e.target.value)}
                    placeholder="Nome do método"
                  />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea
                    value={method.description}
                    onChange={(e) => handleChange(method.id, "description", e.target.value)}
                    placeholder="Descrição do método..."
                  />
                </div>
                <button
                  type="button" className="icon-btn icon-btn--danger"
                  onClick={() => removeMethod(method.id)}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}

            <div className="form-actions">
              <Link to="/mark" className="btn btn-secondary">
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
