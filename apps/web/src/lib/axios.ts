import axios from "axios";
import { showToast } from "@/components/ui/Toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/** Custom event name fired when auth session is invalidated */
export const AUTH_LOGOUT_EVENT = "auth:logout";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ── Helper: clear local storage + dispatch event (no hard refresh) ──
function forceLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authUser");
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}

// ── Request interceptor: Authorization header ────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: 401 → refresh token ───────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const serverMessage =
      error.response?.data?.message || error.response?.data?.error || "";

    // ── Network / connection errors (no response at all) ──
    if (!error.response) {
      showToast(
        "Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.",
        "error",
      );
      return Promise.reject(error);
    }

    // ── 500 server errors → always notify user ──
    if (status >= 500) {
      const msg = serverMessage.includes("ECONNREFUSED")
        ? "Sunucu servisleri başlatılıyor, lütfen birkaç saniye bekleyin."
        : serverMessage || "Sunucu hatası oluştu, lütfen tekrar deneyin.";
      showToast(msg, "error");
    }

    // ── 401 → refresh token ──
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        isRefreshing = false;
        showToast("Oturumunuz sona erdi, lütfen tekrar giriş yapın.", "warning");
        forceLogout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        showToast("Oturumunuz sona erdi, lütfen tekrar giriş yapın.", "warning");
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 Forbidden ──
    if (status === 403) {
      showToast("Bu işlem için yetkiniz bulunmuyor.", "warning");
    }

    return Promise.reject(error);
  },
);

export default api;
