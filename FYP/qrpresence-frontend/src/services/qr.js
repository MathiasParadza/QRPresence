import api from './api';

export const generateQR = (data) => api.post('/api/generate-qr/', data);
export const verifyAttendance = (encryptedData) =>
  api.post('/api/verify-attendance/', { qr_data: encryptedData });