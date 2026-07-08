import { useState, useEffect, useRef } from "react";
import "./Header.css";
import { FaArrowLeft, FaVideo, FaPhoneAlt, FaEllipsisV } from "react-icons/fa";

function Header() {
  const [status, setStatus] = useState("online");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleStatusChange = (e) => {
      if (e.detail && e.detail.status) {
        setStatus(e.detail.status);
      }
    };
    window.addEventListener("chatbot-status-change", handleStatusChange);
    
    // Close dropdown on click outside
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("chatbot-status-change", handleStatusChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="header" style={{ position: 'relative' }}>
      <div className="header-left">
        <FaArrowLeft className="back-arrow" />
        <div className="profile-container">
          <img
            src="/logo.png"
            className="profile"
            alt="CSMRDA Vikas Mitra"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="avatar-fallback" style={{ display: 'none' }}>
            VM
          </div>
        </div>

        <div className="Wa-title-verified-container" style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px', minWidth: 0, flex: 1, textAlign: 'left' }}>
          <div className="Wa-title-name-row" style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, textAlign: 'left' }}>
              CSMRDA विकास मित्र
            </h3>
            <svg className="verified-badge" viewBox="0 0 24 24" width="16" height="16" style={{ marginLeft: '4px', fill: '#20a0f0', display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <span 
            className={`status-online ${status === "typing..." ? "typing" : ""}`} 
            style={{ textAlign: 'left', transition: 'all 0.2s' }}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="icons" ref={menuRef}>
        <FaVideo className="header-icon" />
        <FaPhoneAlt className="header-icon" />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FaEllipsisV className="header-icon" onClick={() => setMenuOpen(!menuOpen)} />
          {menuOpen && (
            <div className="header-dropdown">
              <div className="dropdown-item" onClick={() => { window.resetChatbotSession?.(); setMenuOpen(false); }}>
                🔄 Reset Session
              </div>
              <div className="dropdown-item" onClick={() => { window.sendChatMessage?.("mr"); setMenuOpen(false); }}>
                🗣️ मराठी (Marathi)
              </div>
              <div className="dropdown-item" onClick={() => { window.sendChatMessage?.("hi"); setMenuOpen(false); }}>
                🗣️ हिन्दी (Hindi)
              </div>
              <div className="dropdown-item" onClick={() => { window.sendChatMessage?.("en"); setMenuOpen(false); }}>
                🗣️ English
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;