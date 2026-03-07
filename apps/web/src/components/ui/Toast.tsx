"use client";

import { useState, useEffect, useCallback } from "react";
import "./Toast.scss";

export interface ToastMessage {
  id: string;
  type: "error" | "success" | "warning" | "info";
  message: string;
  duration?: number;
}

export const TOAST_EVENT = "app:toast";

export function showToast(
  message: string,
  type: ToastMessage["type"] = "error",
  duration = 5000,
) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent(TOAST_EVENT, {
    detail: { id: Date.now().toString(), type, message, duration },
  });
  window.dispatchEvent(event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const toast = (e as CustomEvent<ToastMessage>).detail;
      setToasts((prev) => {
        if (prev.some((t) => t.message === toast.message)) return prev;
        return [...prev, toast];
      });
      setTimeout(() => removeToast(toast.id), toast.duration || 5000);
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="toast__icon">
            {toast.type === "error" && "✕"}
            {toast.type === "success" && "✓"}
            {toast.type === "warning" && "⚠"}
            {toast.type === "info" && "ℹ"}
          </span>
          <span className="toast__message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
