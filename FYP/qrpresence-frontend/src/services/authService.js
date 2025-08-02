const API_BASE = "/api";
export const login = async (username, password) => {
    const response = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
    }
    return response.json();
};
export const getCurrentUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token)
        throw new Error("No token found");
    const response = await fetch(`${API_BASE}/current-user/`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch user");
    }
    return response.json();
};
export const refreshToken = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh)
        throw new Error("No refresh token");
    const response = await fetch(`${API_BASE}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
        throw new Error("Token refresh failed");
    }
    return response.json();
};
