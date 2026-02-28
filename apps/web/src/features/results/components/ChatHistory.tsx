import React from "react";
import "./ChatHistory.scss";

interface Message {
  role: "user" | "agent";
  content: string;
  createdAt: string;
}

interface ChatHistoryProps {
  messages: Message[];
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  if (!messages || messages.length === 0) {
    return (
      <div className="chat-history-empty">
        <p>Henüz bir sohbet geçmişi bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="chat-history-container">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`chat-message ${
            msg.role === "agent" ? "message-agent" : "message-user"
          }`}
        >
          <div className="message-avatar">
            {msg.role === "agent" ? "🤖" : "👤"}
          </div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">
                {msg.role === "agent" ? "AI Mülakatçı" : "Sen"}
              </span>
              <span className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="message-text">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
