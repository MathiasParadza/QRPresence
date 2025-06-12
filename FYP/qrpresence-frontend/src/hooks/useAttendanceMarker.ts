import { useCallback, useState } from 'react';
import { useAuth } from './useAuth'; // Assuming this provides getValidToken
import { API_ENDPOINTS, SCANNER_CONFIG, QR_CODE_PATTERN } from '../utils/config';

// Helper to extract error messages (from previous step)
const getErrorMessage = (errorData: any): string => {
  // ... (implementation from previous step)
  if (typeof errorData === 'string') return errorData;
  if (errorData && typeof errorData === 'object') {
    if (errorData.detail) return String(errorData.detail);
    if (errorData.message) return String(errorData.message);
    const fieldErrors = Object.keys(errorData).map(key => {
      const messages = Array.isArray(errorData[key]) ? errorData[key] : [errorData[key]];
      return `${key}: ${messages.map(String).join(', ')}`;
    });
    if (fieldErrors.length > 0) return fieldErrors.join('; ');
  }
  return 'An unknown error occurred.';
};

// Frontend Haversine function
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Assume API_ENDPOINTS.GET_SESSION_DETAILS will be like: (sessionId: string) => `/api/sessions/${sessionId}/`
// For now, let's define a placeholder if not in actual config
const getSessionDetailsEndpoint = (sessionId: string) => `http://127.0.0.1:8000/api/sessions/${sessionId}/`;


export const useAttendanceMarker = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { getValidToken } = useAuth();

  const getPositionWithTimeout = useCallback(async (timeout = SCANNER_CONFIG.GEOLOCATION_TIMEOUT): Promise<GeolocationPosition> => {
    // ... (implementation as before)
    return new Promise((resolve, reject) => {
      const geoTimeout = setTimeout(() => reject(new Error('Geolocation request timed out')), timeout);
      navigator.geolocation.getCurrentPosition(
        (position) => { clearTimeout(geoTimeout); resolve(position); },
        (err) => { clearTimeout(geoTimeout); reject(new Error(`Geolocation error: ${err.message}`)); },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: timeout - 1000 }
      );
    });
  }, []);

  // Updated checkGeoLocation
  const checkGeoLocation = useCallback(async (
    sessionId: string,
    userLatitude: number,
    userLongitude: number,
    token: string
  ): Promise<boolean> => {
    try {
      // const endpoint = API_ENDPOINTS.GET_SESSION_DETAILS?.(sessionId) || getSessionDetailsEndpoint(sessionId);
      // For this subtask, let's use the hardcoded formation getSessionDetailsEndpoint
      const endpoint = getSessionDetailsEndpoint(sessionId);

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Session details not found or error: ${response.status}` }));
        throw new Error(getErrorMessage(errorData));
      }

      const sessionDetails = await response.json();

      if (sessionDetails.gps_latitude == null || sessionDetails.gps_longitude == null || sessionDetails.allowed_radius == null) {
        throw new Error('Session location data is incomplete or missing.');
      }

      const distance = haversine(
        sessionDetails.gps_latitude,
        sessionDetails.gps_longitude,
        userLatitude,
        userLongitude
      );

      if (distance > sessionDetails.allowed_radius) {
        throw new Error(`You are ${distance.toFixed(0)}m away. You must be within ${sessionDetails.allowed_radius}m of the session (client check).`);
      }
      return true;
    } catch (err) {
      // Rethrow with a processed message if it's a custom error, or the original if it's already an Error instance
      const message = err instanceof Error ? err.message : String(err);
      // setError(message); // The main markAttendance function will call setError
      throw new Error(message); // Propagate error to markAttendance
    }
  }, [getValidToken]); // Added getValidToken if it's used to fetch session details token

  const markAttendance = useCallback(async (qrData: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!QR_CODE_PATTERN.test(qrData)) {
        throw new Error('Invalid QR Code format.');
      }

      const [, sessionId] = qrData.split(':');
      const token = await getValidToken(); // Get token once

      let position;
      try {
        position = await getPositionWithTimeout();
      } catch (geoError) {
        throw geoError; // Re-throw to be caught by the outer catch
      }

      // Perform client-side geolocation check
      await checkGeoLocation(sessionId, position.coords.latitude, position.coords.longitude, token);
      // If checkGeoLocation throws an error, it will be caught by the main catch block.

      const response = await fetch(API_ENDPOINTS.MARK_ATTENDANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to mark attendance: ${response.status}` }));
        throw new Error(getErrorMessage(errorData));
      }
      // Success: No explicit data needed from response for now
    } catch (err) {
      const messageToDisplay = err instanceof Error ? err.message : String(err);
      setError(messageToDisplay);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPositionWithTimeout, checkGeoLocation, getValidToken]); // Added checkGeoLocation to dependencies

  return { markAttendance, loading, error };
};
