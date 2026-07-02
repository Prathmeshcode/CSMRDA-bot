import "./App.css";
import PhoneFrame from "./components/PhoneFrame";

function App() {

  return (
    <div className="app-container">
      <div className="app-content">
        <PhoneFrame />
      </div>
      <footer className="footer">
        <p>Copyright © 2026. All Rights Reserved.</p>
        <p>Designed & Developed by KalaGoon Software Solutions Pvt. Ltd.</p>
      </footer>
    </div>
  );
}

export default App;