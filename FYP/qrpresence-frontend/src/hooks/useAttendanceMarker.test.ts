import { renderHook, act } from '@testing-library/react-hooks';
import { useAttendanceMarker } from './useAttendanceMarker'; // Adjust path as needed
import { API_ENDPOINTS, QR_CODE_PATTERN, SCANNER_CONFIG } from '../utils/config'; // Adjust path
// import 'jest'; // Not needed for most setups, remove this line

// Jest globals are available automatically in the test environment; no import needed.

// Mock useAuth hook
jest.mock('./useAuth', () => ({
  useAuth: () => ({
    getValidToken: jest.fn().mockResolvedValue('test-token-123'),
  }),
}));

// Mock config (optional, if actual values are problematic for tests)
// jest.mock('../utils/config', () => ({
//   ...jest.requireActual('../utils/config'), // Preserve other exports
//   API_ENDPOINTS: {
//     MARK_ATTENDANCE: 'http://localhost/api/mark/', // Mocked endpoint
//     // GET_SESSION_DETAILS: (sessionId) => `http://localhost/api/sessions/${sessionId}/` // If it were in config
//   },
//   QR_CODE_PATTERN: /^attendance:[a-zA-Z0-9-_]+$/,
// }));

// Helper for mock fetch
global.fetch = jest.fn();

const mockNavigatorGeolocation = () => {
  const mockGeolocation = {
    getCurrentPosition: jest.fn()
      .mockImplementationOnce((success) => Promise.resolve(success({
        coords: {
          latitude: 10.0,
          longitude: 20.0,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }))),
    watchPosition: jest.fn(),
    clearWatch: jest.fn()
  };
  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    configurable: true,
  });
  return mockGeolocation;
};


describe('useAttendanceMarker', () => {
  let mockGeolocation;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
    mockGeolocation = mockNavigatorGeolocation();
    (fetch as jest.Mock).mockClear(); // Clear fetch mock
  });

  const validQrData = 'attendance:session123';
  // const mockUserPosition = { latitude: 10.0, longitude: 20.0 }; // Defined by mockNavigatorGeolocation default

  // Mock session details for client-side check
  const mockSessionDetails = {
    gps_latitude: 10.0,
    gps_longitude: 20.0,
    allowed_radius: 100, // User is within 0m
  };

  const mockSessionDetailsFar = {
    gps_latitude: 10.1, // User will be too far
    gps_longitude: 20.1,
    allowed_radius: 50,
  };

  it('should mark attendance successfully with client-side check pass', async () => {
    (fetch as jest.Mock)
      // For GET session details (client-side check)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionDetails
      })
      // For POST mark attendance
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ detail: 'Attendance marked successfully.' })
      });

    const { result, waitForNextUpdate } = renderHook(() => useAttendanceMarker());

    // Use try/catch to prevent test failing if markAttendance throws an unexpected error
    // that isn't the one being tested for, allowing assertions on error state.
    await act(async () => {
      try {
        await result.current.markAttendance(validQrData);
      } catch(e) {
        // console.error("Test 'should mark attendance successfully' caught:", e);
      }
      // await waitForNextUpdate({ timeout: SCANNER_CONFIG.GEOLOCATION_TIMEOUT + 1000 });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    // Check fetch calls: 1 for session details, 1 for mark attendance
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/sessions/session123'), expect.any(Object));
    expect(fetch).toHaveBeenCalledWith(API_ENDPOINTS.MARK_ATTENDANCE, expect.any(Object));
  });

  it('should fail if client-side geolocation check indicates user is too far', async () => {
    (fetch as jest.Mock)
      // For GET session details (user is far)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionDetailsFar
      });

    const { result, waitForNextUpdate } = renderHook(() => useAttendanceMarker());

    await act(async () => {
      try {
        await result.current.markAttendance(validQrData);
      } catch (e) {
        // Expected error, check result.current.error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toMatch(/you are .*m away. you must be within .*m/i);
    expect(fetch).toHaveBeenCalledTimes(1); // Only session details call
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/sessions/session123'), expect.any(Object));
  });

  it('should fail if fetching session details for client-side check fails', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Session not found.' })
      });

    const { result, waitForNextUpdate } = renderHook(() => useAttendanceMarker());

    await act(async () => {
      try {
        await result.current.markAttendance(validQrData);
      } catch (e) { /* Expected */ }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Session not found.');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should fail if mark attendance API call fails', async () => {
    (fetch as jest.Mock)
      // For GET session details (client-side check passes)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionDetails
      })
      // For POST mark attendance (fails)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Backend validation failed.' })
      });

    const { result, waitForNextUpdate } = renderHook(() => useAttendanceMarker());

    await act(async () => {
      try {
        await result.current.markAttendance(validQrData);
      } catch (e) { /* Expected */ }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Backend validation failed.');
    expect(fetch).toHaveBeenCalledTimes(2); // Both calls made
  });

  it('should fail for invalid QR code format (client-side)', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAttendanceMarker());

    await act(async () => {
      try {
        await result.current.markAttendance('invalid-qr-data');
      } catch (e) { /* Expected */ }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Invalid QR Code format.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should fail if browser geolocation fetch fails', async () => {
    mockGeolocation.getCurrentPosition.mockReset(); // Reset to clear default mock
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) =>
      // Ensure this is treated as an async operation if the hook expects a promise
      // For navigator.geolocation, it's callback based, not promise based directly in implementation
      // The hook wraps it in a promise, so error callback should be called.
      error({ code: 1, message: 'User denied Geolocation' })
    );

    const { result, waitForNextUpdate } = renderHook(() => useAttendanceMarker());

    await act(async () => {
      try {
        await result.current.markAttendance(validQrData);
      } catch (e) { /* Expected */ }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Geolocation error: User denied Geolocation');
    expect(fetch).not.toHaveBeenCalled();
  });

  // Test for session details being incomplete
  it('should fail if session details are incomplete from API', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gps_latitude: 10.0, allowed_radius: 50 }) // Missing gps_longitude
      });

    const { result, waitForNextUpdate } = renderHook(() => useAttendanceMarker());

    await act(async () => {
      try {
        await result.current.markAttendance(validQrData);
      } catch (e) { /* Expected */ }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Session location data is incomplete or missing.');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

});
