import { z } from "zod";

/* ── Auth Şemaları ───────────────────────────────────────────── */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email adresi girilmelidir")
    .email("Geçerli bir email adresi giriniz"),
  password: z
    .string()
    .min(1, "Şifre girilmelidir")
    .min(6, "Şifre en az 6 karakter olmalıdır"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().optional(),
    email: z
      .string()
      .min(1, "Email adresi girilmelidir")
      .email("Geçerli bir email adresi giriniz"),
    password: z
      .string()
      .min(1, "Şifre girilmelidir")
      .min(6, "Şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string().min(1, "Şifre tekrarı girilmelidir"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/* ── Mülakat Ayar Şeması ─────────────────────────────────────── */

export const interviewConfigSchema = z.object({
  field: z.string().min(1, "Mülakat alanı seçilmelidir"),
  techStack: z.array(z.string()).default([]),
  difficulty: z.string().default("intermediate"),
});

export type InterviewConfigData = z.infer<typeof interviewConfigSchema>;
