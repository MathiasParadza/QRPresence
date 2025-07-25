const BASE_URL = 'http://127.0.0.1:8000';
export const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('access_token');
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
        headers.append('Content-Type', 'application/json');
    }
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
        if (!response.ok) {
            if (response.status === 401) {
                // Handle unauthorized (e.g., redirect to login)
                return { status: response.status, error: 'Unauthorized' };
            }
            const errorData = await response.json().catch(() => ({}));
            return { status: response.status, error: errorData.message || response.statusText };
        }
        const data = await response.json();
        return { status: response.status, data };
    }
    catch (error) {
        console.error('API request failed:', error);
        return { status: 500, error: 'Network request failed' };
    }
};
// Helper functions for common methods
export const api = {
    get: (endpoint) => fetchWithAuth(endpoint),
    post: (endpoint, body) => fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    }),
    put: (endpoint, body) => fetchWithAuth(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    }),
    delete: (endpoint) => fetchWithAuth(endpoint, {
        method: 'DELETE',
    }),
};
