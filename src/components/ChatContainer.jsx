import { useEffect } from "react";
import "./ChatContainer.css";

function ChatContainer() {
  useEffect(() => {
    // 1. Add the CSS stylesheet to head
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css";
    document.head.appendChild(link);

    // 2. Create the script element to import and initialize n8n chat
    const script = document.createElement("script");
    script.type = "module";
    script.innerHTML = `
      import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
      
      // Clear any previous chat instance
      const container = document.getElementById('n8n-chat');
      if (container) {
        container.innerHTML = '';
      }

      createChat({
        target: '#n8n-chat',
        mode: 'fullscreen',
        webhookUrl: 'https://dwarf-sash-revisable.ngrok-free.dev/webhook/9b70304f-ba8d-46c5-8b51-08833bf39997/chat',
        showWelcomeScreen: false,
        loadPreviousSession: false,
        webhookConfig: {
          headers: {
            'X-Instance-Id': '28a86607bc7bf72b30cb56e199172ee33d5fd1156fcb74177fc0e06d636a10eb'
          }
        },
        allowFileUploads: false,
        allowedFilesMimeTypes: '',
        initialMessages: [
          '🙏 Welcome to CSMRDA Vikas Mitra',
          'Please say hi 👋 to me I will help you.'
        ],
        enableStreaming: false
      });
    `;
    document.body.appendChild(script);

    return () => {
      // Clean up when component unmounts
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
      const container = document.getElementById('n8n-chat');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="chat-frame-container">
      <div id="n8n-chat"></div>
    </div>
  );
}

export default ChatContainer;