/**
 * QueueIQ API Service
 * -------------------
 * All HTTP calls to the Flask backend live here.
 * Components never call fetch() directly — they use these functions.
 *
 * Base URL is read from VITE_API_URL env var (fallback: localhost:5000).
 * Tokens are stored in localStorage and attached automatically.
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// ── Token storage helpers ─────────────────────────────────────
export const TokenStore = {
  getAccess:      ()      => localStorage.getItem("qiq_access"),
  getRefresh:     ()      => localStorage.getItem("qiq_refresh"),
  setTokens:      (a, r)  => { localStorage.setItem("qiq_access", a); localStorage.setItem("qiq_refresh", r); },
  clearTokens:    ()      => { localStorage.removeItem("qiq_access"); localStorage.removeItem("qiq_refresh"); },
};

// ── Base fetch with auth + auto-refresh ──────────────────────
async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers ?? {}) };
  const token   = TokenStore.getAccess();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${BASE}${path}`, { ...options, headers });

  // If 401 and we have a refresh token, try once to refresh
  if (res.status === 401 && TokenStore.getRefresh()) {
    const refreshed = await fetch(`${BASE}/api/auth/refresh`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${TokenStore.getRefresh()}`,
      },
    });
    if (refreshed.ok) {
      const { access_token } = await refreshed.json();
      TokenStore.setTokens(access_token, TokenStore.getRefresh());
      headers["Authorization"] = `Bearer ${access_token}`;
      res = await fetch(`${BASE}${path}`, { ...options, headers });
    } else {
      TokenStore.clearTokens();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

/**
 * Register a new user.
 * @param {{ name, email, password }} payload
 * @returns {{ user, access_token, refresh_token }}
 */
export async function register(payload) {
  const data = await apiFetch("/api/auth/register", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  TokenStore.setTokens(data.access_token, data.refresh_token);
  return data;
}

/**
 * Log in an existing user.
 * @param {{ email, password }} payload
 * @returns {{ user, access_token, refresh_token }}
 */
export async function login(payload) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  TokenStore.setTokens(data.access_token, data.refresh_token);
  return data;
}

/** Log out — clears local tokens. */
export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    TokenStore.clearTokens();
  }
}

/** Get the currently authenticated user's profile. */
export async function getMe() {
  return apiFetch("/api/auth/me");
}

// ════════════════════════════════════════════════════════════
// HOSPITALS
// ════════════════════════════════════════════════════════════

/**
 * List all hospitals, optionally sorted by distance.
 * @param {{ lat?, lng?, search? }} params
 * @returns {{ hospitals: Hospital[], total: number }}
 */
export async function getHospitals({ lat, lng, search } = {}) {
  const qs = new URLSearchParams();
  if (lat    != null) qs.set("lat",    lat);
  if (lng    != null) qs.set("lng",    lng);
  if (search)         qs.set("search", search);
  const query = qs.toString() ? `?${qs}` : "";
  return apiFetch(`/api/hospitals/${query}`);
}

/**
 * Get a single hospital with all queue profiles.
 * @param {string} hospitalId
 */
export async function getHospital(hospitalId) {
  return apiFetch(`/api/hospitals/${hospitalId}`);
}

/**
 * Get the 24-hour crowd profile for chart rendering.
 * @param {string} hospitalId
 * @param {string} queueKey     "doctor" | "billing" | "pharmacy"
 * @param {number} dayOfWeek    0-6
 * @returns {{ profile: ProfilePoint[] }}
 */
export async function getCrowdProfile(hospitalId, queueKey, dayOfWeek) {
  const qs = new URLSearchParams({ queue_key: queueKey, day_of_week: dayOfWeek });
  return apiFetch(`/api/hospitals/${hospitalId}/profile?${qs}`);
}

// ════════════════════════════════════════════════════════════
// PREDICTIONS
// ════════════════════════════════════════════════════════════

/**
 * Run a wait-time prediction.
 * @param {{ hospitalId, queueKey, hour, dayOfWeek, peopleAhead }} params
 * @returns {PredictionResult}
 */
export async function predict({ hospitalId, queueKey, hour, dayOfWeek, peopleAhead }) {
  return apiFetch("/api/predict/", {
    method: "POST",
    body:   JSON.stringify({ hospitalId, queueKey, hour, dayOfWeek, peopleAhead }),
  });
}

// ════════════════════════════════════════════════════════════
// FEEDBACK
// ════════════════════════════════════════════════════════════

/**
 * Submit actual wait time feedback. Requires auth.
 * @param {{ hospitalId, queueKey, predictedWait, actualWait, visitHour, visitDay, peopleAhead? }} payload
 */
export async function submitFeedback(payload) {
  return apiFetch("/api/feedback/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

/**
 * Fetch current user's feedback history. Requires auth.
 * @param {{ page?, per_page? }} params
 */
export async function getMyFeedback({ page = 1, per_page = 20 } = {}) {
  return apiFetch(`/api/feedback/mine?page=${page}&per_page=${per_page}`);
}

/**
 * Get aggregated stats for a hospital+queue. Requires auth.
 * @param {{ hospitalId?, queueKey? }} params
 */
export async function getFeedbackStats({ hospitalId, queueKey } = {}) {
  const qs = new URLSearchParams();
  if (hospitalId) qs.set("hospital_id", hospitalId);
  if (queueKey)   qs.set("queue_key",   queueKey);
  return apiFetch(`/api/feedback/stats?${qs}`);
}

/**
 * Get accuracy-over-time data for sparkline. Requires auth.
 */
export async function getAccuracyOverTime() {
  return apiFetch("/api/feedback/accuracy");
}

// ── Health check ──────────────────────────────────────────────
export async function healthCheck() {
  return apiFetch("/api/health");
}
