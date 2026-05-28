import { useEffect, useState } from "react";
import { socket } from "./socket/socket";


function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send_message", message);
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Socket.IO Chat</h1>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>
        Send
      </button>

      <div>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
    </div>
  );
}

export default App;