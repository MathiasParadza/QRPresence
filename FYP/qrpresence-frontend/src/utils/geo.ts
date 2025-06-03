// src/utils/geo.ts

export const checkGeoLocation = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        console.log('Geolocation position:', position); // Log position for debugging
        // TODO: Compare with backend-allowed coordinates (call API)
        resolve(true); // Simplified; add actual logic
      },
      (error: GeolocationPositionError) => {
        console.error('Geolocation error:', error); // Log error for debugging
        resolve(false);
      }
    );
  });
};
