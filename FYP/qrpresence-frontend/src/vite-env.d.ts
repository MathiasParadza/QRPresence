/// <reference types="vite/client" />
// src/vite-env.d.ts


declare module '@/utils/api' {
  import { AxiosInstance } from 'axios';
  const api: AxiosInstance;
  export default api;
}