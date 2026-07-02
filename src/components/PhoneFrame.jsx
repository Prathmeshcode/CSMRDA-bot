import "./PhoneFrame.css";
import Header from "./Header";
import ChatContainer from "./ChatContainer";

function PhoneFrame() {
  return (
    <div className="phone">
      <div className="notch"></div>

      <Header />

      <ChatContainer />
    </div>
  );
}

export default PhoneFrame;