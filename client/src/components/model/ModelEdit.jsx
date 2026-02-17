import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { modelApi, markApi, mscApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function ModelEdit() {
  const { uuid } = useParams();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [codModelo, setCodModelo] = useState(0);
  const [fkMscIdBn, setFkMscIdBn] = useState("");
  const [fkMscIdDn, setFkMscIdDn] = useState("");
  const [mscList, setMscList] = useState([]);
  const [especificacoes, setEspecificacoes] = useState([]);
  const [marks, setMarks] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [shoeTypes, setShoeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [modelRes, marksRes, typesRes, shoeRes, mscRes] = await Promise.all([
          modelApi.search(uuid),
          markApi.list(),
          markApi.listTypes(),
          markApi.listTypeShoes(),
          mscApi.list()
        ]);

        const modelo = modelRes.data || modelRes.modelo;
        if (modelo) {
          setNome(modelo.nome);
          setTipo(modelo.tipo);
          setMarca(modelo.marca);
          setCodModelo(modelo.cod_modelo);
          setFkMscIdBn(modelo.fk_msc_id_bn || "");
          setFkMscIdDn(modelo.fk_msc_id_dn || "");
          setEspecificacoes(modelo.especificacoes?.map((e) => ({
            tipo: e.tipo, valor: e.valor, variacao: e.variacao,
          })) || []);
        }

        const marksData = marksRes.data || marksRes;
        if (Array.isArray(marksData)) setMarks(marksData.map((m) => m.marca));
        setTestTypes(typesRes.data || typesRes.types || []);
        setShoeTypes(shoeRes.data || shoeRes.types || []);
        setMscList(mscRes.data || []);
      } catch (err) {
        setPopup({ show: true, msg: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uuid]);

  const addSpec = () => setEspecificacoes([...especificacoes, { tipo: "", valor: "", variacao: "" }]);
  const removeSpec = (i) => setEspecificacoes(especificacoes.filter((_, idx) => idx !== i));
  const updateSpec = (i, field, value) => {
    const clone = [...especificacoes];
    clone[i][field] = value;
    setEspecificacoes(clone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await modelApi.update({
        cod_modelo: codModelo,
        nome,
        tipo,
        marca,
        fk_msc_id_bn: fkMscIdBn,
        fk_msc_id_dn: fkMscIdDn,
        especificacoes
      });
      setPopup({ show: true, msg: "Modelo atualizado com sucesso!" });
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
          <h1>Editar Modelo</h1>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome do Modelo *</label>
              <input type="text" value={nome} required
                onChange={(e) => setNome(e.target.value.replace(/\//g, ""))} />
            </div>

            <div className="form-group">
              <label>Tipo *</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                <option value="">Selecione</option>
                {shoeTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Marca *</label>
              <select value={marca} onChange={(e) => setMarca(e.target.value)} required>
                <option value="">Selecione</option>
                {marks.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Ficha Técnica BN</label>
                <select value={fkMscIdBn} onChange={(e) => setFkMscIdBn(e.target.value)}>
                  <option value="">Nenhuma</option>
                  {mscList.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.tipo})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Ficha Técnica DN</label>
                <select value={fkMscIdDn} onChange={(e) => setFkMscIdDn(e.target.value)}>
                  <option value="">Nenhuma</option>
                  {mscList.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.tipo})</option>)}
                </select>
              </div>
            </div>

            <div className="form-section-title">
              <h3>Especificações</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={addSpec}>
                <span className="material-symbols-outlined">add</span>
                Adicionar
              </button>
            </div>

            {especificacoes.map((esp, index) => (
              <div key={index} className="dynamic-field-group dynamic-field-group--row">
                <select value={esp.tipo} onChange={(e) => updateSpec(index, "tipo", e.target.value)} required>
                  <option value="">Tipo de Teste</option>
                  {testTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
                <input type="number" placeholder="Valor" value={esp.valor}
                  onChange={(e) => updateSpec(index, "valor", e.target.value)} required />
                <input type="number" placeholder="Variação" value={esp.variacao}
                  onChange={(e) => updateSpec(index, "variacao", e.target.value)} required />
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => removeSpec(index)}>
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}

            <div className="form-actions">
              <Link to="/model" className="btn btn-secondary">
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar
              </Link>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
