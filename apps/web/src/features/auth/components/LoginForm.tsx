"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import "./auth.styles.scss";

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch {
      // Hata mutation state'inde tutuluyor
    }
  };

  const errorMessage = loginError
    ? (loginError as Record<string, unknown> & { response?: { data?: { message?: string } } })
        ?.response?.data?.message || loginError.message
    : null;

  return (
    <div className="auth-form">
      <div className="auth-form__card">
        <div className="auth-form__logo">AI Coach</div>
        <h1 className="auth-form__title">Giriş Yap</h1>
        <p className="auth-form__subtitle">
          AI Coach hesabınıza giriş yapın
        </p>

        {errorMessage && (
          <div className="auth-form__error">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-form__submit"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="auth-form__footer">
          Hesabınız yok mu? <Link href="/register">Kayıt Olun</Link>
        </p>
      </div>
    </div>
  );
}
