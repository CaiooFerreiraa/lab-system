import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../services/api";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import PopUp from "../common/PopUp";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.list();
      setProducts(res.data || res || []);
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (product) => {
    if (!confirm("Deseja excluir esse produto?")) return;
    setLoading(true);
    try {
      await productApi.remove({ uuid: product.referencia, setor: product.setor });
      setPopup({ show: true, msg: "Produto excluído com sucesso!" });
      fetchProducts();
    } catch (err) {
      setPopup({ show: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) =>
    p.referencia?.toLowerCase().includes(search.toLowerCase()) ||
    p.setor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {loading && <Loader />}
      {popup.show && <PopUp msg={popup.msg} onClose={() => setPopup({ show: false, msg: "" })} />}

      <PageHeader
        title="Produtos"
        searchPlaceholder="Buscar por referência ou setor..."
        onSearch={setSearch}
        registerPath="/product/register"
      />

      <div className="data-grid">
        {filtered.map((product, i) => (
          <div className="data-card" key={i}>
            <div className="data-card-avatar data-card-avatar--product">
              {product.tipo?.[0] || "P"}
            </div>
            <div className="data-card-info">
              <h3 className="data-card-title">{product.referencia}</h3>
              <div className="data-card-tags">
                <span className="tag">{product.tipo}</span>
                <span className="tag tag--muted">{product.setor}</span>
              </div>
            </div>
            <div className="data-card-actions">
              <button
                className="icon-btn"
                onClick={() => navigate(`/product/edit/${product.referencia}`)}
                title="Editar"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button
                className="icon-btn icon-btn--danger"
                onClick={() => handleDelete(product)}
                title="Excluir"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">inventory_2</span>
            <p>Nenhum produto encontrado.</p>
          </div>
        )}
      </div>
    </>
  );
}
