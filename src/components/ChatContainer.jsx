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

          const actionUrls = {
            download_pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            bpms: "https://mahavastu.maharashtra.gov.in/",
            open_bpms: "https://mahavastu.maharashtra.gov.in/",
            register: "https://aaplesarkar.mahaonline.gov.in/en/Registration/Register",
            login: "https://aaplesarkar.mahaonline.gov.in/en/Login/Login",
            track_application: "https://aaplesarkar.mahaonline.gov.in/en/TrackApplication/Index",
            open_portal: "https://aaplesarkar.mahaonline.gov.in/",
            open_gunthewari: "https://gunthevari-form.csmrda.in/"
          };

          if (actionUrls[choice]) {
            window.open(actionUrls[choice], "_blank");
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

    const STATE_DATA = {
      ST001: {
        title: {
          en: "Welcome to CSMRDA Digital Assistant",
          mr: "CSMRDA डिजिटल सहाय्यकामध्ये आपले स्वागत आहे",
          hin: "CSMRDA डिजिटल सहायक में आपका स्वागत है"
        },
        subtitle: {
          en: "Please choose your preferred language",
          mr: "कृपया आपली आवडती भाषा निवडा",
          hin: "कृपया अपनी पसंदीदा भाषा चुनें"
        },
        buttons: {
          en: [
            { id: "en", label: "🇬🇧 English" },
            { id: "mr", label: "🇮🇳 मराठी" },
            { id: "hindi", label: "🇮🇳 हिन्दी" }
          ],
          mr: [
            { id: "en", label: "🇬🇧 English" },
            { id: "mr", label: "🇮🇳 मराठी" },
            { id: "hindi", label: "🇮🇳 हिन्दी" }
          ],
          hin: [
            { id: "en", label: "🇬🇧 English" },
            { id: "mr", label: "🇮🇳 मराठी" },
            { id: "hindi", label: "🇮🇳 हिन्दी" }
          ]
        }
      },
      ST002: {
        title: {
          en: "🏛 CSMRDA Digital Assistant",
          mr: "🏛 CSMRDA डिजिटल सहाय्यक",
          hin: "🏛 CSMRDA डिजिटल सहायक"
        },
        subtitle: {
          en: "Choose the service you need.",
          mr: "आपल्याला आवश्यक असलेली सेवा निवडा.",
          hin: "कृपया आवश्यक सेवा चुनें।"
        },
        description: {
          en: "Select one of the services below. Each service provides application guidance, required documents, and access to the official CSMRDA portal.",
          mr: "खालील सेवांपैकी एक निवडा. प्रत्येक सेवेमध्ये अर्ज प्रक्रिया, आवश्यक कागदपत्रे आणि अधिकृत पोर्टलची माहिती उपलब्ध आहे.",
          hin: "नीचे दी गई सेवाओं में से किसी एक का चयन करें। प्रत्येक सेवा में आवेदन प्रक्रिया, आवश्यक दस्तावेज़ और आधिकारिक पोर्टल की जानकारी उपलब्ध है।"
        },
        buttons: {
          en: [
            { id: "building_permission", label: "🏢 Building Permission" },
            { id: "zone_certificate", label: "📍 Zone Certificate" },
            { id: "part_plan", label: "🗺️ Part Plan" },
            { id: "gunthewari", label: "🏘️ Gunthewari" },
            { id: "ai_assistant", label: "🤖 AI Assistant" }
          ],
          mr: [
            { id: "building_permission", label: "🏢 इमारत परवानगी" },
            { id: "zone_certificate", label: "📍 झोन प्रमाणपत्र" },
            { id: "part_plan", label: "🗺️ भाग नकाशा" },
            { id: "gunthewari", label: "🏘️ गुठेवारी" },
            { id: "ai_assistant", label: "🤖 AI सहाय्यक" }
          ],
          hin: [
            { id: "building_permission", label: "🏢 भवन अनुमति" },
            { id: "zone_certificate", label: "📍 ज़ोन प्रमाणपत्र" },
            { id: "part_plan", label: "🗺️ पार्ट प्लान" },
            { id: "gunthewari", label: "🏘️ गुंठेवारी" },
            { id: "ai_assistant", label: "🤖 AI सहायक" }
          ]
        }
      },
      ST101: {
        title: {
          en: "🏢 Building Permission Services",
          mr: "🏢 इमारत परवानगी सेवा",
          hin: "🏢 भवन अनुमति सेवाएँ"
        },
        subtitle: {
          en: "Please select a service.",
          mr: "कृपया आवश्यक सेवा निवडा.",
          hin: "कृपया आवश्यक सेवा चुनें।"
        },
        description: {
          en: "This section provides access to Layout Approval, Building Permission documents, Occupancy Certificate information, and the official BPMS portal.",
          mr: "इमारत परवानगी विभागातून लेआउट मंजुरी, इमारत परवानगी, भोगवटा प्रमाणपत्र आणि अधिकृत BPMS पोर्टलचा वापर करता येईल.",
          hin: "भवन अनुमति अनुभाग से लेआउट स्वीकृति, भवन अनुमति, अधिभोग प्रमाणपत्र तथा आधिकारिक BPMS पोर्टल का उपयोग किया जा सकता है।"
        },
        buttons: {
          en: [
            { id: "layout_documents", label: "📄 Layout Approval Documents" },
            { id: "building_documents", label: "🏗️ Building Permission Documents" },
            { id: "occupancy_documents", label: "🏠 Occupancy Certificate" },
            { id: "open_bpms", label: "🌐 BPMS Portal" },
            { id: "back", label: "⬅ Back to Dashboard" }
          ],
          mr: [
            { id: "layout_documents", label: "📄 लेआउट मंजुरी कागदपत्रे" },
            { id: "building_documents", label: "🏗️ इमारत परवानगी कागदपत्रे" },
            { id: "occupancy_documents", label: "🏠 भोगवटा प्रमाणपत्र" },
            { id: "open_bpms", label: "🌐 BPMS पोर्टल" },
            { id: "back", label: "⬅ मुख्य मेनू" }
          ],
          hin: [
            { id: "layout_documents", label: "📄 लेआउट स्वीकृति दस्तावेज़" },
            { id: "building_documents", label: "🏗️ भवन अनुमति दस्तावेज़" },
            { id: "occupancy_documents", label: "🏠 अधिभोग प्रमाणपत्र" },
            { id: "open_bpms", label: "🌐 BPMS पोर्टल" },
            { id: "back", label: "⬅ मुख्य मेनू" }
          ]
        }
      },
      ST102: {
        title: {
          en: "📄 Layout Approval Documents",
          mr: "📄 लेआउट मंजुरी कागदपत्रे",
          hin: "📄 लेआउट स्वीकृति दस्तावेज़"
        },
        subtitle: {
          en: "Required Documents for Layout Approval",
          mr: "लेआउट मंजुरीसाठी आवश्यक कागदपत्रे",
          hin: "लेआउट स्वीकृति के लिए आवश्यक दस्तावेज़"
        },
        description: {
          en: "Download the list of required documents for Layout Approval or continue to the official BPMS portal.",
          mr: "लेआउट मंजुरी अर्जासाठी आवश्यक कागदपत्रांची यादी डाउनलोड करा किंवा अधिकृत BPMS पोर्टलवर पुढे जा.",
          hin: "लेआउट स्वीकृति आवेदन के लिए आवश्यक दस्तावेज़ों की सूची डाउनलोड करें या आधिकारिक BPMS पोर्टल पर जाएँ।"
        },
        documentList: {
          en: [
            "Proof of Ownership (7/12 Extract / Property Card)",
            "Copy of Approved Layout Plan",
            "Measurement Plan (Mojani Sheet)",
            "Certificate from Registered Architect",
            "Affidavit and Undertaking"
          ],
          mr: [
            "मालकी हक्काचा पुरावा (७/१२ उतारा / मालमत्ता पत्रक)",
            "मंजूर लेआउट नकाशा प्रत",
            "मोजणी नकाशा (Mojani Plan)",
            "नोंदणीकृत आर्किटेक्टचे प्रमाणपत्र",
            "प्रतिज्ञापत्र आणि हमीपत्र"
          ],
          hin: [
            "स्वामित्व का प्रमाण (7/12 उद्धरण / संपत्ति पत्रक)",
            "स्वीकृत लेआउट योजना की प्रति",
            "मापन नक्शा (मोजणी योजना)",
            "पंजीकृत आर्किटेक्ट का प्रमाण पत्र",
            "शपथ पत्र और वचन पत्र"
          ]
        },
        buttons: {
          en: [
            { id: "download_pdf", label: "⬇️ Download Layout Approval Documents" },
            { id: "bpms", label: "🌐 Open BPMS Portal" },
            { id: "back", label: "⬅ Building Permission" }
          ],
          mr: [
            { id: "download_pdf", label: "⬇️ लेआउट मंजुरी कागदपत्रे डाउनलोड करा" },
            { id: "bpms", label: "🌐 BPMS पोर्टल उघडा" },
            { id: "back", label: "⬅ इमारत परवानगी" }
          ],
          hin: [
            { id: "download_pdf", label: "⬇️ लेआउट स्वीकृति दस्तावेज़ डाउनलोड करें" },
            { id: "bpms", label: "🌐 BPMS पोर्टल खोलें" },
            { id: "back", label: "⬅ भवन अनुमति" }
          ]
        }
      },
      ST103: {
        title: {
          en: "🏗️ Building Permission Documents",
          mr: "🏗️ इमारत परवानगी कागदपत्रे",
          hin: "🏗️ भवन अनुमति दस्तावेज़"
        },
        subtitle: {
          en: "Required Documents for Building Permission",
          mr: "इमारत परवानगीसाठी आवश्यक कागदपत्रे",
          hin: "भवन अनुमति के लिए आवश्यक दस्तावेज़"
        },
        description: {
          en: "Download the official list of required documents for Building Permission or continue to the BPMS portal to submit your application.",
          mr: "इमारत परवानगी अर्जासाठी आवश्यक कागदपत्रांची अधिकृत यादी डाउनलोड करा किंवा BPMS पोर्टलवर पुढे जा.",
          hin: "भवन अनुमति आवेदन के लिए आवश्यक दस्तावेज़ों की आधिकारिक सूची डाउनलोड करें या BPMS पोर्टल पर जाएँ।"
        },
        documentList: {
          en: [
            "7/12 Extract or Property Card (Latest)",
            "Sale Deed / Ownership Title Documents",
            "Approved Layout or Subdivision Plan",
            "Proposed Building Plan Layout",
            "Structural Design & Stability Certificate",
            "Relevant No Objection Certificates (NOCs)"
          ],
          mr: [
            "७/१२ उतारा किंवा मालमत्ता पत्रक (अद्ययावत)",
            "खरेदीखत / मालकी हक्क हस्तांतरण दस्तऐवज",
            "मंजूर लेआउट किंवा रेखांकन नकाशा",
            "इमारत नकाशा (प्रस्तावित बांधकाम आराखडा)",
            "स्ट्रक्चरल डिझाइन आणि स्थिरता प्रमाणपत्र",
            "संबंधित ना-हरकत प्रमाणपत्रे (NOCs)"
          ],
          hin: [
            "7/12 उद्धरण या संपत्ति पत्रक (नवीनतम)",
            "बिक्री विलेख / स्वामित्व हस्तांतरण दस्तावेज",
            "स्वीकृत लेआउट या रेखांकन नक्शा",
            "भवन योजना (प्रस्तावित निर्माण योजना)",
            "संरचनात्मक डिजाइन और स्थिरता प्रमाण पत्र",
            "संबंधित अनापत्ति प्रमाण पत्र (NOC)"
          ]
        },
        buttons: {
          en: [
            { id: "download_pdf", label: "⬇️ Download Building Permission Documents" },
            { id: "bpms", label: "🌐 Open BPMS Portal" },
            { id: "back", label: "⬅ Building Permission" }
          ],
          mr: [
            { id: "download_pdf", label: "⬇️ इमारत परवानगी कागदपत्रे डाउनलोड करा" },
            { id: "bpms", label: "🌐 BPMS पोर्टल उघडा" },
            { id: "back", label: "⬅ इमारत परवानगी" }
          ],
          hin: [
            { id: "download_pdf", label: "⬇️ भवन अनुमति दस्तावेज़ डाउनलोड करें" },
            { id: "bpms", label: "🌐 BPMS पोर्टल खोलें" },
            { id: "back", label: "⬅ भवन अनुमति" }
          ]
        }
      },
      ST104: {
        title: {
          en: "🏠 Occupancy Certificate",
          mr: "🏠 भोगवटा प्रमाणपत्र",
          hin: "🏠 अधिभोग प्रमाणपत्र"
        },
        subtitle: {
          en: "Required Documents for Occupancy Certificate",
          mr: "भोगवटा प्रमाणपत्रासाठी आवश्यक कागदपत्रे",
          hin: "अधिभोग प्रमाणपत्र के लिए आवश्यक दस्तावेज़"
        },
        description: {
          en: "Download the official list of required documents for the Occupancy Certificate or continue to the BPMS portal.",
          mr: "भोगवटा प्रमाणपत्रासाठी आवश्यक कागदपत्रांची अधिकृत यादी डाउनलोड करा किंवा BPMS पोर्टलवर पुढे जा.",
          hin: "अधिभोग प्रमाणपत्र के लिए आवश्यक दस्तावेज़ों की आधिकारिक सूची डाउनलोड करें या BPMS पोर्टल पर जाएँ।"
        },
        documentList: {
          en: [
            "Building Completion Certificate",
            "Construction Completion Certificate from Architect",
            "Drainage & Sewerage Connection NOC",
            "Drinking Water Supply Receipt",
            "Elevator Safety License (if applicable)",
            "Final Fire Department NOC"
          ],
          mr: [
            "इमारत पूर्णत्व दाखला (Completion Certificate)",
            "आर्किटेक्टचे बांधकाम पूर्णता प्रमाणपत्र",
            "सांडपाणी आणि पाणी जोडणी दाखला",
            "पिण्याच्या पाण्याच्या नळ जोडणीची पावती",
            "लिफ्ट सुरक्षा प्रमाणपत्र (लागू असल्यास)",
            "अग्निशमन विभागाचे अंतिम ना हरकत प्रमाणपत्र (Fire NOC)"
          ],
          hin: [
            "भवन पूर्णता प्रमाण पत्र (Completion Certificate)",
            "आर्किटेक्ट का निर्माण पूर्णता प्रमाण पत्र",
            "जल निकासी कनेक्शन अनापत्ति प्रमाण पत्र",
            "पेयजल नल कनेक्शन की रसीद",
            "लिफ्ट सुरक्षा प्रमाण पत्र (यदि लागू हो)",
            "अग्निशमन विभाग का अंतिम अनापत्ति प्रमाण पत्र (Fire NOC)"
          ]
        },
        buttons: {
          en: [
            { id: "download_pdf", label: "⬇️ Download Occupancy Certificate Documents" },
            { id: "bpms", label: "🌐 Open BPMS Portal" },
            { id: "back", label: "⬅ Building Permission" }
          ],
          mr: [
            { id: "download_pdf", label: "⬇️ भोगवटा प्रमाणपत्र कागदपत्रे डाउनलोड करा" },
            { id: "bpms", label: "🌐 BPMS पोर्टल उघडा" },
            { id: "back", label: "⬅ इमारत परवानगी" }
          ],
          hin: [
            { id: "download_pdf", label: "⬇️ अधिभोग प्रमाणपत्र दस्तावेज़ डाउनलोड करें" },
            { id: "bpms", label: "🌐 BPMS पोर्टल खोलें" },
            { id: "back", label: "⬅ भवन अनुमति" }
          ]
        }
      },
      ST105: {
        title: {
          en: "🌐 BPMS Portal",
          mr: "🌐 BPMS पोर्टल",
          hin: "🌐 BPMS पोर्टल"
        },
        subtitle: {
          en: "Proceed to the Official BPMS Portal.",
          mr: "अधिकृत BPMS पोर्टलकडे जा.",
          hin: "आधिकारिक BPMS पोर्टल पर जाएँ।"
        },
        description: {
          en: "Use the official BPMS Portal for Building Permission applications, application tracking and other online services.",
          mr: "इमारत परवानगी, अर्ज सादर करणे, अर्जाची स्थिती आणि इतर ऑनलाइन सेवांसाठी अधिकृत BPMS पोर्टल वापरा.",
          hin: "भवन अनुमति, आवेदन जमा करने, आवेदन की स्थिति तथा अन्य ऑनलाइन सेवाओं के लिए आधिकारिक BPMS पोर्टल का उपयोग करें।"
        },
        buttons: {
          en: [
            { id: "open_bpms", label: "🌐 Open BPMS Portal" },
            { id: "back", label: "⬅ Building Permission" }
          ],
          mr: [
            { id: "open_bpms", label: "🌐 BPMS पोर्टल उघडा" },
            { id: "back", label: "⬅ इमारत परवानगी" }
          ],
          hin: [
            { id: "open_bpms", label: "🌐 BPMS पोर्टल खोलें" },
            { id: "back", label: "⬅ भवन अनुमति" }
          ]
        }
      },
      ST201: {
        title: {
          en: "📍 Zone Certificate Services",
          mr: "📍 झोन प्रमाणपत्र सेवा",
          hin: "📍 ज़ोन प्रमाणपत्र सेवाएँ"
        },
        subtitle: {
          en: "Please select a service.",
          mr: "कृपया आवश्यक सेवा निवडा.",
          hin: "कृपया आवश्यक सेवा चुनें।"
        },
        description: {
          en: "Choose from the options below to obtain a Zone Certificate.",
          mr: "झोन प्रमाणपत्र मिळवण्यासाठी खालील पर्याय निवडा.",
          hin: "ज़ोन प्रमाणपत्र प्राप्त करने के लिए निम्नलिखित विकल्प चुनें।"
        },
        buttons: {
          en: [
            { id: "apply_here", label: "📝 Apply Here" },
            { id: "aaple_sarkar", label: "🌐 Aaple Sarkar Portal" },
            { id: "back", label: "⬅ Back to Dashboard" }
          ],
          mr: [
            { id: "apply_here", label: "📝 येथे अर्ज करा" },
            { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
            { id: "back", label: "⬅ मुख्य मेनू" }
          ],
          hin: [
            { id: "apply_here", label: "📝 यहाँ आवेदन करें" },
            { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
            { id: "back", label: "⬅ मुख्य मेनू" }
          ]
        }
      },
      ST202: {
        title: {
          en: "📝 Zone Certificate Application",
          mr: "📝 झोन प्रमाणपत्र अर्ज",
          hin: "📝 ज़ोन प्रमाणपत्र आवेदन"
        },
        subtitle: {
          en: "Choose one of the options below to proceed with your application.",
          mr: "अर्ज करण्यासाठी खालीलपैकी एक पर्याय निवडा.",
          hin: "आवेदन करने के लिए निम्नलिखित में से कोई एक विकल्प चुनें।"
        },
        description: {
          en: "Zone Certificates are issued online via the Aaple Sarkar portal. Registration is required before applying.",
          mr: "झोन प्रमाणपत्र आपले सरकार पोर्टलद्वारे ऑनलाइन दिले जाते. अर्ज करण्यासाठी प्रथम नोंदणी आवश्यक आहे.",
          hin: "ज़ोन प्रमाणपत्र आपले सरकार पोर्टल के माध्यम से ऑनलाइन जारी किया जाता है। आवेदन के लिए पहले पंजीकरण आवश्यक है।"
        },
        buttons: {
          en: [
            { id: "register", label: "📝 Register on Portal" },
            { id: "login", label: "🔑 Login to Apply" },
            { id: "track_application", label: "🔍 Track Application" },
            { id: "back", label: "⬅ Zone Certificate" }
          ],
          mr: [
            { id: "register", label: "📝 नोंदणी करा" },
            { id: "login", label: "🔑 लॉग इन करा" },
            { id: "track_application", label: "🔍 अर्जाचा मागोवा घ्या" },
            { id: "back", label: "⬅ झोन प्रमाणपत्र" }
          ],
          hin: [
            { id: "register", label: "📝 पंजीकरण करें" },
            { id: "login", label: "🔑 लॉगिन करें" },
            { id: "track_application", label: "🔍 आवेदन ट्रैक करें" },
            { id: "back", label: "⬅ ज़ोन प्रमाणपत्र" }
          ]
        }
      },
      ST203: {
        title: {
          en: "🌐 Aaple Sarkar Portal",
          mr: "🌐 आपले सरकार पोर्टल",
          hin: "🌐 आपले सरकार पोर्टल"
        },
        subtitle: {
          en: "Proceed to Aaple Sarkar Portal.",
          mr: "आपले सरकार पोर्टलवर जा.",
          hin: "आपले सरकार पोर्टल पर जाएँ।"
        },
        description: {
          en: "Access various citizen-centric services on the official Aaple Sarkar portal of the Government of Maharashtra.",
          mr: "महाराष्ट्र शासनाचे अधिकृत नागरिक सेवा पोर्टल (आपले सरकार) द्वारे विविध सेवांचा लाभ घ्या.",
          hin: "महाराष्ट्र सरकार के आधिकारिक नागरिक सेवा पोर्टल (आपले सरकार) के माध्यम से विभिन्न सेवाओं का लाभ उठाएं।"
        },
        buttons: {
          en: [
            { id: "open_portal", label: "🌐 Open Aaple Sarkar Portal" },
            { id: "back", label: "⬅ Zone Certificate" }
          ],
          mr: [
            { id: "open_portal", label: "🌐 आपले सरकार पोर्टल उघडा" },
            { id: "back", label: "⬅ झोन प्रमाणपत्र" }
          ],
          hin: [
            { id: "open_portal", label: "🌐 आपले सरकार पोर्टल खोलें" },
            { id: "back", label: "⬅ ज़ोन प्रमाणपत्र" }
          ]
        }
      },
      ST301: {
        title: {
          en: "🗺️ Part Plan Services",
          mr: "🗺️ भाग नकाशा (Part Plan)",
          hin: "🗺️ पार्ट प्लान (Part Plan)"
        },
        subtitle: {
          en: "Please select a service.",
          mr: "कृपया आवश्यक सेवा निवडा.",
          hin: "कृपया आवश्यक सेवा चुनें।"
        },
        description: {
          en: "Select an option below to obtain a Part Plan.",
          mr: "भाग नकाशा मिळवण्यासाठी खालील पर्याय निवडा.",
          hin: "पार्ट प्लान प्राप्त करने के लिए निम्नलिखित विकल्प चुनें।"
        },
        buttons: {
          en: [
            { id: "apply_here", label: "📝 Apply Here" },
            { id: "aaple_sarkar", label: "🌐 Aaple Sarkar Portal" },
            { id: "back", label: "⬅ Back to Dashboard" }
          ],
          mr: [
            { id: "apply_here", label: "📝 येथे अर्ज करा" },
            { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
            { id: "back", label: "⬅ मुख्य मेनू" }
          ],
          hin: [
            { id: "apply_here", label: "📝 यहाँ आवेदन करें" },
            { id: "aaple_sarkar", label: "🌐 आपले सरकार पोर्टल" },
            { id: "back", label: "⬅ मुख्य मेनू" }
          ]
        }
      },
      ST302: {
        title: {
          en: "📝 Part Plan Application",
          mr: "📝 भाग नकाशा अर्ज",
          hin: "📝 पार्ट प्लान आवेदन"
        },
        subtitle: {
          en: "Choose one of the options below to proceed with your application.",
          mr: "अर्ज करण्यासाठी खालीलपैकी एक पर्याय निवडा.",
          hin: "आवेदन करने के लिए निम्नलिखित में से कोई एक विकल्प चुनें।"
        },
        description: {
          en: "Part Plans can be obtained online via the Aaple Sarkar portal. Registration is required before applying.",
          mr: "भाग नकाशा आपले सरकार पोर्टलद्वारे ऑनलाइन मिळवता येतो. अर्ज करण्यासाठी प्रथम नोंदणी आवश्यक आहे.",
          hin: "पार्ट प्लान आपले सरकार पोर्टल के माध्यम से ऑनलाइन प्राप्त किया जा सकता है। आवेदन के लिए पहले पंजीकरण आवश्यक है।"
        },
        buttons: {
          en: [
            { id: "register", label: "📝 Register on Portal" },
            { id: "login", label: "🔑 Login to Apply" },
            { id: "track_application", label: "🔍 Track Application" },
            { id: "back", label: "⬅ Part Plan" }
          ],
          mr: [
            { id: "register", label: "📝 नोंदणी करा" },
            { id: "login", label: "🔑 लॉग इन करा" },
            { id: "track_application", label: "🔍 अर्जाचा मागोवा घ्या" },
            { id: "back", label: "⬅ भाग नकाशा" }
          ],
          hin: [
            { id: "register", label: "📝 पंजीकरण करें" },
            { id: "login", label: "🔑 लॉगिन करें" },
            { id: "track_application", label: "🔍 आवेदन ट्रैक करें" },
            { id: "back", label: "⬅ पार्ट प्लान" }
          ]
        }
      },
      ST303: {
        title: {
          en: "🌐 Aaple Sarkar Portal",
          mr: "🌐 आपले सरकार पोर्टल",
          hin: "🌐 आपले सरकार पोर्टल"
        },
        subtitle: {
          en: "Proceed to Aaple Sarkar Portal.",
          mr: "आपले सरकार पोर्टलवर जा.",
          hin: "आपले सरकार पोर्टल पर जाएँ।"
        },
        description: {
          en: "Access various citizen-centric services on the official Aaple Sarkar portal of the Government of Maharashtra.",
          mr: "महाराष्ट्र शासनाचे अधिकृत नागरिक सेवा पोर्टल (आपले सरकार) द्वारे विविध सेवांचा लाभ घ्या.",
          hin: "महाराष्ट्र सरकार के आधिकारिक नागरिक सेवा पोर्टल (आपले सरकार) के माध्यम से विभिन्न सेवाओं का लाभ उठाएं।"
        },
        buttons: {
          en: [
            { id: "open_portal", label: "🌐 Open Aaple Sarkar Portal" },
            { id: "back", label: "⬅ Part Plan" }
          ],
          mr: [
            { id: "open_portal", label: "🌐 आपले सरकार पोर्टल उघडा" },
            { id: "back", label: "⬅ भाग नकाशा" }
          ],
          hin: [
            { id: "open_portal", label: "🌐 आपले सरकार पोर्टल खोलें" },
            { id: "back", label: "⬅ पार्ट प्लान" }
          ]
        }
      },
      ST401: {
        title: {
          en: "🏘️ Gunthewari Regularization Services",
          mr: "🏘️ गुंठेवारी नियमन सेवा",
          hin: "🏘️ गुंठेवारी नियमितीकरण सेवा"
        },
        subtitle: {
          en: "Proceed to the Official Gunthewari Portal.",
          mr: "अधिकृत गुंठेवारी पोर्टलकडे जा.",
          hin: "आधिकारिक गुंठेवारी पोर्टल पर जाएँ।"
        },
        description: {
          en: "Open the official portal to get more information regarding Gunthewari regularization or to submit an online application.",
          mr: "गुंठेवारी भागाच्या नियमितीकरणाबाबत अधिक माहिती मिळवण्यासाठी किंवा ऑनलाईन अर्ज सादर करण्यासाठी अधिकृत पोर्टल उघडा.",
          hin: "गुंठेवारी क्षेत्र के नियमितीकरण के बारे में अधिक जानकारी प्राप्त करने या ऑनलाइन आवेदन जमा करने के लिए आधिकारिक पोर्टल खोलें।"
        },
        buttons: {
          en: [
            { id: "open_gunthewari", label: "🌐 Open Gunthewari Portal" },
            { id: "back", label: "⬅ Back to Dashboard" }
          ],
          mr: [
            { id: "open_gunthewari", label: "🌐 गुंठेवारी पोर्टल उघडा" },
            { id: "back", label: "⬅ मुख्य मेनू" }
          ],
          hin: [
            { id: "open_gunthewari", label: "🌐 गुंठेवारी पोर्टल खोलें" },
            { id: "back", label: "⬅ मुख्य मेनू" }
          ]
        }
      },
      ST501: {
        title: {
          en: "🤖 AI Assistant Mode",
          mr: "🤖 AI सहाय्यक मोड",
          hin: "🤖 AI सहायक मोड"
        },
        subtitle: {
          en: "I am ready to help you.",
          mr: "मी तुम्हाला मदत करण्यासाठी तयार आहे.",
          hin: "मैं आपकी सहायता करने के लिए तैयार हूँ।"
        },
        description: {
          en: "You are now chatting with the AI Assistant. Ask me anything about CSMRDA services, rules, fees, or documents. To return to the main menu, click the button below.",
          mr: "आपण आता AI सहाय्यकासोबत बोलत आहात. मला CSMRDA च्या सेवा, नियम, किंवा आवश्यक कागदपत्रांविषयी काहीही विचारा. मुख्य मेनूमध्ये परत जाण्यासाठी खालील बटणावर क्लिक करा.",
          hin: "अब आप AI सहायक के साथ बातचीत कर रहे हैं। मुझसे CSMRDA की सेवाओं, नियमों, या आवश्यक दस्तावेज़ों के बारे में कुछ भी पूछें। मुख्य मेनू पर लौटने के लिए नीचे दिए गए बटन पर क्लिक करें।"
        },
        buttons: {
          en: [
            { id: "back", label: "⬅ Back to Dashboard" }
          ],
          mr: [
            { id: "back", label: "⬅ मुख्य मेनू" }
          ],
          hin: [
            { id: "back", label: "⬅ मुख्य मेनू" }
          ]
        }
      }
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
        const lowInput = userInput.toLowerCase();

        // Handle direct start triggering
        if (["hi", "hello", "hey", "start", "/start", "menu", ""].includes(lowInput)) {
          clientState = "ST001";
        } else if (userInput) {
          // Define all standard choice actions to check against
          const validChoiceInputs = [
            "en", "mr", "hi", "english", "marathi", "hindi", "hello", "start", "",
            "building_permission", "zone_certificate", "part_plan", "gunthewari", "ai_assistant",
            "layout_documents", "building_documents", "occupancy_documents", "open_bpms",
            "download_pdf", "bpms", "back", "open", "open_portal",
            "apply_here", "aaple_sarkar", "register", "login", "track",
            "open_registration", "open_login", "track_application", "open_gunthewari",
            "0", "1", "2", "3", "4"
          ];

          if (!validChoiceInputs.includes(lowInput) && clientState !== "ST501") {
            isRandomMsg = true;
            // Map default trigger by language
            const trigger = clientLanguage === "mr" ? "mr" : (clientLanguage === "hin" ? "hi" : "en");
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

        let targetObj = null;
        let isArray = false;
        let fetchedSuccessfully = false;

        try {
          const response = await originalFetch.apply(this, args);
          if (response.ok) {
            const clonedResponse = response.clone();
            const data = await clonedResponse.json();
            isArray = Array.isArray(data);
            targetObj = isArray ? data[0] : data;
            fetchedSuccessfully = true;
          }
        } catch (error) {
          console.warn("Fetch failed, using client state machine simulator:", error);
        }

        if (!fetchedSuccessfully || !targetObj || !targetObj.output || targetObj.current_state === "ST001" || targetObj.screen === "Welcome") {
          const lowInput = userInput.toLowerCase();
          let nextScreen = "";
          const is = (...vals) => vals.includes(lowInput);

          if (["hi", "hello", "hey", "start", "/start", "menu", ""].includes(lowInput)) {
            nextScreen = "ST001";
          } else if (clientState === "ST001") {
            if (is("0", "english", "en", "gb")) {
              clientLanguage = "en";
              nextScreen = "ST002";
            } else if (is("1", "marathi", "mr", "in")) {
              clientLanguage = "mr";
              nextScreen = "ST002";
            } else if (is("2", "hindi", "hin", "hi")) {
              clientLanguage = "hin";
              nextScreen = "ST002";
            }
          } else if (clientState === "ST002") {
            if (is("0", "building_permission")) {
              nextScreen = "ST101";
            } else if (is("1", "zone_certificate")) {
              nextScreen = "ST201";
            } else if (is("2", "part_plan")) {
              nextScreen = "ST301";
            } else if (is("3", "gunthewari")) {
              nextScreen = "ST401";
            } else if (is("4", "ai_assistant")) {
              nextScreen = "ST501";
            }
          } else if (clientState === "ST101") {
            if (is("0", "layout_documents")) {
              nextScreen = "ST102";
            } else if (is("1", "building_documents")) {
              nextScreen = "ST103";
            } else if (is("2", "occupancy_documents")) {
              nextScreen = "ST104";
            } else if (is("3", "open_bpms")) {
              nextScreen = "ST105";
            } else if (is("4", "back")) {
              nextScreen = "ST002";
            }
          } else if (clientState === "ST102") {
            if (is("0", "download_pdf")) {
              nextScreen = "DOWNLOAD_LAYOUT";
            } else if (is("1", "bpms")) {
              nextScreen = "ST105";
            } else if (is("2", "back")) {
              nextScreen = "ST101";
            }
          } else if (clientState === "ST103") {
            if (is("0", "download_pdf")) {
              nextScreen = "DOWNLOAD_BUILDING_PERMISSION";
            } else if (is("1", "bpms")) {
              nextScreen = "ST105";
            } else if (is("2", "back")) {
              nextScreen = "ST101";
            }
          } else if (clientState === "ST104") {
            if (is("0", "download_pdf")) {
              nextScreen = "DOWNLOAD_OCCUPANCY";
            } else if (is("1", "bpms")) {
              nextScreen = "ST105";
            } else if (is("2", "back")) {
              nextScreen = "ST101";
            }
          } else if (clientState === "ST105") {
            if (is("0", "open_bpms")) {
              nextScreen = "OPEN_BPMS";
            } else if (is("1", "back")) {
              nextScreen = "ST101";
            }
          } else if (clientState === "ST201") {
            if (is("0", "apply_here")) {
              nextScreen = "ST202";
            } else if (is("1", "aaple_sarkar")) {
              nextScreen = "ST203";
            } else if (is("2", "back")) {
              nextScreen = "ST002";
            }
          } else if (clientState === "ST202") {
            if (is("0", "register")) {
              nextScreen = "REGISTER_PORTAL";
            } else if (is("1", "login")) {
              nextScreen = "LOGIN_PORTAL";
            } else if (is("2", "track_application")) {
              nextScreen = "TRACK_APPLICATION";
            } else if (is("3", "back")) {
              nextScreen = "ST201";
            }
          } else if (clientState === "ST203") {
            if (is("0", "open_portal")) {
              nextScreen = "OPEN_AAPLE_SARKAR";
            } else if (is("1", "back")) {
              nextScreen = "ST201";
            }
          } else if (clientState === "ST301") {
            if (is("0", "apply_here")) {
              nextScreen = "ST302";
            } else if (is("1", "aaple_sarkar")) {
              nextScreen = "ST303";
            } else if (is("2", "back")) {
              nextScreen = "ST002";
            }
          } else if (clientState === "ST302") {
            if (is("0", "register")) {
              nextScreen = "REGISTER_PART_PLAN";
            } else if (is("1", "login")) {
              nextScreen = "LOGIN_PART_PLAN";
            } else if (is("2", "track_application")) {
              nextScreen = "TRACK_PART_PLAN";
            } else if (is("3", "back")) {
              nextScreen = "ST301";
            }
          } else if (clientState === "ST303") {
            if (is("0", "open_portal")) {
              nextScreen = "OPEN_AAPLE_SARKAR_PART";
            } else if (is("1", "back")) {
              nextScreen = "ST301";
            }
          } else if (clientState === "ST401") {
            if (is("0", "open_gunthewari")) {
              nextScreen = "OPEN_GUNTHEWARI_PORTAL";
            } else if (is("1", "back")) {
              nextScreen = "ST002";
            }
          } else if (clientState === "ST501") {
            if (is("back")) {
              nextScreen = "ST002";
            }
          }

          if (!nextScreen) {
            nextScreen = clientState || "ST001";
          }

          // Check if we have an action prefix to show successful redirect/download notices
          let actionPrefix = "";
          if (["DOWNLOAD_LAYOUT", "DOWNLOAD_BUILDING_PERMISSION", "DOWNLOAD_OCCUPANCY"].includes(nextScreen)) {
            actionPrefix = clientLanguage === "mr" ?
              "📥 **लेआउट मंजुरी कागदपत्रांची फाईल डाउनलोड सुरू झाली आहे.**\n\n" :
              (clientLanguage === "hin" ?
                "📥 **दस्तावेज़ फ़ाइल डाउनलोड होना शुरू हो गई है।**\n\n" :
                "📥 **Document file download has been initiated.**\n\n");
            if (nextScreen === "DOWNLOAD_LAYOUT") nextScreen = "ST102";
            else if (nextScreen === "DOWNLOAD_BUILDING_PERMISSION") nextScreen = "ST103";
            else if (nextScreen === "DOWNLOAD_OCCUPANCY") nextScreen = "ST104";
          } else if (["REGISTER_PORTAL", "LOGIN_PORTAL", "TRACK_APPLICATION"].includes(nextScreen)) {
            actionPrefix = clientLanguage === "mr" ?
              "🌐 **आपले सरकार पोर्टलवर नेले जात आहे (झोन प्रमाणपत्र अर्ज)...** अर्जाची नोंदणी/लॉगिन/ट्रॅकिंग नवीन टॅबमध्ये उघडली आहे.\n\n" :
              (clientLanguage === "hin" ?
                "🌐 **आपको आपले सरकार पोर्टल पर ले जाया जा रहा है (ज़ोन प्रमाणपत्र आवेदन)...** नया पंजीकरण/लॉगिन/ट्रैकिंग नए टैब में खुल गया है।\n\n" :
                "🌐 **Redirecting to Aaple Sarkar Portal for Zone Certificate...** Registration/Login/Tracking opened in a new tab.\n\n");
            nextScreen = "ST202";
          } else if (nextScreen === "OPEN_AAPLE_SARKAR") {
            actionPrefix = clientLanguage === "mr" ?
              "🌐 **आपले सरकार मुख्य पोर्टल नवीन टॅबमध्ये उघडले गेले आहे.**\n\n" :
              (clientLanguage === "hin" ?
                "🌐 **आपले सरकार मुख्य पोर्टल नए टैब में खोला गया है।**\n\n" :
                "🌐 **Aaple Sarkar main portal has been opened in a new tab.**\n\n");
            nextScreen = "ST203";
          } else if (["REGISTER_PART_PLAN", "LOGIN_PART_PLAN", "TRACK_PART_PLAN"].includes(nextScreen)) {
            actionPrefix = clientLanguage === "mr" ?
              "🌐 **आपले सरकार पोर्टलवर नेले जात आहे (भाग नकाशा अर्ज)...** अर्जाची नोंदणी/लॉगिन/ट्रॅकिंग नवीन टॅबमध्ये उघडली आहे.\n\n" :
              (clientLanguage === "hin" ?
                "🌐 **आपको आपले सरकार पोर्टल पर ले जाया जा रहा है (पार्ट प्लान आवेदन)...** नया पंजीकरण/लॉगिन/ट्रैकिंग नए टैब में खुल गया है।\n\n" :
                "🌐 **Redirecting to Aaple Sarkar Portal for Part Plan...** Registration/Login/Tracking opened in a new tab.\n\n");
            nextScreen = "ST302";
          } else if (nextScreen === "OPEN_AAPLE_SARKAR_PART") {
            actionPrefix = clientLanguage === "mr" ?
              "🌐 **आपले सरकार मुख्य पोर्टल नवीन टॅबमध्ये उघडले गेले आहे.**\n\n" :
              (clientLanguage === "hin" ?
                "🌐 **आपले सरकार मुख्य पोर्टल नए टैब में खोला गया है।**\n\n" :
                "🌐 **Aaple Sarkar main portal has been opened in a new tab.**\n\n");
            nextScreen = "ST303";
          } else if (nextScreen === "OPEN_GUNTHEWARI_PORTAL") {
            actionPrefix = clientLanguage === "mr" ?
              "🌐 **गुंठेवारी पोर्टल नवीन टॅबमध्ये उघडले गेले आहे.**\n\n" :
              (clientLanguage === "hin" ?
                "🌐 **गुंठेवारी पोर्टल नए टैब में खोला गया है।**\n\n" :
                "🌐 **Gunthewari portal has been opened in a new tab.**\n\n");
            nextScreen = "ST401";
          } else if (nextScreen === "OPEN_BPMS") {
            actionPrefix = clientLanguage === "mr" ?
              "🌐 **BPMS पोर्टल नवीन टॅबमध्ये उघडले गेले आहे.**\n\n" :
              (clientLanguage === "hin" ?
                "🌐 **BPMS पोर्टल नए टैब में खोला गया है।**\n\n" :
                "🌐 **BPMS portal has been opened in a new tab.**\n\n");
            nextScreen = "ST105";
          }

          clientState = nextScreen;

          let mockObj = {
            success: true,
            current_state: clientState,
            language: clientLanguage,
            screen: clientState,
          };

          const stateInfo = STATE_DATA[clientState];
          if (stateInfo) {
            mockObj.title = stateInfo.title[clientLanguage] || stateInfo.title["en"];
            mockObj.subtitle = stateInfo.subtitle[clientLanguage] || stateInfo.subtitle["en"];
            mockObj.description = (stateInfo.description && stateInfo.description[clientLanguage]) || (stateInfo.description && stateInfo.description["en"]) || "";
            mockObj.buttons = stateInfo.buttons[clientLanguage] || stateInfo.buttons["en"];
            if (stateInfo.documentList) {
              mockObj.documentList = stateInfo.documentList[clientLanguage] || stateInfo.documentList["en"];
            }
          }

          // Build markdown output text
          let outputText = "";
          if (actionPrefix) {
            outputText += actionPrefix;
          }

          if (clientState === "ST501" && !is("back", "ai_assistant", "4")) {
            let aiReply = "";
            if (is("doc", "document", "kaagaz", "kaagazpatra", "कागदपत्र", "दस्तावेज़", "यादी", "list", "checklist")) {
              aiReply = clientLanguage === "mr" ?
                "📄 **CSMRDA आवश्यक कागदपत्रे:**\n• **इमारत परवानगीसाठी:** मालमत्ता पत्रक, ७/१२ उतारा, रेखांकन नकाशा, आर्किटेक्टचे प्रमाणपत्र.\n• **झोन प्रमाणपत्रासाठी:** ७/१२ उतारा, मोजणी नकाशा.\n\nआपण मुख्य मेनूमधून संबंधित विभागात जाऊन कागदपत्रांची संपूर्ण PDF यादी डाउनलोड करू शकता." :
                (clientLanguage === "hin" ?
                  "📄 **CSMRDA आवश्यक दस्तावेज़:**\n• **भवन अनुमति के लिए:** संपत्ति पत्रक, 7/12 उद्धरण, लेआउट योजना, आर्किटेक्ट प्रमाण पत्र।\n• **ज़ोन प्रमाणपत्र के लिए:** 7/12 उद्धरण, मापन योजना।\n\nआप मुख्य मेनू से संबंधित अनुभाग में जाकर दस्तावेज़ों की पूरी PDF सूची डाउनलोड कर सकते हैं।" :
                  "📄 **CSMRDA Required Documents:**\n• **For Building Permission:** Property Card, 7/12 Extract, Approved Layout, Architect Certificate.\n• **For Zone Certificate:** 7/12 Extract, Measurement Plan.\n\nYou can download the complete PDF checklist by visiting the respective service section from the Main Menu.");
            } else if (is("fee", "fees", "शुल्क", "पैसे", "चार्ज", "cost", "paise", "price")) {
              aiReply = clientLanguage === "mr" ?
                "💰 **शुल्क (Fees) माहिती:**\nCSMRDA सेवांचे शुल्क तुमच्या भूखंडाच्या आकारमानावर (Plot Area) आणि बांधकाम प्रकारावर अवलंबून असते. अंदाजे शुल्क मोजण्यासाठी अधिकृत BPMS पोर्टलवर उपलब्ध असलेल्या 'Fee Calculator' चा वापर करा." :
                (clientLanguage === "hin" ?
                  "💰 **शुल्क (Fees) विवरण:**\nCSMRDA सेवाओं का शुल्क आपके भूखंड के आकार (Plot Area) और निर्माण प्रकार पर निर्भर करता है। सटीक शुल्क गणना के लिए आधिकारिक BPMS पोर्टल पर उपलब्ध 'Fee Calculator' का उपयोग करें।" :
                  "💰 **Fee Details:**\nCSMRDA service fees depend on your plot size (Plot Area) and type of construction. You can calculate the exact fees using the 'Fee Calculator' available on the official BPMS portal.");
            } else if (is("time", "days", "वेळ", "दिवस", "अवधी", "दिन", "duration", "process")) {
              aiReply = clientLanguage === "mr" ?
                "⏱️ **प्रक्रियेचा कालावधी:**\n• **इमारत परवानगी:** १५ ते ३० कार्यालयीन दिवस.\n• **झोन प्रमाणपत्र:** ७ ते १५ कार्यालयीन दिवस.\n• **भाग नकाशा:** ७ ते १५ कार्यालयीन दिवस.\n\nसर्व कागदपत्रे अचूक असल्यास परवानगी जलद मिळते." :
                (clientLanguage === "hin" ?
                  "⏱️ **प्रक्रिया की अवधि:**\n• **भवन अनुमति:** 15 से 30 कार्य दिवस।\n• **ज़ोन प्रमाणपत्र:** 7 से 15 कार्य दिवस।\n• **पार्ट प्लान:** 7 से 15 कार्य दिवस।\n\nसभी दस्तावेज़ सही होने पर प्रक्रिया तेजी से पूरी होती है।" :
                  "⏱️ **Processing Duration:**\n• **Building Permission:** 15 to 30 working days.\n• **Zone Certificate:** 7 to 15 working days.\n• **Part Plan:** 7 to 15 working days.\n\nApprovals are granted faster if all submitted documents are accurate and complete.");
            } else if (is("help", "how", "मदत", "कसे", "सहायता", "मदद")) {
              aiReply = clientLanguage === "mr" ?
                "ℹ️ **मी तुम्हाला खालील विषयांवर मदत करू शकतो:**\n१. इमारत परवानगीसाठी लागणारी कागदपत्रे.\n२. झोन प्रमाणपत्र आणि भाग नकाशा मिळवण्याची प्रक्रिया.\n३. अधिकृत पोर्टलच्या लिंक्स.\n\nकृपया तुमचा प्रश्न खाली टाईप करा किंवा मुख्य मेनूमध्ये परत जा." :
                (clientLanguage === "hin" ?
                  "ℹ️ **मैं आपको निम्नलिखित विषयों पर सहायता कर सकता हूँ:**\n1. भवन अनुमति के लिए आवश्यक दस्तावेज़।\n2. ज़ोन प्रमाणपत्र और पार्ट प्लान प्राप्त करने की प्रक्रिया।\n3. आधिकारिक पोर्टल लिंक्स।\n\nकृपया अपना प्रश्न नीचे टाइप करें या मुख्य मेनू पर लौटें।" :
                  "ℹ️ **I can assist you with:**\n1. Required documents for building permission.\n2. The process to obtain Zone Certificates & Part Plans.\n3. Official portal links & portals guidance.\n\nPlease type your question below or return to the main menu.");
            } else {
              aiReply = clientLanguage === "mr" ?
                `🤖 **विकास मित्र AI सहाय्यक:**\nमी आपल्या '${userInput}' या प्रश्नावर माहिती शोधत आहे. कृपया लक्षात घ्या की मी सध्या विकास टप्प्यात आहे.\n\nतुम्ही मला **आवश्यक कागदपत्रे**, **शुल्क (fees)**, किंवा **कालावधी (processing time)** याविषयी विचारू शकता.` :
                (clientLanguage === "hin" ?
                  `🤖 **विकास मित्र AI सहायक:**\nमैं आपके प्रश्न '${userInput}' पर जानकारी खोज रहा हूँ। कृपया ध्यान दें कि मैं अभी विकास चरण में हूँ।\n\nआप मुझसे **आवश्यक दस्तावेज़**, **शुल्क (fees)**, या **समय (processing time)** के बारे में पूछ सकते हैं।` :
                  `🤖 **Vikas Mitra AI Assistant:**\nI am looking up information regarding your query: '${userInput}'. Please note that I am currently in a beta/development phase.\n\nFeel free to ask me about **required documents**, **service fees**, or **processing timelines**.`);
            }
            mockObj.description = aiReply;
          }

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
            const docHeader = clientLanguage === "mr" ? "**आवश्यक कागदपत्रे:**\n" : (clientLanguage === "hin" ? "**आवश्यक दस्तावेज़:**\n" : "**Required Documents:**\n");
            outputText += docHeader;
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
              (clientLanguage === "hin" ?
                "कृपया निम्नलिखित में से कोई एक सेवा चुनें:\n\n" :
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
            headers: { "Content-Type": "application/json" }
          });
        } else {
          if (isRandomMsg && targetObj.output) {
            const warning = clientLanguage === "mr" ?
              "कृपया खालीलपैकी एक सेवा निवडा:\n\n" :
              (clientLanguage === "hin" ?
                "कृपया निम्नलिखित में से कोई एक सेवा चुनें:\n\n" :
                "Please select one of the services as follows:\n\n");
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

        // Replace literal backslash-n (\n) with actual newline characters
        formattedHTML = formattedHTML.replace(/\\n/g, '\n');

        // Support formatting bold **text** to HTML tags
        formattedHTML = formattedHTML.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert markdown list choice links to custom HTML lists
        if (formattedHTML.includes('*   [')) {
          const listItems = [];
          const regex = /\*\s+\[(.*?)\]\(#choice-(.*?)\)/g;
          let match;
          const textBefore = formattedHTML.split('*')[0].trim();

          while ((match = regex.exec(formattedHTML)) !== null) {
            listItems.push(`<li><a href="#choice-${match[2]}">${match[1]}</a></li>`);
          }

          if (listItems.length > 0) {
            formattedHTML = `
              ${textBefore.replace(/\n/g, '<br>')}
              <ul class="wa-choice-list">
                ${listItems.join('\n')}
              </ul>
            `;
          }
        } else {
          formattedHTML = formattedHTML.replace(/\n/g, '<br>');
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
          appendMessage('🙏 **नमस्कार!** मी **विकास मित्र** — छत्रपती संभाजीनगर महानगर प्रदेश विकास प्राधिकरण (CSMRDA) चा डिजिटल सहाय्यक.');

          setTimeout(() => {
            showTypingIndicator();

            setTimeout(() => {
              removeTypingIndicator();
              appendMessage('🙏 **नमस्ते!** मैं **विकास मित्र** — छत्रपति संभाजीनगर महानगर क्षेत्र विकास प्राधिकरण (CSMRDA) का डिजिटल सहायक हूँ।');

              setTimeout(() => {
                showTypingIndicator();

                setTimeout(() => {
                  removeTypingIndicator();
                  appendMessage('🙏 **Hello!** I\'m **Vikas Mitra** — the digital assistant for the Chhatrapati Sambhajinagar Metropolitan Region Development Authority (CSMRDA).');

                  setTimeout(() => {
                    showTypingIndicator();

                    setTimeout(() => {
                      removeTypingIndicator();
                      appendMessage('भाषा / Language / भाषा\\n\\nकृपया तुमची आवडती भाषा निवडा / Please select your preferred language / कृपया अपनी पसंदीदा भाषा चुनें:\\n*   [🇬🇧 English](#choice-en)\\n*   [🇮🇳 मराठी](#choice-mr)\\n*   [🇮🇳 हिन्दी](#choice-hindi)');
                    }, 1000);
                  }, 600);
                }, 1200);
              }, 600);
            }, 1200);
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
