import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function PageHeader({ title, searchPlaceholder, onSearch, registerPath }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    onSearch?.(value);
  };

  return (
    <header className="page-header">
      <div className="page-header-top">
        <h1 className="page-title">{title}</h1>
        {registerPath && (
          <Link to={registerPath} className="btn btn-primary">
            <span className="material-symbols-outlined">add</span>
            Cadastrar
          </Link>
        )}
      </div>

      {onSearch && (
        <div className="search-container">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder={searchPlaceholder || "Pesquisar..."}
            value={search}
            onChange={handleSearch}
          />
        </div>
      )}
    </header>
  );
}
