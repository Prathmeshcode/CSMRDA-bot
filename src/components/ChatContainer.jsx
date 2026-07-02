import React, { useState, useEffect } from "react";
import ChatBody from "./ChatBody";
import ChatInput from "./ChatInput";
import "./ChatContainer.css";

// Webhook settings matching the original configuration
const WEBHOOK_URL = "https://straddle-harsh-blighted.ngrok-free.dev/webhook/ebf94f58-222f-4ad6-95b5-ed52e1ee135f/chat";
const INSTANCE_ID = "28a86607bc7bf72b30cb56e199172ee33d5fd1156fcb74177fc0e06d636a10eb";

// Helper function to format current time like "2:46 PM"
const getFormattedTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
};

// Parser to convert dynamic bot responses into structured messages
const parseBotResponse = (rawResponseText) => {
  try {
    const data = JSON.parse(rawResponseText);

    // Case 1: Custom UI response with title/subtitle/buttons
    if (data && !Array.isArray(data) && (data.title || data.subtitle || data.buttons)) {
      return {
        sender: "bot",
        isJson: true,
        title: data.title || "",
        subtitle: data.subtitle || "",
        buttons: data.buttons || [],
        link: data.link || null,
        time: getFormattedTime(),
        sessionId: data.sessionId || null,
        raw: data
      };
    }

    // Case 2: Array of objects
    if (Array.isArray(data)) {
      // Check if any element in the array is a structured UI message
      const uiItem = data.find(item => item && (item.title || item.subtitle || item.buttons));
      if (uiItem) {
        return {
          sender: "bot",
          isJson: true,
          title: uiItem.title || "",
          subtitle: uiItem.subtitle || uiItem.message || "",
          buttons: uiItem.buttons || [],
          link: uiItem.link || null,
          time: getFormattedTime(),
          sessionId: uiItem.sessionId || null,
          raw: data
        };
      }

      // Otherwise, extract messages and links from the array
      const items = data
        .map(item => {
          if (typeof item === "string") {
            return { text: item, link: null };
          }
          if (item && typeof item === "object") {
            return {
              text: item.message || item.text || item.error || JSON.stringify(item),
              link: item.link || null
            };
          }
          return null;
        })
        .filter(Boolean);

      if (items.length > 0) {
        return {
          sender: "bot",
          isJson: true,
          items: items,
          time: getFormattedTime()
        };
      }
    }

    // Case 3: Simple object with a message/text/error/link properties
    if (data && typeof data === "object") {
      const messageText = data.message || data.text || data.error;
      const link = data.link || null;
      if (messageText || link) {
        return {
          sender: "bot",
          isJson: true,
          text: messageText || "",
          link: link,
          time: getFormattedTime()
        };
      }
    }
  } catch {
    // Treat as raw text if JSON parsing fails
  }

  return {
    sender: "bot",
    isJson: false,
    text: rawResponseText,
    time: getFormattedTime()
  };
};

