"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
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

  // Hydrate from localStorage on mount AND validate the token server-side
  useEffect(() => {
    const storedUser = readStoredUser();
    const accessToken = localStorage.getItem("accessToken");

    if (!storedUser || !accessToken) {
      // No stored credentials at all
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Set user optimistically, then validate
    setUser(storedUser);

    // Fire-and-forget server-side validation
    api
      .get("/users/me")
      .then(() => {
        // Token is valid, keep the user
        setIsLoading(false);
      })
      .catch(() => {
        // Token is expired/invalid and refresh also failed
        clearAuthData();
        setUser(null);
        setIsLoading(false);
      });
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
