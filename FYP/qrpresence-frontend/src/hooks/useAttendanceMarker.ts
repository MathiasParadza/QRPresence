import { useState, useCallback } from 'react';
import axios from 'axios';
import { checkGeoLocation } from '../utils/geo'; // Ensure this returns { latitude, longitude } | null

interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

interface TokenRefreshResponse {
  access: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

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

  const extractErrorMessage = (err: any): string => {
    if (err && typeof err === 'object') {
      if ('response' in err && err.response?.data?.detail) {
        return err.response.data.detail;
      }
      if ('message' in err && typeof err.message === 'string') {
        return err.message;
      }
    }

    return 'An unknown error occurred.';
  };

  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token found. Please log in again.');

      const { data } = await axios.post<TokenRefreshResponse>(
        `${API_BASE_URL}/api/token/refresh/`,
        { refresh: refreshToken }
      );

      storeAccessToken(data.access);
      return true;
    } catch (err: any) {
      console.error('Token refresh failed:', err);
      clearTokens();

      const msg = extractErrorMessage(err);
      setError(msg);
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

        let accessToken = token || getAccessToken();

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

        const response = await axios.post(
          `${API_BASE_URL}/api/mark/`,
          {
            qr_data: qrData,
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status < 200 || response.status >= 300) {
          throw new Error('Attendance marking failed with an unexpected status.');
        }

        console.log('Attendance marked successfully:', response.data);
        return true;
      } catch (err: any) {
        const msg = extractErrorMessage(err);
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
