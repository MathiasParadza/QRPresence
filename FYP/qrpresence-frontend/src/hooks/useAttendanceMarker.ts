import { useState, useCallback } from 'react';

// Inline implementation of checkGeoLocation
const checkGeoLocation = (): Promise<{ latitude: number; longitude: number } | false> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(false)
    );
  });
};

interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

interface TokenRefreshResponse {
  access: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const storeAccessToken = (token: string) => localStorage.setItem('access_token', token);
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const useAttendanceMarker = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateToken = useCallback((token: string | null): token is string => {
    return typeof token === 'string' && token.split('.').length === 3;
  }, []);

  const extractErrorMessage = async (response: Response, fallbackMsg: string) => {
    try {
      const data = await response.json();
      if (data?.detail) return data.detail;
      if (data?.message) return data.message;
    } catch {
      // Ignore JSON parse errors
    }
    return fallbackMsg;
  };

  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Token refresh failed');
        throw new Error(msg);
      }

      const data: TokenRefreshResponse = await response.json();
      storeAccessToken(data.access);
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      clearTokens();
      setError(err instanceof Error ? err.message : 'Unknown error during token refresh');
      return false;
    }
  }, []);

  const markAttendance = useCallback(
    async (qrData: string, token?: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const geoResult = await checkGeoLocation();
        if (!geoResult || typeof geoResult === 'boolean') {
          throw new Error('Unable to get valid geolocation coordinates. Please enable location services.');
        }

        const coords = geoResult as GeoCoordinates;

        let accessToken = token ?? getAccessToken();

        if (!validateToken(accessToken)) {
          const refreshed = await attemptTokenRefresh();
          if (!refreshed) {
            throw new Error('Authentication required. Please log in to mark attendance.');
          }
          accessToken = getAccessToken();
          if (!validateToken(accessToken)) {
            throw new Error('Failed to obtain a valid access token after refresh. Please log in.');
          }
        }

        const response = await fetch(`${API_BASE_URL}/api/mark/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qr_data: qrData,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
        });

        if (!response.ok) {
          const msg = await extractErrorMessage(response, 'Attendance marking failed');
          throw new Error(msg);
        }

        const responseData = await response.json();
        console.log('Attendance marked successfully:', responseData);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Attendance error:', msg);
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [attemptTokenRefresh, validateToken]
  );

  return {
    markAttendance,
    attemptTokenRefresh,
    loading,
    error,
  };
};
