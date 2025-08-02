import { refreshToken } from "@/services/authService";

// Decode JWT to check expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch {
    return true; // if decoding fails, assume it's expired
  }
};

const fetchWithAuth = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  let token = localStorage.getItem("access_token");
  const headers = new Headers(init?.headers);

  // Preemptively refresh token if it's expired
  if (token && isTokenExpired(token)) {
    try {
      const tokens = await refreshToken();
      localStorage.setItem("access_token", tokens.access);
      token = tokens.access;
    } catch (err) {
      console.error("Token pre-refresh failed:", err);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      throw err;
    }
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  // Retry on 401 if not yet retried
  if (response.status === 401) {
    type RetryableRequestInit = RequestInit & { _retry?: boolean };
    const originalRequest: RetryableRequestInit = init || {};
    if (!originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = await refreshToken();
        localStorage.setItem("access_token", tokens.access);
        headers.set("Authorization", `Bearer ${tokens.access}`);
        return fetch(input, {
          ...originalRequest,
          headers,
        });
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        throw refreshError;
      }
    }
  }

  return response;
};

export { fetchWithAuth };
