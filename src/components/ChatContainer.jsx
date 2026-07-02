import { useEffect } from "react";
import "./ChatContainer.css";

function ChatContainer() {
  useEffect(() => {
    // 1. Add the CSS stylesheet to head
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css";
    document.head.appendChild(link);

    // 2. Setup message submission helpers
    window.sendChatMessage = (text) => {
      if (window.Chatbot && typeof window.Chatbot.sendMessage === "function") {
        try {
          window.Chatbot.sendMessage(text);
          return;
        } catch (e) {
          console.error("n8n Chatbot.sendMessage failed:", e);
        }
      }

      // Fallback: manually set input value and dispatch events
      const chatInput = document.querySelector("#n8n-chat textarea") || document.querySelector("#n8n-chat input[type='text']");
      if (chatInput) {
        // Bypass React's controlled input check by calling the native prototype setter
        const prototype = Object.getPrototypeOf(chatInput);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
        if (descriptor && descriptor.set) {
          descriptor.set.call(chatInput, text);
        } else {
          chatInput.value = text;
        }
        
        chatInput.dispatchEvent(new Event("input", { bubbles: true }));
        
        // Wait 50ms for React state to synchronize, then trigger click/submit
        setTimeout(() => {
          const sendBtn = document.querySelector("#n8n-chat button[type='submit']") || 
                          document.querySelector("#n8n-chat [class*='send-button']") ||
                          document.querySelector("#n8n-chat button");
          if (sendBtn) {
            sendBtn.click();
          } else {
            const form = chatInput.closest("form");
            if (form) {
              form.dispatchEvent(new Event("submit", { bubbles: true }));
            }
          }
        }, 50);
      }
    };

    // Intercept choice link clicks in the chat container
    const handleChoiceClick = (e) => {
      const link = e.target.closest("a");
      if (link) {
        if (link.classList.contains("disabled-choice")) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        const href = link.getAttribute("href");
        if (href && href.startsWith("#choice-")) {
          e.preventDefault();
          const choice = href.replace("#choice-", "");

          // Disable all choice buttons currently in the chat history
          const allChoices = document.querySelectorAll('#n8n-chat a[href^="#choice-"]');
          allChoices.forEach(choiceAnchor => {
            choiceAnchor.classList.add('disabled-choice');
            choiceAnchor.style.setProperty('pointer-events', 'none', 'important');
            choiceAnchor.style.setProperty('opacity', '0.6', 'important');
            choiceAnchor.style.setProperty('color', '#8696a0', 'important');
          });

          window.sendChatMessage(choice);
        }
      }
    };

    const container = document.getElementById("n8n-chat");
    if (container) {
      container.addEventListener("click", handleChoiceClick);
    }

    // 3. Client-Side Chat State Machine fallback
    let clientState = "ST001";
    let clientLanguage = "en";

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = args[0];
      const options = args[1];

      // Parse user's input from request if possible
      let userInput = "";
      if (options && options.body) {
        try {
          const reqData = JSON.parse(options.body);
          if (reqData && reqData.chatInput) {
            userInput = reqData.chatInput.trim();
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      let isRandomMsg = false;
      if (
        typeof url === "string" &&
        url.includes("/webhook/") &&
        url.includes("/chat")
      ) {
        const lowInput = userInput.toLowerCase();
        if (["hi", "hello", "start", ""].includes(lowInput)) {
          clientState = "ST001";
        } else if (userInput) {
          // Define all standard choice actions to check against
          const validChoiceInputs = [
            "en", "mr", "english", "marathi", "hi", "hello", "start", "",
            "building_permission", "zone_certificate", "part_plan", "gunthewari", "ai_assistant",
            "layout_documents", "building_documents", "occupancy_documents", "open_bpms",
            "download_pdf", "bpms", "back", "open", "open_portal",
            "apply_here", "aaple_sarkar", "register", "login", "track",
            "open_registration", "open_login", "track_application",
            "0", "1", "2", "3", "4"
          ];
          
          if (!validChoiceInputs.includes(lowInput)) {
            isRandomMsg = true;
            const trigger = clientLanguage === "mr" ? "mr" : "en";
            try {
              const reqData = JSON.parse(options.body);
              reqData.chatInput = trigger;
              options.body = JSON.stringify(reqData);
              clientState = "ST002";
            } catch (e) {
              console.error("Error overriding body for random message:", e);
            }
          }
        }

        try {
          const response = await originalFetch.apply(this, args);
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();

          const isArray = Array.isArray(data);
          const targetObj = isArray ? data[0] : data;

          if (targetObj && typeof targetObj === "object") {
            // Apply client-side state transition if the backend returned welcome/JSON state
            if (!targetObj.output || targetObj.current_state === "ST001" || targetObj.screen === "Welcome") {
              
              // Process state transitions based on userInput
              const processedInput = isRandomMsg ? (clientLanguage === "mr" ? "mr" : "en") : lowInput;
              
              if (clientState === "ST001" || isRandomMsg) {
                if (["0", "english", "en"].includes(processedInput)) {
                  clientState = "ST002";
                  clientLanguage = "en";
                } else if (["1", "marathi", "mr"].includes(processedInput)) {
                  clientState = "ST002";
                  clientLanguage = "mr";
                }
              } else if (clientState === "ST002") {
                if (["building_permission", "0"].includes(lowInput)) {
                  clientState = "ST101";
                } else if (["zone_certificate", "1"].includes(lowInput)) {
                  clientState = "ST201";
                } else if (["part_plan", "2"].includes(lowInput)) {
                  clientState = "ST301";
                } else if (["gunthewari", "3"].includes(lowInput)) {
                  clientState = "ST401";
                } else if (["ai_assistant", "4"].includes(lowInput)) {
                  clientState = "ST501";
                }
              } else if (clientState === "ST101") {
                if (["layout_documents", "0"].includes(lowInput)) {
                  clientState = "ST102";
                } else if (["building_documents", "1"].includes(lowInput)) {
                  clientState = "ST103";
                } else if (["occupancy_documents", "2"].includes(lowInput)) {
                  clientState = "ST104";
                } else if (["open_bpms", "3"].includes(lowInput)) {
                  clientState = "ST105";
                } else if (["back", "4"].includes(lowInput)) {
                  clientState = "ST002";
                }
              } else if (clientState === "ST102") {
                if (["download_pdf", "0"].includes(lowInput)) {
                  // Keep state
                } else if (["bpms", "1"].includes(lowInput)) {
                  clientState = "ST105";
                } else if (["back", "2"].includes(lowInput)) {
                  clientState = "ST101";
                }
              } else if (clientState === "ST103") {
                if (["download_pdf", "0"].includes(lowInput)) {
                  // Keep state
                } else if (["bpms", "1"].includes(lowInput)) {
                  clientState = "ST105";
                } else if (["back", "2"].includes(lowInput)) {
                  clientState = "ST101";
                }
              } else if (clientState === "ST104") {
                if (["download_pdf", "0"].includes(lowInput)) {
                  // Keep state
                } else if (["bpms", "1"].includes(lowInput)) {
                  clientState = "ST105";
                } else if (["back", "2"].includes(lowInput)) {
                  clientState = "ST101";
                }
              } else if (clientState === "ST105") {
                if (["open", "open_portal", "0"].includes(lowInput)) {
                  // Keep state
                } else if (["back", "1"].includes(lowInput)) {
                  clientState = "ST101";
                }
              } else if (clientState === "ST201") {
                if (["apply_here", "0"].includes(lowInput)) {
                  // Apply portal link
                } else if (["aaple_sarkar", "1"].includes(lowInput)) {
                  // Portal link
                } else if (["back", "2"].includes(lowInput)) {
                  clientState = "ST002";
                }
              } else if (clientState === "ST301") {
                if (["apply_here", "0"].includes(lowInput)) {
                  // Portal link
                } else if (["aaple_sarkar", "1"].includes(lowInput)) {
                  // Portal link
                } else if (["back", "2"].includes(lowInput)) {
                  clientState = "ST002";
                }
              } else if (clientState === "ST401") {
                if (["open_portal", "0"].includes(lowInput)) {
                  // Portal link
                } else if (["back", "1"].includes(lowInput)) {
                  clientState = "ST002";
                }
              }

              // Build mock response objects for all client states
              let mockObj = { ...targetObj };

              if (clientState === "ST001") {
                mockObj.title = "Welcome to CSMRDA Digital Assistant";
                mockObj.subtitle = "Please choose your preferred language";
                mockObj.buttons = [
                  { id: "en", label: "English" },
                  { id: "mr", label: "Marathi" }
                ];
              } else if (clientState === "ST002") {
                mockObj.title = clientLanguage === "mr" ? "मुख्य मेनू" : "Main Menu";
                mockObj.subtitle = clientLanguage === "mr" ? "कृपया सेवा निवडा" : "Please select a service";
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "building_permission", label: "🏢 इमारत परवानगी" },
                  { id: "zone_certificate", label: "📍 झोन प्रमाणपत्र" },
                  { id: "part_plan", label: "🗺️ भाग नकाशा" }
                ] : [
                  { id: "building_permission", label: "🏢 Building Permission" },
                  { id: "zone_certificate", label: "📍 Zone Certificate" },
                  { id: "part_plan", label: "🗺️ Part Plan" }
                ];
              } else if (clientState === "ST101") {
                mockObj.title = clientLanguage === "mr" ? "🏢 इमारत परवानगी" : "🏢 Building Permission";
                mockObj.subtitle = clientLanguage === "mr" ? "कृपया एक पर्याय निवडा:" : "Please choose an option:";
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "layout_documents", label: "📄 लेआउट कागदपत्रे" },
                  { id: "building_documents", label: "🏗️ इमारत परवानगी कागदपत्रे" },
                  { id: "occupancy_documents", label: "🏠 भोगवटा प्रमाणपत्र" },
                  { id: "open_bpms", label: "🌐 BPMS पोर्टल उघडा" },
                  { id: "back", label: "⬅ मागे" }
                ] : [
                  { id: "layout_documents", label: "📄 Layout Documents" },
                  { id: "building_documents", label: "🏗️ Building Documents" },
                  { id: "occupancy_documents", label: "🏠 Occupancy Certificate" },
                  { id: "open_bpms", label: "🌐 Open BPMS Portal" },
                  { id: "back", label: "⬅ Back" }
                ];
              } else if (clientState === "ST102") {
                mockObj.title = clientLanguage === "mr" ? "📑 लेआउट कागदपत्रे" : "📑 Layout Documents";
                mockObj.subtitle = clientLanguage === "mr" ? "आवश्यक कागदपत्रे" : "Required Documents";
                mockObj.documentList = clientLanguage === "mr" ? 
                  ["मालकी हक्काचा पुरावा", "साईट प्लॅन", "सर्व्हे प्लॅन", "आर्किटेक्ट प्रमाणपत्र", "प्रतिज्ञापत्र"] :
                  ["Ownership Document", "Site Plan", "Survey Plan", "Architect Certificate", "Affidavit"];
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "download_pdf", label: "📄 PDF डाउनलोड करा" },
                  { id: "bpms", label: "🌐 BPMS पोर्टल उघडा" },
                  { id: "back", label: "⬅ इमारत परवानगी मेनू" }
                ] : [
                  { id: "download_pdf", label: "📄 Download PDF" },
                  { id: "bpms", label: "🌐 Open BPMS Portal" },
                  { id: "back", label: "⬅ Back to Building Permission" }
                ];
              } else if (clientState === "ST103") {
                mockObj.title = clientLanguage === "mr" ? "📑 इमारत परवानगी कागदपत्रे" : "📑 Building Permission Documents";
                mockObj.subtitle = clientLanguage === "mr" ? "आवश्यक कागदपत्रांची यादी" : "Required Documents List";
                mockObj.documentList = clientLanguage === "mr" ?
                  ["बांधकाम आराखडा", "आर्किटेक्ट प्रमाणपत्र", "स्ट्रक्चरल स्थिरता प्रमाणपत्र", "मालकी हक्काचा पुरावा", "कर भरल्याचा दाखला"] :
                  ["Building Plan", "Architect Certificate", "Structural Stability Certificate", "Ownership Document", "Property Tax Receipt"];
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "download_pdf", label: "📄 PDF डाउनलोड करा" },
                  { id: "bpms", label: "🌐 BPMS पोर्टल" },
                  { id: "back", label: "⬅ इमारत परवानगी मेनू" }
                ] : [
                  { id: "download_pdf", label: "📄 Download PDF" },
                  { id: "bpms", label: "🌐 Open BPMS" },
                  { id: "back", label: "⬅ Back to Building Permission" }
                ];
              } else if (clientState === "ST104") {
                mockObj.title = clientLanguage === "mr" ? "🏠 भोगवटा प्रमाणपत्र" : "🏠 Occupancy Certificate";
                mockObj.subtitle = clientLanguage === "mr" ? "आवश्यक कागदपत्रांची यादी" : "Required Documents List";
                mockObj.documentList = clientLanguage === "mr" ?
                  ["पूर्णता प्रमाणपत्र", "आर्किटेक्ट प्रमाणपत्र", "स्ट्रक्चरल स्थिरता प्रमाणपत्र", "अग्निशमन विभागाचे प्रमाणपत्र", "पाणी व ड्रेनेज जोडणी प्रमाणपत्र"] :
                  ["Completion Certificate", "Architect Certificate", "Structural Stability Certificate", "Fire Department NOC", "Water & Drainage Connection Certificate"];
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "download_pdf", label: "📄 PDF डाउनलोड करा" },
                  { id: "bpms", label: "🌐 BPMS पोर्टल" },
                  { id: "back", label: "⬅ इमारत परवानगी मेनू" }
                ] : [
                  { id: "download_pdf", label: "📄 Download PDF" },
                  { id: "bpms", label: "🌐 Open BPMS" },
                  { id: "back", label: "⬅ Back to Building Permission" }
                ];
              } else if (clientState === "ST105") {
                mockObj.title = clientLanguage === "mr" ? "🌐 बिल्डिंग प्लॅन मॅनेजमेंट सिस्टम" : "🌐 Building Plan Management System";
                mockObj.subtitle = clientLanguage === "mr" ? "BPMS पोर्टलद्वारे खालील सेवा उपलब्ध आहेत." : "The following services are available through the BPMS portal.";
                mockObj.description = clientLanguage === "mr" ? "BPMS पोर्टलवर जाऊन आपण अर्ज करू शकता, कागदपत्रे सादर करू शकता आणि अर्जाची स्थिती पाहू शकता." : "You can apply for building permission, submit documents and track your application through the BPMS portal.";
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "open", label: "🌐 BPMS पोर्टल उघडा" },
                  { id: "back", label: "⬅ इमारत परवानगी मेनू" }
                ] : [
                  { id: "open", label: "🌐 Open BPMS Portal" },
                  { id: "back", label: "⬅ Back to Building Permission" }
                ];
              } else if (clientState === "ST201") {
                mockObj.title = clientLanguage === "mr" ? "📍 झोन प्रमाणपत्र" : "📍 Zone Certificate";
                mockObj.subtitle = clientLanguage === "mr" ? "कृपया एक पर्याय निवडा:" : "Please choose an option:";
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "apply_here", label: "📝 येथे अर्ज करा" },
                  { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
                  { id: "back", label: "⬅ मुख्य मेनू" }
                ] : [
                  { id: "apply_here", label: "📝 Apply Here" },
                  { id: "aaple_sarkar", label: "🌐 Aaple Sarkar Portal" },
                  { id: "back", label: "⬅ Back to Main Menu" }
                ];
              } else if (clientState === "ST301") {
                mockObj.title = clientLanguage === "mr" ? "🗺️ भाग नकाशा" : "🗺️ Part Plan";
                mockObj.subtitle = clientLanguage === "mr" ? "कृपया एक पर्याय निवडा:" : "Please choose an option:";
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "apply_here", label: "📝 येथे अर्ज करा" },
                  { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
                  { id: "back", label: "⬅ मुख्य मेनू" }
                ] : [
                  { id: "apply_here", label: "📝 Apply Here" },
                  { id: "aaple_sarkar", label: "🌐 Aaple Sarkar Portal" },
                  { id: "back", label: "⬅ Back to Main Menu" }
                ];
              } else if (clientState === "ST401") {
                mockObj.title = clientLanguage === "mr" ? "🏢 गुंठेवारी" : "🏢 Gunthewari";
                mockObj.subtitle = clientLanguage === "mr" ? "कृपया एक पर्याय निवडा:" : "Please choose an option:";
                mockObj.buttons = clientLanguage === "mr" ? [
                  { id: "open_portal", label: "🌐 गुंठेवारी पोर्टल उघडा" },
                  { id: "back", label: "⬅ मुख्य मेनू" }
                ] : [
                  { id: "open_portal", label: "🌐 Open Gunthewari Portal" },
                  { id: "back", label: "⬅ Back to Main Menu" }
                ];
              }

              // Format formatting for output property
              let outputText = "";
              if (mockObj.title) {
                outputText += `### ${mockObj.title}\n`;
              }
              if (mockObj.subtitle) {
                outputText += `${mockObj.subtitle}\n\n`;
              }
              if (mockObj.description) {
                outputText += `${mockObj.description}\n\n`;
              }
              if (Array.isArray(mockObj.documentList)) {
                outputText += clientLanguage === "mr" ? "**आवश्यक कागदपत्रे:**\n" : "**Required Documents:**\n";
                mockObj.documentList.forEach((doc) => {
                  outputText += `• ${doc}\n`;
                });
                outputText += "\n";
              }
              if (Array.isArray(mockObj.buttons) && mockObj.buttons.length > 0) {
                mockObj.buttons.forEach((btn) => {
                  outputText += `*   [${btn.label}](#choice-${btn.id})\n`;
                });
              }

              mockObj.output = outputText;
              
              if (isRandomMsg) {
                const warning = clientLanguage === "mr" ? 
                  "कृपया खालीलपैकी एक सेवा निवडा:\n\n" : 
                  "Please select one of the services as follows:\n\n";
                mockObj.output = warning + mockObj.output;
              }
              
              const modifiedData = isArray ? [mockObj] : mockObj;
              const blob = new Blob([JSON.stringify(modifiedData)], {
                type: "application/json",
              });
              return new Response(blob, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
              });
            } else {
              if (isRandomMsg && targetObj.output) {
                const warning = clientLanguage === "mr" ? 
                  "कृपया खालीलपैकी एक सेवा निवडा:\n\n" : 
                  "Please select one of the services as follows:\n\n";
                targetObj.output = warning + targetObj.output;
                
                const modifiedData = isArray ? [targetObj] : targetObj;
                const blob = new Blob([JSON.stringify(modifiedData)], {
                  type: "application/json",
                });
                return new Response(blob, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                });
              }
            }
          }
          return response;
        } catch (error) {
          console.error("Error intercepting chat response:", error);
        }
      }
      return originalFetch.apply(this, args);
    };

    // 4. Create the script element to import and initialize n8n chat
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
        webhookUrl: 'https://straddle-harsh-blighted.ngrok-free.dev/webhook/ebf94f58-222f-4ad6-95b5-ed52e1ee135f/chat',
        showWelcomeScreen: false,
        loadPreviousSession: false,
        webhookConfig: {
          headers: {
            'X-Instance-Id': '28a86607bc7bf72b30cb56e199172ee33d5fd1156fcb74177fc0e06d636a10eb'
          }
        },
        allowFileUploads: false,
        allowedFilesMimeTypes: '',
        initialMessages: [],
        enableStreaming: false
      });
    `;
    document.body.appendChild(script);

    // 5. Setup MutationObserver to hide user choice bubbles, inject system notices, and run sequential welcome typing flow
    const scrollToBottomGlobal = () => {
      const scrollableElements = [];
      const selectors = [
        '#n8n-chat [class*="messages-list"]',
        '#n8n-chat .chat-messages',
        '#n8n-chat [class*="-messages-list"]',
        '#n8n-chat [class*="chat-messages"]',
        '#n8n-chat [class*="layout"]',
        '#n8n-chat'
      ];
      
      selectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (el && !scrollableElements.includes(el)) {
          scrollableElements.push(el);
        }
      });
      
      const allDivs = document.querySelectorAll('#n8n-chat div');
      allDivs.forEach(div => {
        if (div.scrollHeight > div.clientHeight && !scrollableElements.includes(div)) {
          scrollableElements.push(div);
        }
      });

      setTimeout(() => {
        scrollableElements.forEach(el => {
          el.scrollTop = el.scrollHeight;
        });
      }, 50);
    };

    let sequenceStarted = false;
    const startInitialSequence = () => {
      if (sequenceStarted) return;

      const messagesList = document.querySelector('#n8n-chat [class*="messages-list"]') || 
                           document.querySelector('#n8n-chat .chat-messages') ||
                           document.querySelector('#n8n-chat [class*="-messages-list"]');
      if (!messagesList) return;

      sequenceStarted = true;

      // 1. Inject Date pill and Encryption Disclaimer
      if (!document.getElementById('wa-date-disclaimer')) {
        const dateBox = document.createElement('div');
        dateBox.id = 'wa-date-disclaimer';
        dateBox.innerHTML = 'TODAY';
        messagesList.appendChild(dateBox);
      }
      if (!document.getElementById('wa-encryption-disclaimer')) {
        const disclaimer = document.createElement('div');
        disclaimer.id = 'wa-encryption-disclaimer';
        disclaimer.innerHTML = '🔒 Messages are end-to-end encrypted. This is an official CSMRDA service.';
        messagesList.appendChild(disclaimer);
      }

      // Helper to append the WhatsApp 3-dots typing indicator bubble
      const showTypingIndicator = () => {
        const typingWrapper = document.createElement('div');
        typingWrapper.id = 'wa-typing-indicator';
        typingWrapper.className = 'chat-message-wrapper bot-message-wrapper wa-typing-wrapper wa-welcome-message-wrapper';
        typingWrapper.innerHTML = `
          <div class="chat-message bot-message wa-typing-bubble" style="padding: 10px 16px !important; width: fit-content !important;">
            <div class="wa-typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        `;
        messagesList.appendChild(typingWrapper);
        scrollToBottomGlobal();
      };

      // Helper to remove typing indicator
      const removeTypingIndicator = () => {
        const el = document.getElementById('wa-typing-indicator');
        if (el) el.remove();
      };

      // Helper to append real message with WhatsApp style timestamp
      const appendMessage = (textHTML) => {
        const msgWrapper = document.createElement('div');
        msgWrapper.className = 'chat-message-wrapper bot-message-wrapper wa-welcome-message-wrapper';
        
        let formattedHTML = textHTML;
        if (formattedHTML.includes('*   [')) {
          // Format language selection list menu with WA styling
          formattedHTML = `
            भाषा / Language<br><br>कृपया खालीलपैकी तुमची आवडती भाषा निवडा:
            <ul class="wa-choice-list">
              <li><a href="#choice-mr">मराठी</a></li>
              <li><a href="#choice-en">English</a></li>
            </ul>
          `;
        } else {
          // Support formatting bold **text** to HTML tags
          formattedHTML = formattedHTML.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }

        msgWrapper.innerHTML = `
          <div class="chat-message bot-message" style="position: relative !important;">
            <div class="chat-message-markdown">
              ${formattedHTML}
            </div>
            <span class="chat-message-time" style="font-size: 10px; opacity: 0.6; display: block; text-align: right; margin-top: 4px;">
              ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          </div>
        `;
        messagesList.appendChild(msgWrapper);
        scrollToBottomGlobal();
      };

      // RUN SEQUENTIAL TYPING ANIMATION
      setTimeout(() => {
        showTypingIndicator();
        
        setTimeout(() => {
          removeTypingIndicator();
          appendMessage('🙏 **नमस्कार!** मी **विकास मित्र** — छत्रपती संभाजीनगर महानगर प्रदेश विकास प्राधिकरण (CSMRDA) चा सहाय्यक.');
          
          setTimeout(() => {
            showTypingIndicator();
            
            setTimeout(() => {
              removeTypingIndicator();
              appendMessage('🙏 **Hello!** I\'m **Vikas Mitra** — the assistant for the Chhatrapati Sambhajinagar Metropolitan Region Development Authority (CSMRDA).');
              
              setTimeout(() => {
                showTypingIndicator();
                
                setTimeout(() => {
                  removeTypingIndicator();
                  appendMessage('भाषा / Language\\n\\nकृपया खालीलपैकी तुमची आवडती भाषा निवडा:\\n*   [मराठी](#choice-mr)\\n*   [English](#choice-en)');
                }, 1000);
              }, 600);
            }, 1400);
          }, 600);
        }, 1200);
      }, 300);
    };

    // Check for messagesList container mounting every 100ms to start sequence reliably
    const initialCheckInterval = setInterval(() => {
      const messagesList = document.querySelector('#n8n-chat [class*="messages-list"]') || 
                           document.querySelector('#n8n-chat .chat-messages') ||
                           document.querySelector('#n8n-chat [class*="-messages-list"]');
      if (messagesList) {
        clearInterval(initialCheckInterval);
        startInitialSequence();
      }
    }, 100);

    let observer = null;
    const targetNode = document.getElementById("n8n-chat");

    const rearrangeMessages = () => {
      const messagesList = document.querySelector('#n8n-chat [class*="messages-list"]') || 
                           document.querySelector('#n8n-chat .chat-messages') ||
                           document.querySelector('#n8n-chat [class*="-messages-list"]');
      if (!messagesList) return;

      const dateEl = document.getElementById('wa-date-disclaimer');
      const encEl = document.getElementById('wa-encryption-disclaimer');
      const welcomeWrappers = messagesList.querySelectorAll('.wa-welcome-message-wrapper');

      if (observer) observer.disconnect();

      // Ensure elements are at the top in correct order
      let refNode = messagesList.firstChild;
      if (dateEl && messagesList.firstChild !== dateEl) {
        messagesList.insertBefore(dateEl, messagesList.firstChild);
      }
      refNode = dateEl ? dateEl.nextSibling : messagesList.firstChild;

      if (encEl && refNode !== encEl) {
        messagesList.insertBefore(encEl, refNode);
      }
      refNode = encEl ? encEl.nextSibling : refNode;

      welcomeWrappers.forEach((wrapper) => {
        if (refNode !== wrapper) {
          messagesList.insertBefore(wrapper, refNode);
        }
        refNode = wrapper.nextSibling;
      });

      scrollToBottomGlobal();

      if (observer && targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
      }
    };

    observer = new MutationObserver((mutations) => {
      // Keep welcome messages pinned to the top of the chat view
      rearrangeMessages();

      // Automatically scroll to the bottom of the chat list
      scrollToBottomGlobal();

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const userMessages = node.querySelectorAll('[class*="user-message"], [class*="-user-"], .chat-message-user');
            const nodesToInspect = [...userMessages];
            if (node.matches && (node.matches('[class*="user-message"]') || node.matches('[class*="-user-"]') || node.matches('.chat-message-user'))) {
              nodesToInspect.push(node);
            }

            for (const msg of nodesToInspect) {
              const text = msg.textContent.trim().toLowerCase();
              const hiddenChoiceInputs = [
                "en", "mr", "english", "marathi",
                "building_permission", "zone_certificate", "part_plan", "gunthewari", "ai_assistant",
                "layout_documents", "building_documents", "occupancy_documents", "open_bpms",
                "download_pdf", "bpms", "back", "open", "open_portal",
                "apply_here", "aaple_sarkar", "register", "login", "track",
                "open_registration", "open_login", "track_application"
              ];
              
              if (hiddenChoiceInputs.includes(text)) {
                msg.style.setProperty('display', 'none', 'important');
                const wrapper = msg.closest('[class*="message-wrapper"]') || 
                                msg.closest('[class*="message-row"]') || 
                                msg.closest('[class*="message-container"]') ||
                                msg.parentElement;
                if (wrapper && wrapper !== document.getElementById('n8n-chat')) {
                  wrapper.style.setProperty('display', 'none', 'important');
                }
              }
            }
          }
        }
      }
    });

    if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true });
    }

    return () => {
      // Clean up when component unmounts
      window.fetch = originalFetch;
      delete window.sendChatMessage;
      if (observer) observer.disconnect();
      clearInterval(initialCheckInterval);
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
      const container = document.getElementById('n8n-chat');
      if (container) {
        container.removeEventListener("click", handleChoiceClick);
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
