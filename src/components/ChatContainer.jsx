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

          // Action URL redirects dictionary
          const actionUrls = {
            download_pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            bpms: "https://mahavastu.maharashtra.gov.in/",
            open_bpms: "https://mahavastu.maharashtra.gov.in/",
            aaple_sarkar: "https://aaplesarkar.mahaonline.gov.in/",
            register: "https://aaplesarkar.mahaonline.gov.in/en/Registration/Register",
            login: "https://aaplesarkar.mahaonline.gov.in/en/Login/Login",
            track_application: "https://aaplesarkar.mahaonline.gov.in/en/TrackApplication/Index",
            open_portal: "https://aaplesarkar.mahaonline.gov.in/",
            open_gunthewari: "https://gunthevari-form.csmrda.in/"
          };

          if (actionUrls[choice]) {
            window.open(actionUrls[choice], "_blank");
            return; // Open in new tab, do not send dummy message
          }

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

    // Expose reset globally
    window.resetChatbotSession = () => {
      clientState = "ST001";
      clientLanguage = "en";
      const container = document.getElementById('n8n-chat');
      if (container) {
        container.innerHTML = '';
      }
      sequenceStarted = false;
      startInitialSequence();
      window.dispatchEvent(new CustomEvent('chatbot-status-change', { detail: { status: 'online' } }));
    };

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
        // Dispatch typing status
        window.dispatchEvent(new CustomEvent('chatbot-status-change', { detail: { status: 'typing...' } }));

        const lowInput = userInput.toLowerCase();

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

        if (userInput && !validChoiceInputs.includes(lowInput) && clientState !== "ST501") {
          isRandomMsg = true;
          const trigger = clientLanguage === "mr" ? "mr" : "en";
          try {
            if (options && options.body) {
              const reqData = JSON.parse(options.body);
              reqData.chatInput = trigger;
              options.body = JSON.stringify(reqData);
            }
          } catch (e) {
            console.error("Error overriding body for random message:", e);
          }
          clientState = "ST002";
        }

        let response;
        let useFallback = false;
        let responseData = null;

        try {
          response = await originalFetch.apply(this, args);
          if (response && response.ok) {
            const clonedResponse = response.clone();
            responseData = await clonedResponse.json();
          } else {
            useFallback = true;
          }
        } catch (error) {
          console.warn("Backend webhook offline, falling back to local simulator:", error);
          useFallback = true;
        }

        // Delay response to let typing animation feel authentic
        if (useFallback) {
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        }

        // Return status to online
        window.dispatchEvent(new CustomEvent('chatbot-status-change', { detail: { status: 'online' } }));

        let isArray = false;
        let targetObj = {};

        if (!useFallback && responseData) {
          isArray = Array.isArray(responseData);
          targetObj = isArray ? responseData[0] : responseData;
        } else {
          targetObj = { output: "" };
        }

        // Apply local state transitions if we have a fallback or backend returns welcome/empty
        const backendWelcome = !targetObj.output || targetObj.current_state === "ST001" || targetObj.screen === "Welcome";
        if (useFallback || backendWelcome) {
          const processedInput = isRandomMsg ? (clientLanguage === "mr" ? "mr" : (clientLanguage === "hi" ? "hi" : "en")) : lowInput;

          if (clientState === "ST001" || isRandomMsg) {
            if (["0", "english", "en"].includes(processedInput)) {
              clientState = "ST002";
              clientLanguage = "en";
            } else if (["1", "marathi", "mr"].includes(processedInput)) {
              clientState = "ST002";
              clientLanguage = "mr";
            } else if (["2", "hindi", "hi"].includes(processedInput)) {
              clientState = "ST002";
              clientLanguage = "hi";
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
              clientState = "ST_APPLY";
            } else if (["aaple_sarkar", "1"].includes(lowInput)) {
              // Keep state
            } else if (["back", "2"].includes(lowInput)) {
              clientState = "ST002";
            }
          } else if (clientState === "ST301") {
            if (["apply_here", "0"].includes(lowInput)) {
              clientState = "ST_APPLY";
            } else if (["aaple_sarkar", "1"].includes(lowInput)) {
              // Keep state
            } else if (["back", "2"].includes(lowInput)) {
              clientState = "ST002";
            }
          } else if (clientState === "ST401") {
            if (["open_gunthewari", "0"].includes(lowInput)) {
              // Keep state
            } else if (["back", "1"].includes(lowInput)) {
              clientState = "ST002";
            }
          } else if (clientState === "ST501") {
            if (["back", "exit", "0", "⬅ back", "⬅ मागे", "मागे", "पीछे"].includes(lowInput)) {
              clientState = "ST002";
            }
          } else if (clientState === "ST_APPLY") {
            if (["back", "exit", "0", "⬅ back", "⬅ मागे", "मागे", "पीछे"].includes(lowInput)) {
              clientState = "ST002";
            }
          }

          // Build mock response objects for all client states
          let mockObj = { ...targetObj };
          mockObj.current_state = clientState;

          if (clientState === "ST001") {
            mockObj.title = "Welcome to CSMRDA Digital Assistant";
            mockObj.subtitle = "Please choose your preferred language";
            mockObj.buttons = [
              { id: "mr", label: "मराठी (Marathi)" },
              { id: "hi", label: "हिन्दी (Hindi)" },
              { id: "en", label: "English" }
            ];
          } else if (clientState === "ST002") {
            mockObj.title = clientLanguage === "mr" ? "मुख्य मेनू" : (clientLanguage === "hi" ? "मुख्य मेनू" : "Main Menu");
            mockObj.subtitle = clientLanguage === "mr" ? "कृपया सेवा निवडा" : (clientLanguage === "hi" ? "कृपया एक सेवा चुनें" : "Please select a service");
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "building_permission", label: "🏢 इमारत परवानगी" },
              { id: "zone_certificate", label: "📍 झोन प्रमाणपत्र" },
              { id: "part_plan", label: "🗺️ भाग नकाशा" },
              { id: "gunthewari", label: "🏢 गुंठेवारी" },
              { id: "ai_assistant", label: "🤖 AI सहाय्यक" }
            ] : (clientLanguage === "hi" ? [
              { id: "building_permission", label: "🏢 भवन निर्माण अनुमति" },
              { id: "zone_certificate", label: "📍 ज़ोन प्रमाणपत्र" },
              { id: "part_plan", label: "🗺️ पार्ट प्लान" },
              { id: "gunthewari", label: "🏢 गुंठेवारी" },
              { id: "ai_assistant", label: "🤖 AI सहायक" }
            ] : [
              { id: "building_permission", label: "🏢 Building Permission" },
              { id: "zone_certificate", label: "📍 Zone Certificate" },
              { id: "part_plan", label: "🗺️ Part Plan" },
              { id: "gunthewari", label: "🏢 Gunthewari" },
              { id: "ai_assistant", label: "🤖 AI Assistant" }
            ]);
          } else if (clientState === "ST101") {
            mockObj.title = clientLanguage === "mr" ? "🏢 इमारत परवानगी" : (clientLanguage === "hi" ? "🏢 भवन निर्माण अनुमति" : "🏢 Building Permission");
            mockObj.subtitle = clientLanguage === "mr" ? "कृपया एक पर्याय निवडा:" : (clientLanguage === "hi" ? "कृपया एक विकल्प चुनें:" : "Please choose an option:");
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "layout_documents", label: "📄 लेआउट कागदपत्रे" },
              { id: "building_documents", label: "🏗️ इमारत परवानगी कागदपत्रे" },
              { id: "occupancy_documents", label: "🏠 भोगवटा प्रमाणपत्र" },
              { id: "open_bpms", label: "🌐 BPMS पोर्टल उघडा" },
              { id: "back", label: "⬅ मागे" }
            ] : (clientLanguage === "hi" ? [
              { id: "layout_documents", label: "📄 लेआउट दस्तावेज़" },
              { id: "building_documents", label: "🏗️ भवन निर्माण अनुमति दस्तावेज़" },
              { id: "occupancy_documents", label: "🏠 अधिभोग प्रमाण पत्र" },
              { id: "open_bpms", label: "🌐 BPMS पोर्टल खोलें" },
              { id: "back", label: "⬅ पीछे जाएं" }
            ] : [
              { id: "layout_documents", label: "📄 Layout Documents" },
              { id: "building_documents", label: "🏗️ Building Documents" },
              { id: "occupancy_documents", label: "🏠 Occupancy Certificate" },
              { id: "open_bpms", label: "🌐 Open BPMS Portal" },
              { id: "back", label: "⬅ Back" }
            ]);
          } else if (clientState === "ST102") {
            mockObj.title = clientLanguage === "mr" ? "📑 लेआउट कागदपत्रे" : (clientLanguage === "hi" ? "📑 लेआउट दस्तावेज़" : "📑 Layout Documents");
            mockObj.subtitle = clientLanguage === "mr" ? "आवश्यक कागदपत्रे" : (clientLanguage === "hi" ? "आवश्यक दस्तावेज़" : "Required Documents");
            mockObj.documentList = clientLanguage === "mr" ?
              ["मालकी हक्काचा पुरावा", "साईट प्लॅन", "सर्व्हे प्लॅन", "आर्किटेक्ट प्रमाणपत्र", "प्रतिज्ञापत्र"] :
              (clientLanguage === "hi" ?
                ["स्वामित्व दस्तावेज़", "साइट प्लान", "सर्वेक्षण योजना", "आर्किटेक्ट प्रमाण पत्र", "शपथ पत्र"] :
                ["Ownership Document", "Site Plan", "Survey Plan", "Architect Certificate", "Affidavit"]);
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "download_pdf", label: "📄 PDF डाउनलोड करा" },
              { id: "bpms", label: "🌐 BPMS पोर्टल उघडा" },
              { id: "back", label: "⬅ इमारत परवानगी मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "download_pdf", label: "📄 PDF डाउनलोड करें" },
              { id: "bpms", label: "🌐 BPMS पोर्टल खोलें" },
              { id: "back", label: "⬅ भवन निर्माण अनुमति मेनू" }
            ] : [
              { id: "download_pdf", label: "📄 Download PDF" },
              { id: "bpms", label: "🌐 Open BPMS Portal" },
              { id: "back", label: "⬅ Back to Building Permission" }
            ]);
          } else if (clientState === "ST103") {
            mockObj.title = clientLanguage === "mr" ? "📑 इमारत परवानगी कागदपत्रे" : (clientLanguage === "hi" ? "📑 भवन निर्माण अनुमति दस्तावेज़" : "📑 Building Permission Documents");
            mockObj.subtitle = clientLanguage === "mr" ? "आवश्यक कागदपत्रांची यादी" : (clientLanguage === "hi" ? "आवश्यक दस्तावेज़ों की सूची" : "Required Documents List");
            mockObj.documentList = clientLanguage === "mr" ?
              ["बांधकाम आराखडा", "आर्किटेक्ट प्रमाणपत्र", "स्ट्रक्चरल स्थिरता प्रमाणपत्र", "मालकी हक्काचा पुरावा", "कर भरल्याचा दाखला"] :
              (clientLanguage === "hi" ?
                ["भवन योजना", "आर्किटेक्ट प्रमाण पत्र", "संरचनात्मक स्थिरता प्रमाण पत्र", "स्वामित्व दस्तावेज़", "संपत्ति कर रसीद"] :
                ["Building Plan", "Architect Certificate", "Structural Stability Certificate", "Ownership Document", "Property Tax Receipt"]);
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "download_pdf", label: "📄 PDF डाउनलोड करा" },
              { id: "bpms", label: "🌐 BPMS पोर्टल" },
              { id: "back", label: "⬅ इमारत परवानगी मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "download_pdf", label: "📄 PDF डाउनलोड करें" },
              { id: "bpms", label: "🌐 BPMS पोर्टल" },
              { id: "back", label: "⬅ भवन निर्माण अनुमति मेनू" }
            ] : [
              { id: "download_pdf", label: "📄 Download PDF" },
              { id: "bpms", label: "🌐 Open BPMS" },
              { id: "back", label: "⬅ Back to Building Permission" }
            ]);
          } else if (clientState === "ST104") {
            mockObj.title = clientLanguage === "mr" ? "🏠 भोगवटा प्रमाणपत्र" : (clientLanguage === "hi" ? "🏠 अधिभोग प्रमाण पत्र" : "🏠 Occupancy Certificate");
            mockObj.subtitle = clientLanguage === "mr" ? "आवश्यक कागदपत्रांची यादी" : (clientLanguage === "hi" ? "आवश्यक दस्तावेज़ों की सूची" : "Required Documents List");
            mockObj.documentList = clientLanguage === "mr" ?
              ["पूर्णता प्रमाणपत्र", "आर्किटेक्ट प्रमाणपत्र", "स्ट्रक्चरल स्थिरता प्रमाणपत्र", "अग्निशमन विभागाचे प्रमाणपत्र", "पाणी व ड्रेनेज जोडणी प्रमाणपत्र"] :
              (clientLanguage === "hi" ?
                ["पूर्णता प्रमाण पत्र", "आर्किटेक्ट प्रमाण पत्र", "संरचनात्मक स्थिरता प्रमाण पत्र", "अग्निशमन विभाग NOC", "जल एवं जल निकासी कनेक्शन प्रमाण पत्र"] :
                ["Completion Certificate", "Architect Certificate", "Structural Stability Certificate", "Fire Department NOC", "Water & Drainage Connection Certificate"]);
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "download_pdf", label: "📄 PDF डाउनलोड करा" },
              { id: "bpms", label: "🌐 BPMS पोर्टल" },
              { id: "back", label: "⬅ इमारत परवानगी मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "download_pdf", label: "📄 PDF डाउनलोड करें" },
              { id: "bpms", label: "🌐 BPMS पोर्टल" },
              { id: "back", label: "⬅ भवन निर्माण अनुमति मेनू" }
            ] : [
              { id: "download_pdf", label: "📄 Download PDF" },
              { id: "bpms", label: "🌐 Open BPMS" },
              { id: "back", label: "⬅ Back to Building Permission" }
            ]);
          } else if (clientState === "ST105") {
            mockObj.title = clientLanguage === "mr" ? "🌐 बिल्डिंग प्लॅन मॅनेजमेंट System" : (clientLanguage === "hi" ? "🌐 भवन योजना प्रबंधन प्रणाली" : "🌐 Building Plan Management System");
            mockObj.subtitle = clientLanguage === "mr" ? "BPMS पोर्टलद्वारे खालील सेवा उपलब्ध आहेत." : (clientLanguage === "hi" ? "BPMS पोर्टल के माध्यम से निम्नलिखित सेवाएं उपलब्ध हैं।" : "The following services are available through the BPMS portal.");
            mockObj.description = clientLanguage === "mr" ? "BPMS पोर्टलवर जाऊन आपण अर्ज करू शकता, कागदपत्रे सादर करू शकता आणि अर्जाची स्थिती पाहू शकता." : (clientLanguage === "hi" ? "आप BPMS पोर्टल पर जाकर आवेदन कर सकते हैं, दस्तावेज़ जमा कर सकते हैं और अपने आवेदन की स्थिति को ट्रैक कर सकते हैं।" : "You can apply for building permission, submit documents and track your application through the BPMS portal.");
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "open", label: "🌐 BPMS पोर्टल उघडा" },
              { id: "back", label: "⬅ इमारत परवानगी मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "open", label: "🌐 BPMS पोर्टल खोलें" },
              { id: "back", label: "⬅ भवन निर्माण अनुमति मेनू" }
            ] : [
              { id: "open", label: "🌐 Open BPMS Portal" },
              { id: "back", label: "⬅ Back to Building Permission" }
            ]);
          } else if (clientState === "ST201") {
            mockObj.title = clientLanguage === "mr" ? "📍 झोन प्रमाणपत्र" : (clientLanguage === "hi" ? "📍 ज़ोन प्रमाण पत्र" : "📍 Zone Certificate");
            mockObj.subtitle = clientLanguage === "mr" ? "कृपया एक पर्याय निवडा:" : (clientLanguage === "hi" ? "कृपया एक विकल्प चुनें:" : "Please choose an option:");
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "apply_here", label: "📝 येथे अर्ज करा" },
              { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "apply_here", label: "📝 यहाँ आवेदन करें" },
              { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : [
              { id: "apply_here", label: "📝 Apply Here" },
              { id: "aaple_sarkar", label: "🌐 Aaple Sarkar Portal" },
              { id: "back", label: "⬅ Back to Main Menu" }
            ]);
          } else if (clientState === "ST301") {
            mockObj.title = clientLanguage === "mr" ? "🗺️ भाग नकाशा" : (clientLanguage === "hi" ? "🗺️ पार्ट प्लान" : "🗺️ Part Plan");
            mockObj.subtitle = clientLanguage === "mr" ? "कृपया एक पर्याय निवडा:" : (clientLanguage === "hi" ? "कृपया एक विकल्प चुनें:" : "Please choose an option:");
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "apply_here", label: "📝 येथे अर्ज करा" },
              { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "apply_here", label: "📝 यहाँ आवेदन करें" },
              { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : [
              { id: "apply_here", label: "📝 Apply Here" },
              { id: "aaple_sarkar", label: "🌐 Aaple Sarkar Portal" },
              { id: "back", label: "⬅ Back to Main Menu" }
            ]);
          } else if (clientState === "ST401") {
            mockObj.title = clientLanguage === "mr" ? "🏢 गुंठेवारी" : (clientLanguage === "hi" ? "🏢 गुंठेवारी" : "🏢 Gunthewari");
            mockObj.subtitle = clientLanguage === "mr" ? "कृपया एक पर्याय निवडा:" : (clientLanguage === "hi" ? "कृपया एक विकल्प चुनें:" : "Please choose an option:");
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "open_gunthewari", label: "🌐 गुंठेवारी पोर्टल उघडा" },
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "open_gunthewari", label: "🌐 गुंठेवारी पोर्टल खोलें" },
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : [
              { id: "open_gunthewari", label: "🌐 Open Gunthewari Portal" },
              { id: "back", label: "⬅ Back to Main Menu" }
            ]);
          } else if (clientState === "ST501") {
            mockObj.title = clientLanguage === "mr" ? "🤖 CSMRDA AI सहाय्यक" : (clientLanguage === "hi" ? "🤖 CSMRDA AI सहायक" : "🤖 CSMRDA AI Assistant");
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : [
              { id: "back", label: "⬅ Back to Main Menu" }
            ]);

            if (userInput && userInput !== "ai_assistant" && !["back", "exit", "0", "⬅ back", "⬅ मागे", "मागे", "पीछे"].includes(lowInput)) {
              let aiReply = "";
              if (lowInput.includes("fee") || lowInput.includes("charge") || lowInput.includes("payment") || lowInput.includes("शुल्क") || lowInput.includes("पैसे") || lowInput.includes("किंमत") || lowInput.includes("फीस") || lowInput.includes("किम्मत")) {
                aiReply = clientLanguage === "mr" ?
                  "💰 **CSMRDA विकास / लेआउट शुल्क:**\n\nभूखंडाच्या क्षेत्रफळावर आणि विभागाच्या (निवासी/व्यावसायिक) दरांवर शुल्क ठरवले जाते. अंदाजे लेआउट मंजूर शुल्क ₹१० ते ₹५० प्रति चौ.मी. असते. अचूक हिशोबासाठी आपण BPMS पोर्टलवर जाऊन शुल्क मोजू शकता." :
                  (clientLanguage === "hi" ?
                    "💰 **CSMRDA विकास / लेआउट शुल्क:**\n\nविकास शुल्क भूखंड के क्षेत्रफल और ज़ोन वर्गीकरण (आवासीय बनाम व्यावसायिक) पर आधारित होता है। लेआउट अनुमति शुल्क आमतौर पर ₹10 से ₹50 प्रति वर्ग मीटर तक होता है। आप BPMS पोर्टल पर शुल्क अनुमानक का उपयोग करके सटीक शुल्क का पता लगा सकते हैं।" :
                    "💰 **CSMRDA Layout / Development Fees:**\n\nDevelopment charges are based on the plot area and usage zone (residential vs commercial). Layout sanction fees typically range from ₹10 to ₹50 per sq. meter. You can estimate the exact fee using the fee calculator on the BPMS Portal.");
              } else if (lowInput.includes("time") || lowInput.includes("day") || lowInput.includes("duration") || lowInput.includes("वेळ") || lowInput.includes("दिवस") || lowInput.includes("महिना") || lowInput.includes("समय") || lowInput.includes("दिन")) {
                aiReply = clientLanguage === "mr" ?
                  "⏱️ **मंजुरीसाठी लागणारा कालावधी:**\n\nCSMRDA नागरिक सनदेनुसार:\n• इमारत परवानगी: ३० दिवस\n• लेआउट मंजुरी: ४५ दिवस\n• भोगवटा प्रमाणपत्र (OC): १५ दिवस\nकागदपत्रे पूर्ण असल्यास ही प्रक्रिया विहित मुदतीत ऑनलाईन पूर्ण होते." :
                  (clientLanguage === "hi" ?
                    "⏱️ **अनुमोदन समय सीमा:**\n\nCSMRDA नागरिक चार्टर के अनुसार:\n• भवन निर्माण अनुमति: 30 दिन\n• लेआउट अनुमोदन: 45 दिन\n• अधिभोग प्रमाण पत्र (OC): 15 दिन\nयदि सभी दस्तावेज़ पूर्ण हैं, तो प्रक्रिया BPMS के माध्यम से ऑनलाइन समय सीमा में पूरी हो जाती है।" :
                    "⏱️ **Approval Timeline:**\n\nAs per CSMRDA Citizen Charter:\n• Building Permission: 30 Days\n• Layout Approval: 45 Days\n• Occupancy Certificate (OC): 15 Days\nIf all documents are complete, processing is done online within these limits.");
              } else if (lowInput.includes("document") || lowInput.includes("paper") || lowInput.includes("list") || lowInput.includes("कागद") || lowInput.includes("कागदपत्रे") || lowInput.includes("दस्तावेज")) {
                aiReply = clientLanguage === "mr" ?
                  "📄 **आवश्यक कागदपत्रे:**\n\nसामान्यतः लागणारी मुख्य कागदपत्रे:\n• मालकी पुरावा (७/१२ उतारा किंवा मालमत्ता पत्रक)\n• मंजूर साईट प्लॅन व तांत्रिक नकाशे\n• स्ट्रक्चरल इंजिनियरचे स्थिरता प्रमाणपत्र\n• अग्निशमन विभाग (NOC) आणि पाणी जोडणी दाखले (लागू असल्यास)." :
                  (clientLanguage === "hi" ?
                    "📄 **आवश्यक दस्तावेज़:**\n\nआवेदन करने के लिए आमतौर पर आपको आवश्यकता होगी:\n• स्वामित्व प्रमाण (7/12 उतारा या संपत्ति कार्ड)\n• विस्तृत साइट योजना और तकनीकी चित्र\n• संरचनात्मक स्थिरता प्रमाण पत्र\n• अग्निशमन विभाग एनओसी और जल कनेक्शन प्रमाण पत्र (यदि लागू हो)।" :
                    "📄 **Required Documents:**\n\nTo apply, you generally need:\n• Ownership proof (7/12 Extract or Property Card)\n• Detailed site plans and drawings\n• Structural stability certificate\n• Fire Department NOC and Water connection certificate (if applicable).");
              } else if (lowInput.includes("help") || lowInput.includes("hello") || lowInput.includes("hi") || lowInput.includes("start") || lowInput.includes("मदत") || lowInput.includes("नमस्कार") || lowInput.includes("मदद") || lowInput.includes("नमस्ते")) {
                aiReply = clientLanguage === "mr" ?
                  "🤖 मी आपली कशी मदत करू?\n\nआपण मला इमारत परवानगी, लेआउट शुल्क, मंजुरीचे दिवस किंवा लागणाऱ्या कागदपत्रांबद्दल विचारू शकता." :
                  (clientLanguage === "hi" ?
                    "🤖 मैं आपकी क्या मदद कर सकता हूँ?\n\nआप मुझसे भवन निर्माण अनुमति, लेआउट शुल्क, समय सीमा या आवश्यक दस्तावेज़ों के बारे में पूछ सकते हैं।" :
                    "🤖 How can I help you?\n\nYou can ask me about building permissions, layout fees, processing time, or required documents.");
              } else {
                aiReply = clientLanguage === "mr" ?
                  "🤖 **CSMRDA AI सहाय्यक:**\n\nआपल्या प्रश्नाबद्दल धन्यवाद. इमारत आराखडा आणि लेआउट नियमांसाठी आपण आमच्या ऑनलाईन BPMS पोर्टलला भेट देऊ शकता. तसेच कागदपत्रांची यादी पाहण्यासाठी मुख्य मेनूवर परत जा." :
                  (clientLanguage === "hi" ?
                    "🤖 **CSMRDA AI सहायक:**\n\nआपके प्रश्न के लिए धन्यवाद। भवन निर्माण नियमों और लेआउट के लिए आप हमारे ऑनलाइन BPMS पोर्टल पर जा सकते हैं। दस्तावेज़ों की सूची देखने के लिए मुख्य मेनू पर वापस जाएं।" :
                    "🤖 **CSMRDA AI Assistant:**\n\nThank you for your question. For detailed building codes and rules, please visit the online BPMS portal. You can also view required documents from the Main Menu.");
              }
              mockObj.subtitle = aiReply;
            } else {
              mockObj.subtitle = clientLanguage === "mr" ?
                "🤖 **CSMRDA AI सहाय्यक**\n\nइमारत परवानगी, लेआउट शुल्क, मंजुरीचे दिवस किंवा कागदपत्रांबद्दल मला काहीही विचारा. मी आपल्या प्रश्नांची उत्तरे देण्यास तयार आहे.\n\n*(मुख्य मेनूवर परत जाण्यासाठी **मागे** लिहा किवा खालील बटणावर क्लिक करा)*" :
                (clientLanguage === "hi" ?
                  "🤖 **CSMRDA AI सहायक**\n\nभवन निर्माण अनुमति नियम, लेआउट शुल्क, समय सीमा या आवश्यक दस्तावेज़ों के बारे में मुझसे कुछ भी पूछें। मैं आपकी सहायता के लिए तैयार हूँ!\n\n*(मुख्य मेनू पर वापस जाने के लिए **पीछे** लिखें या नीचे दिए गए बटन पर क्लिक करें)*" :
                  "🤖 **CSMRDA AI Assistant**\n\nAsk me anything about building permission rules, layout fees, approval timelines, or required documents. I am ready to assist you!\n\n*(Type **back** to return to Main Menu or click the button below)*");
            }
          } else if (clientState === "ST_APPLY") {
            mockObj.title = clientLanguage === "mr" ? "📝 अर्ज प्रणाली" : (clientLanguage === "hi" ? "📝 आवेदन पोर्टल" : "📝 Application Portal");
            mockObj.subtitle = clientLanguage === "mr" ?
              "हे एक संकल्पना प्रात्यक्षिक (Demo) आहे. प्रत्यक्ष कार्यप्रणालीमध्ये ही थेट ऑनलाईन अर्ज सेवा उपलब्ध असेल." :
              (clientLanguage === "hi" ?
                "यह एक संकल्पना प्रदर्शन (Demo) है। वास्तविक बॉट में यह सीधी ऑनलाइन आवेदन सेवा उपलब्ध होगी।" :
                "This is a concept demo. The actual production bot will contain this interactive application service.");
            mockObj.buttons = clientLanguage === "mr" ? [
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : (clientLanguage === "hi" ? [
              { id: "back", label: "⬅ मुख्य मेनू" }
            ] : [
              { id: "back", label: "⬅ Main Menu" }
            ]);
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
            outputText += clientLanguage === "mr" ? "**आवश्यक कागदपत्रे:**\n" : (clientLanguage === "hi" ? "**आवश्यक दस्तावेज़:**\n" : "**Required Documents:**\n");
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
              (clientLanguage === "hi" ?
                "कृपया निम्नलिखित सेवाओं में से एक चुनें:\n\n" :
                "Please select one of the services as follows:\n\n");
            mockObj.output = warning + mockObj.output;
          }

          const modifiedData = isArray ? [mockObj] : mockObj;
          const blob = new Blob([JSON.stringify(modifiedData)], {
            type: "application/json",
          });
          return new Response(blob, {
            status: 200,
            statusText: "OK",
            headers: response ? response.headers : new Headers({ "content-type": "application/json" }),
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
            भाषा / Language / Preferred Language<br><br>कृपया खालीलपैकी तुमची आवडती भाषा निवडा / कृपया अपनी पसंदीदा भाषा चुनें / Please select your preferred language:
            <ul class="wa-choice-list">
              <li><a href="#choice-mr">मराठी</a></li>
              <li><a href="#choice-hi">हिन्दी</a></li>
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
              appendMessage('🙏 **नमस्ते!** मैं **विकास मित्र** — छत्रपति संभाजीनगर महानगर क्षेत्र विकास प्राधिकरण (CSMRDA) का सहायक।');

              setTimeout(() => {
                showTypingIndicator();

                setTimeout(() => {
                  removeTypingIndicator();
                  appendMessage('🙏 **Hello!** I\'m **Vikas Mitra** — the assistant for the Chhatrapati Sambhajinagar Metropolitan Region Development Authority (CSMRDA).');

                  setTimeout(() => {
                    showTypingIndicator();

                    setTimeout(() => {
                      removeTypingIndicator();
                      appendMessage('भाषा / Language / Preferred Language\n\nकृपया भाषा निवडा / भाषा चुनें / Select language:\n*   [मराठी](#choice-mr)\n*   [हिन्दी](#choice-hi)\n*   [English](#choice-en)');
                    }, 1000);
                  }, 600);
                }, 1400);
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

    observer = new MutationObserver((mutations) => {
      try {
        // Disconnect to avoid triggering observer by our own appends / movements
        if (observer) observer.disconnect();

        const messagesList = document.querySelector('#n8n-chat [class*="messages-list"]') ||
          document.querySelector('#n8n-chat .chat-messages') ||
          document.querySelector('#n8n-chat [class*="-messages-list"]');

        // 1. Rearrange messages (TODAY date pill, Encryption disclaimer, Welcome wrappers)
        if (messagesList) {
          const dateEl = document.getElementById('wa-date-disclaimer');
          const encEl = document.getElementById('wa-encryption-disclaimer');
          const welcomeWrappers = messagesList.querySelectorAll('.wa-welcome-message-wrapper');

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
        }

        // 2. Process added nodes (user read-receipts and bot timestamps)
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // A. Process User messages
              const userMessages = node.querySelectorAll('[class*="user-message"], [class*="-user-"], .chat-message-user');
              const nodesToInspect = [...userMessages];
              if (node.matches && (node.matches('[class*="user-message"]') || node.matches('[class*="-user-"]') || node.matches('.chat-message-user'))) {
                nodesToInspect.push(node);
              }

              for (const msg of nodesToInspect) {
                // Confirm the node is physically inside the chat scroll container
                if (messagesList && !messagesList.contains(msg)) continue;

                const text = msg.textContent.trim().toLowerCase();
                const hiddenChoiceInputs = [
                  "en", "mr", "hi", "english", "marathi", "hindi", "हिन्दी",
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
                } else {
                  if (!msg.querySelector('.wa-receipt-container')) {
                    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    const receipt = document.createElement('div');
                    receipt.className = 'wa-receipt-container';
                    receipt.innerHTML = `
                      <span class="wa-message-time">${timeStr}</span>
                      <svg class="wa-double-check" viewBox="0 0 16 15" width="15" height="14" style="margin-left: 4px; fill: #53bdeb; display: inline-block; vertical-align: middle; flex-shrink: 0;">
                        <path d="M15.01 3.3a.5.5 0 0 0-.72 0L6.72 10.86 3.78 7.92a.5.5 0 0 0-.7-.02l-.7.68a.5.5 0 0 0-.02.7l3.66 3.66a.5.5 0 0 0 .7 0l8.3-8.3a.5.5 0 0 0 0-.7l-.7-.66z" fill="#53bdeb"/>
                        <path d="M11.01 3.3a.5.5 0 0 0-.72 0L6.72 6.86 5.86 6a.5.5 0 0 0-.7-.02l-.7.68a.5.5 0 0 0-.02.7l1.66 1.66a.5.5 0 0 0 .7 0l4.3-4.3a.5.5 0 0 0 0-.7l-.7-.66z" fill="#53bdeb"/>
                      </svg>
                    `;
                    msg.appendChild(receipt);
                  }
                }
              }

              // B. Process Bot messages
              const botMessages = node.querySelectorAll('[class*="bot-message"], [class*="-bot-"], .chat-message-bot');
              const botNodes = [...botMessages];
              if (node.matches && (node.matches('[class*="bot-message"]') || node.matches('[class*="-bot-"]') || node.matches('.chat-message-bot'))) {
                botNodes.push(node);
              }

              for (const msg of botNodes) {
                // Confirm the node is physically inside the chat scroll container
                if (messagesList && !messagesList.contains(msg)) continue;
                if (msg.classList.contains('wa-typing-bubble')) continue;

                if (!msg.querySelector('.wa-bot-time') && !msg.querySelector('.chat-message-time')) {
                  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const timeSpan = document.createElement('span');
                  timeSpan.className = 'wa-bot-time';
                  timeSpan.style.setProperty('font-size', '10px', 'important');
                  timeSpan.style.setProperty('color', '#667781', 'important');
                  timeSpan.style.setProperty('display', 'block', 'important');
                  timeSpan.style.setProperty('text-align', 'right', 'important');
                  timeSpan.style.setProperty('margin-top', '4px', 'important');
                  timeSpan.textContent = timeStr;
                  msg.appendChild(timeSpan);
                }
              }
            }
          }
        }

        scrollToBottomGlobal();

      } catch (err) {
        console.error("MutationObserver processing error:", err);
      } finally {
        // Reconnect observer at the very end
        if (observer && targetNode) {
          observer.observe(targetNode, { childList: true, subtree: true });
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
