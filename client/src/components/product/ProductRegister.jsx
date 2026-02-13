import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { productApi, sectorApi } from "../../services/api";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";
import { useAuth } from "../../contexts/AuthContext";
import { getSectorPermissions, filterMaterialTypes } from "../../config/permissions";

export default function ProductRegister() {
  const { user } = useAuth();
  const sectorPerms = useMemo(
    () => getSectorPermissions(user?.setor_nome, user?.role),
    [user?.setor_nome, user?.role]
  );

  const allTypes = ["DN", "BN", "Base"];
  const allowedTypes = useMemo(
    () => filterMaterialTypes(allTypes, sectorPerms.allowedMaterialTypes),
    [sectorPerms.allowedMaterialTypes]
  );

  const [product, setProduct] = useState("");
  const [sector, setSector] = useState(user?.fk_cod_setor || "");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  // Atualiza campo de setor automágicamente
  useEffect(() => {
    if (user?.fk_cod_setor) setSector(user.fk_cod_setor);
  }, [user]);

  // Se só tem um tipo permitido, auto-seleciona
  useEffect(() => {
    if (allowedTypes.length === 1 && !type) {
      setType(allowedTypes[0]);
    }
  }, [allowedTypes, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await productApi.register({ referencia: product, tipo: type, setor: sector });
      setPopup({ show: true, msg: "Produto cadastrado com sucesso!" });
      setProduct("");
      setType(allowedTypes.length === 1 ? allowedTypes[0] : "");
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
        navigate("/product");
      }} />}

      <main className="form-page">
        <header className="form-page-header">
          <h1>Registrar Produto</h1>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Setor: <strong>{user?.setor_nome || 'N/A'}</strong>
          </p>
          {sectorPerms.isRestricted && sectorPerms.allowedMaterialTypes && (
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>info</span>
              Seu setor permite registrar apenas: <strong>{sectorPerms.allowedMaterialTypes.join(", ")}</strong>
            </p>
          )}
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tipo *</label>
              <div className="radio-group">
                {allowedTypes.map((t) => (
                  <label key={t} className={`radio-option ${type === t ? "radio-option--active" : ""}`}>
                    <input type="radio" name="tipo" value={t} checked={type === t}
                      onChange={(e) => setType(e.target.value)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="product">Código do Produto *</label>
              <input
                type="text" id="product" value={product} required
                onChange={(e) => {
                  const value = e.target.value.replace(/\//g, "");
                  setProduct(value);
                }}
              />
            </div>

            <div className="form-actions">
              <Link to="/product" className="btn btn-secondary">
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
