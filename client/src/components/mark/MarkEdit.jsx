import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { markApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function MarkEdit() {
  const { mark } = useParams();
  const [markData, setMarkData] = useState({ marca: "", metodo: [] });
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    const fetchMark = async () => {
      setLoading(true);
      try {
        const res = await markApi.getOne(mark);
        const data = res.data || res;
        setMarkData(Array.isArray(data) ? data[0] : data);
      } catch (err) {
        setPopup({ show: true, msg: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchMark();
  }, [mark]);

  const handleChangeMethod = (index, field, value) => {
    setMarkData((prev) => {
      const updated = [...prev.metodo];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, metodo: updated };
    });
  };

  const addMethod = () => {
    setMarkData((prev) => ({
      ...prev,
      metodo: [...prev.metodo, { nome: "", descricao: "" }],
    }));
  };

  const handleDeleteMethod = async (cod_metodo) => {
    if (!cod_metodo) {
      setMarkData((prev) => ({
        ...prev,
        metodo: prev.metodo.slice(0, -1),
      }));
      return;
    }

    if (!confirm("Deseja realmente deletar este método?")) return;

    setLoading(true);
    try {
      await markApi.removeMethod(cod_metodo);
      setMarkData((prev) => ({
        ...prev,
        metodo: prev.metodo.filter((m) => m.cod_metodo !== cod_metodo),
      }));
      setPopup({ show: true, msg: "Método deletado com sucesso!" });
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    try {
      await markApi.update(markData);
      setPopup({ show: true, msg: "Marca atualizada com sucesso!" });
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
          <h1>Editar Marca: {mark}</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Marca *</label>
              <input
                type="text" value={markData.marca || ""} required
                onChange={(e) => {
                  const value = e.target.value.replace(/\//g, "");
                  setMarkData({ ...markData, marca: value });
                }}
              />
            </div>

            <div className="form-section-title">
              <h3>Métodos</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={addMethod}>
                <span className="material-symbols-outlined">add</span>
                Adicionar
              </button>
            </div>

            {markData.metodo.map((met, index) => (
              <div key={index} className="dynamic-field-group">
                <div className="form-group">
                  <label>Método {index + 1}</label>
                  <input
                    type="text" placeholder="Nome do método"
                    value={met.nome || ""}
                    onChange={(e) => handleChangeMethod(index, "nome", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea
                    placeholder="Descrição"
                    value={met.descricao || ""}
                    onChange={(e) => handleChangeMethod(index, "descricao", e.target.value)}
                  />
                </div>
                <button
                  type="button" className="icon-btn icon-btn--danger"
                  onClick={() => handleDeleteMethod(met.cod_metodo)}
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
              <button type="submit" className="btn btn-primary">Atualizar</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
