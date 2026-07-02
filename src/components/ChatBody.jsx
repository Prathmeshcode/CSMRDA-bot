import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "./ChatBody.css";

function ChatBody({ messages, handleButtonClick, handleLinkClick, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="chat-body">
      {messages.map((msg, index) => (
        <MessageBubble
          key={index}
          message={msg}
          onButtonClick={handleButtonClick}
          onLinkClick={handleLinkClick}
        />
      ))}
      
      {isLoading && (
        <div className="message-wrapper bot-wrapper">
          <div className="loading-bubble">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatBody;