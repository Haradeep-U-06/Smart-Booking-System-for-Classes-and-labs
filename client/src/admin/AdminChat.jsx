import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { teacherContextObj } from "../contexts/TeacherContexts";
import { socket } from "../socket";
import "../admin/AdminChat.css";
const API_URL = import.meta.env.VITE_API_URL;

function AdminChat() {
  const { leaveId } = useParams();
  const navigate = useNavigate();

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [loading, setLoading] = useState(true);

  const { currentTeacher } = useContext(teacherContextObj); // admin stored here in your app

  /* -------------------------------
     Approve / Reject (UNCHANGED)
  -------------------------------- */
  const approve = async () => {
    try {
      await axios.put(
        `${API_URL}/leave-api/${leaveId}/approve`,
        { adminMessage: "Your leave has been approved" }
      );
      alert("Leave approved & conversation closed");
      navigate("/admin/leave-requests");
    } catch (err) {
      console.error("Approve failed", err);
    }
  };

  const reject = async () => {
    try {
      await axios.put(
        `${API_URL}/leave-api/${leaveId}/reject`,
        { adminMessage: "Your leave has been rejected" }
      );
      alert("Leave rejected & conversation closed");
      navigate("/admin/leave-requests");
    } catch (err) {
      console.error("Reject failed", err);
    }
  };

  /* -------------------------------
     1️⃣ Fetch conversation ID
  -------------------------------- */
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/chat-api/convo/${leaveId}`
        );
        setConversationId(res.data.payload._id);
      } catch (err) {
        console.error("Failed to fetch conversation", err);
      }
    };

    fetchConversation();
  }, [leaveId]);

  /* -------------------------------
     2️⃣ Fetch message history (ONCE)
  -------------------------------- */
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/chat-api/messages/${conversationId}`
        );
        setMessages(res.data.payload);
        setStatus(res.data.conversationStatus);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
  }, [conversationId]);

  /* -------------------------------
     3️⃣ Join / Leave socket room
  -------------------------------- */
  useEffect(() => {
    if (!conversationId) return;

    socket.emit("join-room", conversationId);

    return () => {
      socket.emit("leave-room", conversationId);
    };
  }, [conversationId]);

  /* -------------------------------
     4️⃣ Listen for live messages
  -------------------------------- */
  useEffect(() => {
    socket.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("new-message");
    };
  }, []);

   useEffect(() => {
    socket.on("conversation-closed", () => {
      setStatus("CLOSED");
      socket.emit("leave-room", conversationId);
    });

    return () => {
      socket.off("conversation-closed");
    };
  }, [conversationId]);


  /* -------------------------------
     5️⃣ Send message (ADMIN)
  -------------------------------- */
  const sendMessage = () => {
    if (!content.trim() || status !== "OPEN") return;

    socket.emit("send-message", {
      conversationId,
      senderId: currentTeacher._id,
      senderRole: "ADMIN",
      content
    });

    setContent("");
  };

  if (loading) return <p>Loading conversation...</p>;

  return (
    <div className="chat-container">
      <h3>Leave Discussion (Admin)</h3>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`message ${msg.senderRole}`}
          >
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      {status === "OPEN" ? (
        <div className="chat-input">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
          <button onClick={approve}>Approve</button>
          <button onClick={reject}>Reject</button>
        </div>
      ) : (
        <p className="chat-locked">Conversation closed</p>
      )}
    </div>
  );
}

export default AdminChat;
