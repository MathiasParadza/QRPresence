declare module '../utils/wifi-geo' {
  export function checkGeoLocation(): Promise<boolean>;
  export function checkWifi(): Promise<boolean>;
}