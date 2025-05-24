import { useState, useEffect } from "react";
import io from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

let socket;

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [targetUsername, setTargetUsername] = useState(""); // NEW

  useEffect(() => {
    if (token) {
      socket = io(SERVER_URL, {
        auth: { token },
      });

      socket.on("connect", () => {
        console.log("Connected to server");
      });

      socket.on("userList", (userList) => {
        setUsers(userList);
      });

      socket.on("message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("privateMessage", (msg) => {
        setMessages((prev) => [...prev, { ...msg, isPrivate: true }]);
      });

      socket.on("typing", (user) => {
        setTypingUser(user);
        setTimeout(() => setTypingUser(""), 3000);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token]);

  const handleSignup = async () => {
    const res = await fetch(`${SERVER_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    alert(data.message);
  };

  const handleSignin = async () => {
    const res = await fetch(`${SERVER_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data) {
      if (!data.token) {
        alert(data.message);
      }
      setToken(data.token);
    } else {
      alert("Signin failed");
    }
  };

  const sendMessage = () => {
    if (targetUsername.trim() !== "") {
      socket.emit("privateMessage", { toUsername: targetUsername, content: message });
    } else {
      socket.emit("message", { content: message });
    }
    setMessage("");
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (socket) {
      socket.emit("typing");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "black",
        color: "white",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: "bold", textAlign: "center" }}>
        Talksy
      </h1>

      {!token && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "300px",
            margin: "20px auto",
            gap: "10px",
          }}
        >
          <input
            style={{
              padding: "10px",
              backgroundColor: "#222",
              border: "1px solid #555",
              color: "white",
              borderRadius: "4px",
            }}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={{
              padding: "10px",
              backgroundColor: "#222",
              border: "1px solid #555",
              color: "white",
              borderRadius: "4px",
            }}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            style={{
              padding: "10px",
              backgroundColor: "#444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={handleSignup}
          >
            Sign Up
          </button>
          <button
            style={{
              padding: "10px",
              backgroundColor: "#444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={handleSignin}
          >
            Sign In
          </button>
        </div>
      )}

      {token && (
        <div style={{ maxWidth: "600px", margin: "20px auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>
              🟢 Connected Users
            </h2>
            <ul
              style={{
                backgroundColor: "#111",
                padding: "10px",
                borderRadius: "4px",
                maxHeight: "100px",
                overflowY: "auto",
              }}
            >
              {users.map((u) => (
                <li
                  key={u}
                  style={{ borderBottom: "1px solid #333", padding: "5px 0" }}
                >
                  {u}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>💬 Chat</h2>
            <div
              style={{
                backgroundColor: "#111",
                padding: "10px",
                borderRadius: "4px",
                height: "300px",
                overflowY: "auto",
              }}
            >
              {messages.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: "5px" }}>
                  <strong>{msg.isBot ? "🤖 Bot" : msg.sender}</strong>:{" "}
                  {msg.content}
                  {msg.isPrivate && (
                    <span style={{ fontSize: "12px", color: "gray" }}>
                      {" "}
                      (private)
                    </span>
                  )}
                </div>
              ))}
              {typingUser && (
                <div style={{ fontStyle: "italic", color: "gray" }}>
                  {typingUser} is typing...
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#222",
                border: "1px solid #555",
                color: "white",
                borderRadius: "4px",
              }}
              placeholder="Send to (username) - leave blank for public"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#222",
                border: "1px solid #555",
                color: "white",
                borderRadius: "4px",
              }}
              placeholder="Use /bot in front of message to get an AI response"
              value={message}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
