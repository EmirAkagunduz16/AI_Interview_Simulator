"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  authApi,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AuthUser,
} from "../api/authApi";

/* ── Helpers ──────────────────────────────────────────────────── */

function storeAuthData(data: AuthResponse) {
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("authUser", JSON.stringify(data.user));
}

function clearAuthData() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authUser");
}

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ── Hook ─────────────────────────────────────────────────────── */

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setUser(readStoredUser());
    setIsLoading(false);
  }, []);

  const isAuthenticated = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!user && !!localStorage.getItem("accessToken");
  }, [user]);

  const handleAuthSuccess = useCallback((data: AuthResponse) => {
    storeAuthData(data);
    setUser(data.user);
  }, []);

  /* ── Login ──────────────────────────────────────────────────── */
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      handleAuthSuccess(data);
      router.push("/dashboard");
    },
  });

  /* ── Register ───────────────────────────────────────────────── */
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      handleAuthSuccess(data);
      router.push("/dashboard");
    },
  });

  /* ── Logout ─────────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Sunucu hatası olsa bile local temizlik yapıyoruz
    } finally {
      clearAuthData();
      setUser(null);
      queryClient.clear();
      router.push("/login");
    }
  }, [queryClient, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout,
  };
}
