"use client";

import { useState } from "react";
import { Bot, User, X, Maximize2 } from "lucide-react";
import "./ChatHistory.scss";

interface Message {
  role: "user" | "agent";
  content: string;
  createdAt: string;
}

interface GroupedMessage {
  role: "user" | "agent";
  contents: string[];
}

function groupMessages(messages: Message[]): GroupedMessage[] {
  if (!messages || messages.length === 0) return [];

  const groups: GroupedMessage[] = [];
  let current: GroupedMessage | null = null;

  for (const msg of messages) {
    if (!msg.content || msg.content.trim() === "") continue;

    if (current && current.role === msg.role) {
      current.contents.push(msg.content.trim());
    } else {
      if (current) groups.push(current);
      current = { role: msg.role, contents: [msg.content.trim()] };
    }
  }

  if (current) groups.push(current);
  return groups;
}

interface ChatHistoryProps {
  messages: Message[];
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!messages || messages.length === 0) {
    return (
      <div className="chat-history-empty">
        <p>Henüz bir sohbet geçmişi bulunmuyor.</p>
      </div>
    );
  }

  const grouped = groupMessages(messages);

  const renderMessages = (inModal: boolean) => (
    <div className={`chat-messages ${inModal ? "in-modal" : ""}`}>
      {grouped.map((group, idx) => (
        <div
          key={idx}
          className={`chat-group ${
            group.role === "agent" ? "group-agent" : "group-user"
          }`}
        >
          <div className="group-avatar">
            {group.role === "agent" ? <Bot size={18} /> : <User size={18} />}
          </div>
          <div className="group-bubble">
            <span className="group-sender">
              {group.role === "agent" ? "AI Mülakatçı" : "Sen"}
            </span>
            <div className="group-text">
              {group.contents.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Inline preview */}
      <div className="chat-history-container">
        <div className="chat-preview-wrapper">{renderMessages(false)}</div>
        <button
          className="chat-expand-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <Maximize2 size={16} />
          Tam Ekran Görüntüle
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="chat-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <h3>Sohbet Geçmişi</h3>
              <button
                className="chat-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="chat-modal-body">{renderMessages(true)}</div>
          </div>
        </div>
      )}
    </>
  );
}
