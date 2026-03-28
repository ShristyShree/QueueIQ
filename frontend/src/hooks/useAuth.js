/**
 * useAuth
 * -------
 * Manages authentication state across the app.
 * Exposes: user, isLoggedIn, login, register, logout, loading, error
 *
 * On mount, attempts to restore session by calling /api/auth/me
 * if an access token exists in localStorage.
 */

import { useState, useEffect, useCallback } from "react";
import * as api from "../services/api.js";

export default function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);   // true while restoring session
  const [error,   setError]   = useState(null);

  // ── Restore session on mount ────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = api.TokenStore.getAccess();
      if (!token) { setLoading(false); return; }
      try {
        const { user: me } = await api.getMe();
        setUser(me);
      } catch {
        api.TokenStore.clearTokens();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // ── Login ───────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { user: me } = await api.login({ email, password });
      setUser(me);
      return { success: true };
    } catch (err) {
      const msg = err?.error ?? "Login failed";
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Register ────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { user: me } = await api.register({ name, email, password });
      setUser(me);
      return { success: true };
    } catch (err) {
      const msg = err?.errors?.join(", ") ?? err?.error ?? "Registration failed";
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    loading,
    error,
    login,
    register,
    logout,
    clearError: () => setError(null),
  };
}
