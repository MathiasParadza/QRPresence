
export const API_ENDPOINTS = {
  MARK_ATTENDANCE: 'http://127.0.0.1:8000/api/mark/',
  REFRESH_TOKEN: 'http://127.0.0.1:8000/api/token/refresh/',
  LOGIN: 'http://127.0.0.1:8000/api/login/'
};

export const SCANNER_CONFIG = {
  SCAN_INTERVAL: 100,
  GEOLOCATION_TIMEOUT: 10000,
  MAX_SCAN_ATTEMPTS: 5,
  TOAST_DURATION: 5000
};

export const QR_CODE_PATTERN = /^attendance:[a-zA-Z0-9-_]+$/;