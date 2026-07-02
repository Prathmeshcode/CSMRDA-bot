import "./LanguageBar.css";

function LanguageBar({ onLanguageSelect, currentLanguage }) {
  return (
    <div className="language">
      <button 
        className={currentLanguage === 'mr' ? 'active' : ''} 
        onClick={() => onLanguageSelect?.('mr')}
      >
        मराठी
      </button>
      <button 
        className={currentLanguage === 'hi' ? 'active' : ''} 
        onClick={() => onLanguageSelect?.('hi')}
      >
        हिंदी
      </button>
      <button 
        className={currentLanguage === 'en' ? 'active' : ''} 
        onClick={() => onLanguageSelect?.('en')}
      >
        English
      </button>
    </div>
  );
}

export default LanguageBar;