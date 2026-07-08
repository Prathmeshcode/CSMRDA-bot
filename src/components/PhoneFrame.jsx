import { useState, useEffect } from "react";
import "./PhoneFrame.css";
import Header from "./Header";
import ChatContainer from "./ChatContainer";
import { FaWifi, FaSignal, FaBatteryThreeQuarters } from "react-icons/fa";

function PhoneFrame() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, "0");
      const mins = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="phone">
      <div className="notch"></div>
      
      <div className="status-bar">
        <div className="status-bar-time">{time}</div>
        <div className="status-bar-icons">
          <FaSignal className="status-icon" />
          <span style={{ fontSize: '10px', fontWeight: 'bold', marginRight: '4px' }}>5G</span>
          <FaWifi className="status-icon" />
          <FaBatteryThreeQuarters className="status-icon" />
        </div>
      </div>

      <Header />

      <ChatContainer />
    </div>
  );
}

export default PhoneFrame;