import "./PhoneFrame.css";
import Header from "./Header";
import LanguageBar from "./LanguageBar";
import ChatContainer from "./ChatContainer";

function PhoneFrame() {
  return (
    <div className="phone">
      <div className="notch"></div>

      <Header />

      <LanguageBar />

      <ChatContainer />
    </div>
  );
}

export default PhoneFrame;