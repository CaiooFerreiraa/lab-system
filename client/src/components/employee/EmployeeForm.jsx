import { useState } from "react";
import { Link } from "react-router-dom";
import { employeeApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function EmployeeForm({ initialData, isEdit }) {
  const [user, setUser] = useState(initialData || {
    name: "", lastName: "", registration: "", phoneNumber: "",
  });
  const [shift, setShift] = useState(initialData?.shift || "");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEdit && !confirm("Deseja atualizar esse funcionário?")) return;

    setLoading(true);
    try {
      const data = { ...user, shift };
      if (isEdit) {
        await employeeApi.update(data);
        setPopup({ show: true, msg: "Funcionário atualizado com sucesso!" });
      } else {
        await employeeApi.register(data);
        setPopup({ show: true, msg: "Funcionário cadastrado com sucesso!" });
        setUser({ name: "", lastName: "", registration: "", phoneNumber: "" });
        setShift("");
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
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <main className="form-page">
        <header className="form-page-header">
          <h1>{isEdit ? "Editar Funcionário" : "Cadastrar Funcionário"}</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nome *</label>
                <input
                  required type="text" name="name" id="name"
                  value={user.name} onChange={handleChange}
                  pattern="[^/]*" title="Não pode conter /"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Sobrenome *</label>
                <input
                  required type="text" name="lastName" id="lastName"
                  value={user.lastName} onChange={handleChange}
                  pattern="[^/]*" title="Não pode conter /"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="registration">Matrícula *</label>
              <input
                required type="text" name="registration" id="registration"
                value={user.registration}
                readOnly={isEdit}
                onChange={(e) => {
                  const value = e.target.value.replace(/\//g, "");
                  handleChange({ target: { name: "registration", value } });
                }}
              />
            </div>

            <div className="form-group">
              <label>Turno *</label>
              <div className="radio-group">
                {["Turno A", "Turno B", "Turno C"].map((t) => (
                  <label key={t} className={`radio-option ${shift === t ? "radio-option--active" : ""}`}>
                    <input
                      type="radio" name="shift" value={t}
                      checked={shift === t}
                      onChange={(e) => setShift(e.target.value)}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Telefone *</label>
              <input
                type="tel" name="phoneNumber" id="phoneNumber"
                value={user.phoneNumber} onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <Link to="/employee" className="btn btn-secondary">
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : isEdit ? "Atualizar" : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
