"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import "./auth.styles.scss";

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Yazmaya başlarken o alanın hatasını temizle
    if (fieldErrors[name as keyof LoginFormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await login(result.data);
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
      return message;
    }

    return (
      err.message || "Giriş yapılamadı, lütfen bilgilerinizi kontrol edin."
    );
  };

  const serverError = getErrorMessage(loginError);

  return (
    <div className="auth-form">
      <div className="auth-form__card">
        <div className="auth-form__logo">AI Coach</div>
        <h1 className="auth-form__title">Giriş Yap</h1>
        <p className="auth-form__subtitle">AI Coach hesabınıza giriş yapın</p>

        {serverError && <div className="auth-form__error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-form__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ornek@email.com"
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="auth-form__field-error">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="auth-form__field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="auth-form__field-error">
                {fieldErrors.password}
              </span>
            )}
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
