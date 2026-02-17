export default function PopUp({ show, msg, onClose }) {
  if (!show) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="popup-close material-symbols-outlined"
          onClick={onClose}
        >
          close
        </button>
        <div className="popup-icon material-symbols-outlined">
          {msg?.toLowerCase().includes("sucesso") ? "check_circle" : "info"}
        </div>
        <p className="popup-message">{msg}</p>
      </div>
    </div>
  );
}
