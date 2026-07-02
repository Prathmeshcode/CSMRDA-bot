import "./App.css";
import PhoneFrame from "./components/PhoneFrame";

function App() {
  return (
    <div className="app-container">
      <header className="page-header" style={{ color: 'white', marginTop: '10px', marginBottom: '25px', textAlign: 'center', width: '100%' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '600', color: 'white', letterSpacing: '0.4px', fontFamily: '"Segoe UI", sans-serif' }}>CSMRDA · विकास मित्र</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', fontWeight: 'normal', fontFamily: '"Segoe UI", sans-serif' }}>
          Citizen WhatsApp Assistant — concept demo ·{' '}
          <a href="https://kalagoon.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s ease' }}>
            KalaGoon Software Solutions Pvt. Ltd.
          </a>
        </p>
      </header>

      <div className="app-content">
        <PhoneFrame />
      </div>
      
      <footer className="footer">
        <p>Copyright © 2026. All Rights Reserved.</p>
        <p>
          Designed & Developed by{' '}
          <a href="https://kalagoon.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s ease' }}>
            KalaGoon Software Solutions Pvt. Ltd.
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;