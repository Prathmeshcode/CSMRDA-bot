import React, { useState } from "react";
import "./PhoneFrame.css";
import Header from "./Header";
import LanguageBar from "./LanguageBar";
import ChatContainer from "./ChatContainer";

function PhoneFrame() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
  };

  return (
    <div className="phone">
      <div className="notch"></div>

      <Header />

      <LanguageBar 
        onLanguageSelect={handleLanguageSelect} 
        currentLanguage={selectedLanguage} 
      />

      <ChatContainer 
        key={selectedLanguage} 
        initialLanguage={selectedLanguage} 
      />
    </div>
  );
}

export default PhoneFrame;