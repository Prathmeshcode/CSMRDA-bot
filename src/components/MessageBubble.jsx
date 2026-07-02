import React from "react";
import "./MessageBubble.css";

const renderLinks = (text, onLinkClick) => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, idx) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith("www.") ? `https://${part}` : part;
      return (
        <a
          key={idx}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            if (onLinkClick) {
              onLinkClick(href);
            }
          }}
          className="message-link"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const renderFormattedText = (text, onLinkClick) => {
  if (!text) return null;

  const boldRegex = /(\*\*[^*]+\*\*)/g;
  const parts = text.split(boldRegex);

  return parts.map((part, index) => {
    if (boldRegex.test(part)) {
      const content = part.slice(2, -2);
      return <strong key={index}>{renderLinks(content, onLinkClick)}</strong>;
    }
    return <React.Fragment key={index}>{renderLinks(part, onLinkClick)}</React.Fragment>;
  });
};

function MessageBubble({ message, onButtonClick, onLinkClick }) {
  const isUser = message.sender === "user";

  if (isUser) {
    return (
      <div className="message-wrapper user-wrapper">
        <div className="user-bubble">
          <div className="message-text">{renderFormattedText(message.text, onLinkClick)}</div>
          <span className="message-time">{message.time}</span>
        </div>
      </div>
    );
  }

  // Bot message rendering
  const showTitle = message.isJson && message.title;
  const showSubtitle = message.isJson && message.subtitle;
  const buttons = message.isJson ? message.buttons : null;

  return (
    <div className="message-wrapper bot-wrapper">
      <div className="bot-bubble">
        <div className="message-text">
          {showTitle && <div className="bot-message-title">{renderFormattedText(message.title, onLinkClick)}</div>}
          {showSubtitle && <div className="bot-message-subtitle">{renderFormattedText(message.subtitle, onLinkClick)}</div>}
          
          {message.items && message.items.length > 0 ? (
            <div className="bot-items-container">
              {message.items.map((item, idx) => (
                <div key={idx} className="bot-item">
                  <div className="bot-item-text">{renderFormattedText(item.text, onLinkClick)}</div>
                  {item.link && (
                    <div className="bot-item-link">
                      <a
                        href={item.link}
                        onClick={(e) => {
                          e.preventDefault();
                          if (onLinkClick) {
                            onLinkClick(item.link);
                          }
                        }}
                        className="message-link"
                      >
                        {item.link}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            renderFormattedText(message.text, onLinkClick)
          )}

          {message.link && (
            <div className="bot-direct-link-container">
              <a
                href={message.link}
                onClick={(e) => {
                  e.preventDefault();
                  if (onLinkClick) {
                    onLinkClick(message.link);
                  }
                }}
                className="message-link"
              >
                {message.link}
              </a>
            </div>
          )}
        </div>

        {buttons && buttons.length > 0 && (
          <div className="bot-buttons-container">
            {buttons.map((btn, index) => (
              <button
                key={index}
                className="option-button"
                onClick={() => onButtonClick(btn)}
              >
                <span>›</span>
                {btn.label || btn.title || btn.id}
              </button>
            ))}
          </div>
        )}
        <span className="message-time">{message.time}</span>
      </div>
    </div>
  );
}

export default MessageBubble;