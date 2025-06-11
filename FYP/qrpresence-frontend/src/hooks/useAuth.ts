
import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../utils/config';

export const useAuth = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);

 const validateToken = (token: string | null): boolean => {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (e) {
    return false;
  }
};


  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return false;
      
      const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        setAuthToken(data.access);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);

  const getValidToken = useCallback(async (): Promise<string> => {
    let token = localStorage.getItem('access_token');
    
    if (token && validateToken(token)) {
      return token;
    }
    
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return localStorage.getItem('access_token') || '';
    }
    
    throw new Error('Session expired. Please login again.');
  }, [attemptTokenRefresh]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && validateToken(token)) {
      setAuthToken(token);
    }
  }, []);

  return { authToken, getValidToken, attemptTokenRefresh };
};