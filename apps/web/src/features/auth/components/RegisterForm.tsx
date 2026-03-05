"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { registerSchema } from "@/lib/validation";
import "./auth.styles.scss";

type FormFields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const { register, isRegistering, registerError } = useAuth();
  const [formData, setFormData] = useState<FormFields>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormFields, string>>
  >({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormFields]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof FormFields, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormFields;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await register({
        email: result.data.email,
        password: result.data.password,
        name: result.data.name || undefined,
      });
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
      if (message.includes("Email already exists"))
        return "Bu email adresi zaten kullanımda.";
      return message;
    }

    return err.message || "Kayıt işlemi başarısız oldu.";
  };

  const serverError = getErrorMessage(registerError);

  return (
    <div className="auth-form">
      <div className="auth-form__card">
        <div className="auth-form__logo">AI Coach</div>
        <h1 className="auth-form__title">Kayıt Ol</h1>
        <p className="auth-form__subtitle">
          AI Coach&apos;a katılın ve mülakata hazırlanın
        </p>

        {serverError && <div className="auth-form__error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-form__field">
            <label htmlFor="name">Ad Soyad</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              autoComplete="name"
            />
            {fieldErrors.name && (
              <span className="auth-form__field-error">{fieldErrors.name}</span>
            )}
          </div>

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
              placeholder="En az 6 karakter"
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <span className="auth-form__field-error">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <div className="auth-form__field">
            <label htmlFor="confirmPassword">Şifre Tekrar</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Şifrenizi tekrar girin"
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <span className="auth-form__field-error">
                {fieldErrors.confirmPassword}
              </span>
            )}
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
