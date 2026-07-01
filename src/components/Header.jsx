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

        <div className="title">
          <h3>CSMRDA Vikas Mitra</h3>
          <span className="status-online">online</span>
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