// src/utils/geo.ts
export const checkGeoLocation = async () => {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition((position) => {
            console.log('Geolocation position:', position); // Log position for debugging
            // TODO: Compare with backend-allowed coordinates (call API)
            resolve(true); // Simplified; add actual logic
        }, (error) => {
            console.error('Geolocation error:', error); // Log error for debugging
            resolve(false);
        });
    });
};
