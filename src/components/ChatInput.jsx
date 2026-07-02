import React from "react";
import { FaPaperPlane } from "react-icons/fa";
import "./ChatInput.css";

function ChatInput({ value, onChange, onSubmit, disabled, placeholder }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !disabled) {
      onSubmit();
    }
  };

  return (
    <div className="chat-input-container">
      <input
        type="text"
        placeholder={placeholder || "Type your question..."}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button onClick={onSubmit} disabled={disabled || !value.trim()}>
        <FaPaperPlane />
      </button>
    </div>
  );
}

export default ChatInput;