// Language specific configuration details
const LANG_CONFIG = {
  en: {
    welcome: "🙏 Welcome to **CSMRDA Vikas Mitra** – the official digital assistant for the Chhatrapati Sambhajinagar Metropolitan Region Development Authority! 🏢\n\nI am here to assist you with municipal layout permissions, building approvals, and citizen charter services.\n\n🔗 **Quick Links & Resources**:\n🌐 Official Website: https://csmrda.in\n📑 Citizen Services Portal: https://csmrda.in/service\n\nPlease type **\"hi\"** to begin or choose a language option.",
    placeholder: "Type your question...",
    sendText: "en"
  },
  mr: {
    welcome: "🙏 **सीएमआरडीए विकास मित्र** मध्ये आपले स्वागत आहे – छत्रपती संभाजीनगर महानगर प्रदेश विकास प्राधिकरणाचे अधिकृत डिजिटल असिस्टंट! 🏢\n\nमी तुम्हाला महानगर लेआउट परवानग्या, इमारत मंजुरी आणि नागरिक सनद सेवांमध्ये मदत करण्यासाठी येथे आहे.\n\n🔗 **द्रुत लिंक्स आणि संसाधने**:\n🌐 अधिकृत वेबसाइट: https://csmrda.in\n📑 नागरिक सेवा पोर्टल: https://csmrda.in/service\n\nकृपया प्रारंभ करण्यासाठी **\"hi\"** टाईप करा किंवा खालीलपैकी एक भाषा निवडा.",
    placeholder: "तुमचा प्रश्न विचारा...",
    sendText: "mr"
  },
  hi: {
    welcome: "🙏 **सीएमआरडीए विकास मित्र** में आपका स्वागत है – छत्रपति संभाजीनगर महानगर क्षेत्र विकास प्राधिकरण के आधिकारिक डिजिटल सहायक! 🏢\n\nमैं यहां आपको महानगर लेआउट अनुमतियों, भवन अनुमोदनों और नागरिक चार्टर सेवाओं में सहायता करने के लिए हूं.\n\n🔗 **त्वरित लिंक और संसाधन**:\n🌐 आधिकारिक वेबसाइट: https://csmrda.in\n📑 नागरिक सेवा पोर्टल: https://csmrda.in/service\n\nकृपया शुरू करने के लिए **\"hi\"** टाइप करें या भाषा का विकल्प चुनें।",
    placeholder: "अपना प्रश्न पूछें...",
    sendText: "hi"
  }
};

function ChatContainer({ initialLanguage = "en" }) {
  const config = LANG_CONFIG[initialLanguage] || LANG_CONFIG.en;

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      isJson: false,
      text: config.welcome,
      time: getFormattedTime(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Trigger language call silently on mount to set language state on webhook session
  useEffect(() => {
    if (initialLanguage) {
      sendMessageToWebhook(config.sendText, null, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLanguage]);

  // Send message function called when submitting user text or button option click
  const sendMessageToWebhook = async (text, labelToDisplay = null, silent = false) => {
    if (!text.trim()) return;

    const displayMessage = labelToDisplay || text;

    if (!silent) {
      // 1. Add user message locally
      const userMsg = {
        sender: "user",
        isJson: false,
        text: displayMessage,
        time: getFormattedTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setInputText("");
    setIsLoading(true);

    try {
      // 2. Prepare webhook payload & URL
      const url = new URL(WEBHOOK_URL);
      url.searchParams.append("action", "sendMessage");

      const payload = {
        action: "sendMessage",
        chatInput: text,
      };

      if (sessionId) {
        payload.sessionId = sessionId;
      }

      // 3. Make the API Call
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Instance-Id": INSTANCE_ID,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      // 4. Parse response
      const parsedBotMsg = parseBotResponse(responseText);

      // If we got a sessionId from the bot's response, persist it
      if (parsedBotMsg.sessionId) {
        setSessionId(parsedBotMsg.sessionId);
      }

      setMessages((prev) => [...prev, parsedBotMsg]);
    } catch (error) {
      console.error("Error communicating with webhook:", error);

      // Graceful error handling
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          isJson: false,
          text: "⚠️ Sorry, there was an error connecting to the digital assistant. The service might be temporarily offline.",
          time: getFormattedTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = () => {
    sendMessageToWebhook(inputText);
  };

  const handleButtonClick = (btn) => {
    // When a button option is clicked, we send the button's ID/value to webhook 
    // but display the button's label to the user in the conversation bubble.
    sendMessageToWebhook(btn.id || btn.label, btn.label);
  };

  const handleLinkClick = (url) => {
    // When a link is clicked, we send its URL to the webhook to fetch the next response!
    sendMessageToWebhook(url);
  };

  return (
    <div className="chat-container">
      <ChatBody
        messages={messages}
        handleButtonClick={handleButtonClick}
        handleLinkClick={handleLinkClick}
        isLoading={isLoading}
      />
      <ChatInput
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onSubmit={handleSendText}
        disabled={isLoading}
        placeholder={config.placeholder}
      />
    </div>
  );
}

export default ChatContainer;
