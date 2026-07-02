import "./Header.css";
import { FaArrowLeft, FaVideo, FaPhoneAlt, FaEllipsisV } from "react-icons/fa";

function Header() {
  return (
    <div className="header">
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
          <span className="status-online" style={{ textAlign: 'left' }}>online</span>
        </div>
      </div>

      <div className="icons">
        <FaVideo className="header-icon" />
        <FaPhoneAlt className="header-icon" />
        <FaEllipsisV className="header-icon" />
      </div>
    </div>
  );
}

export default Header;