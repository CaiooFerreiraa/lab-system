import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { employeeApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeApi.list();
      setEmployees(res.data || res || []);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleDelete = async (registration) => {
    if (!confirm("Deseja excluir esse funcionário?")) return;
    setLoading(true);
    try {
      await employeeApi.remove(registration);
      setPopup({ show: true, msg: "Funcionário excluído com sucesso!" });
      fetchEmployees();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter((e) =>
    e.nome?.toLowerCase().includes(search.toLowerCase()) ||
    e.matricula?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <PageHeader
        title="Funcionários"
        searchPlaceholder="Buscar por nome ou matrícula..."
        onSearch={setSearch}
        registerPath="/employee/register"
      />

      <div className="data-grid">
        {filtered.map((emp) => (
          <div className="data-card" key={emp.matricula}>
            <div className="data-card-avatar">
              {emp.nome?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="data-card-info">
              <h3 className="data-card-title">{emp.nome}</h3>
              <span className="data-card-subtitle">{emp.matricula}</span>
              <div className="data-card-tags">
                <span className="tag">{emp.turno}</span>
                <span className="tag tag--muted">{emp.telefone}</span>
              </div>
            </div>
            <div className="data-card-actions">
              <button
                className="icon-btn"
                onClick={() => navigate(`/employee/edit/${emp.matricula}`)}
                title="Editar"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button
                className="icon-btn icon-btn--danger"
                onClick={() => handleDelete(emp.matricula)}
                title="Excluir"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">group_off</span>
            <p>Nenhum funcionário encontrado.</p>
          </div>
        )}
      </div>
    </>
  );
}
