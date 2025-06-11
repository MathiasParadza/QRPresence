import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { API_ENDPOINTS, SCANNER_CONFIG, QR_CODE_PATTERN } from '../utils/config';

export const useAttendanceMarker = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { getValidToken } = useAuth();

  const checkGeoLocation = useCallback(async (): Promise<boolean> => {
    // Implement actual geolocation validation logic
    return true;
  }, []);

  const getPositionWithTimeout = useCallback(async (timeout = SCANNER_CONFIG.GEOLOCATION_TIMEOUT): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      const geoTimeout = setTimeout(() => {
        reject(new Error('Geolocation request timed out'));
      }, timeout);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(geoTimeout);
          resolve(position);
        },
        (error) => {
          clearTimeout(geoTimeout);
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: timeout - 1000
        }
      );
    });
  }, []);

  const markAttendance = useCallback(async (qrData: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!QR_CODE_PATTERN.test(qrData)) {
        throw new Error('Invalid QR Code format');
      }

      const [, sessionId] = qrData.split(':');
      const position = await getPositionWithTimeout();
      const isLocationValid = await checkGeoLocation();

      if (!isLocationValid) {
        throw new Error('You must be in the classroom to mark attendance');
      }

      const token = await getValidToken();
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to mark attendance');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkGeoLocation, getPositionWithTimeout, getValidToken]);

  return { markAttendance, loading, error };
};
