"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import "./auth.styles.scss";

export function RegisterForm() {
  const { register, isRegistering, registerError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (password !== confirmPassword) {
      setValidationError("Şifreler eşleşmiyor");
      return;
    }

    try {
      await register({ email, password, name: name || undefined });
    } catch {
      // Hata mutation state'inde tutuluyor
    }
  };

  const getErrorMessage = (error: unknown) => {
    if (!error) return null;
    const err = error as Error & {
      code?: string;
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    };

    if (err.message === "Network Error" || err.code === "ECONNREFUSED") {
      return "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.";
    }

    const message = err.response?.data?.message;

    if (Array.isArray(message)) {
      return message[0];
    }

    if (typeof message === "string") {
      // Eğer "already exists" gibi bir hata geliyorsa Türkçeleştirebiliriz (örnek)
      if (message.includes("Email already exists"))
        return "Bu email adresi zaten kullanımda.";
      return message;
    }

    return err.message || "Kayıt işlemi başarısız oldu.";
  };

  const errorMessage = validationError || getErrorMessage(registerError);

  return (
    <div className="auth-form">
      <div className="auth-form__card">
        <div className="auth-form__logo">AI Coach</div>
        <h1 className="auth-form__title">Kayıt Ol</h1>
        <p className="auth-form__subtitle">
          AI Coach&apos;a katılın ve mülakata hazırlanın
        </p>

        {errorMessage && <div className="auth-form__error">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="name">Ad Soyad</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="confirmPassword">Şifre Tekrar</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifrenizi tekrar girin"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-form__submit"
            disabled={isRegistering}
          >
            {isRegistering ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="auth-form__footer">
          Zaten hesabınız var mı? <Link href="/login">Giriş Yapın</Link>
        </p>
      </div>
    </div>
  );
}
