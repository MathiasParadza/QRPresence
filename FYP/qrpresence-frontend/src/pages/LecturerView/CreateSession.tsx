import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Users, Target, Navigation, Hash, BookOpen } from "lucide-react";

// Custom Button Component
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  type?: "button" | "submit";
}> = ({ children, onClick, disabled = false, variant = "primary", className = "", type = "button" }) => {
  const baseStyles = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-fit";
  
  const variantStyles = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 shadow-lg hover:shadow-xl",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 shadow-md hover:shadow-lg",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 shadow-lg hover:shadow-xl"
  };
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Custom Input Component
const Input: React.FC<{
  type?: string;
  name?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  icon?: React.ReactNode;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
}> = ({ type = "text", name, value, onChange, placeholder, required = false, icon, label, min, max, step, error }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`block w-full rounded-lg border-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200 ${
            icon ? 'pl-10' : 'pl-4'
          } pr-4 py-3 text-gray-900 placeholder-gray-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// Custom Card Component
const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

// Toast mock with better types
interface Toast {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const toast: Toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`),
  info: (message: string) => alert(`ℹ️ ${message}`)
};

interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  credit_hours: number;
}

interface FormErrors {
  sessionId?: string;
  className?: string;
  gpsLatitude?: string;
  gpsLongitude?: string;
  allowedRadius?: string;
  course?: string;
  general?: string;
}

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState("");
  const [className, setClassName] = useState("");
  const [gpsLatitude, setGpsLatitude] = useState<number | "">("");
  const [gpsLongitude, setGpsLongitude] = useState<number | "">("");
  const [allowedRadius, setAllowedRadius] = useState<number>(100);
  const [selectedCourse, setSelectedCourse] = useState<string | number>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        setCoursesError(null);
        const token = localStorage.getItem("access_token");
        
        if (!token) {
          throw new Error("Authentication token not found");
        }
        
        const response = await fetch("http://127.0.0.1:8000/api/lecturer/courses/", {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          if (response.status === 403) {
            throw new Error("Only lecturers can access courses");
          }
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }
        
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCoursesError(error instanceof Error ? error.message : "Failed to load courses. Please try again later.");
      } finally {
        setCoursesLoading(false);
      }
    };
    
    fetchCourses();
  }, [navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!sessionId.trim()) {
      newErrors.sessionId = "Session ID is required";
    } else if (sessionId.length > 50) {
      newErrors.sessionId = "Session ID must be less than 50 characters";
    }
    
    if (!className.trim()) {
      newErrors.className = "Class name is required";
    }
    
    if (gpsLatitude === "") {
      newErrors.gpsLatitude = "Latitude is required";
    } else if (typeof gpsLatitude === "number" && (gpsLatitude < -90 || gpsLatitude > 90)) {
      newErrors.gpsLatitude = "Latitude must be between -90 and 90";
    }
    
    if (gpsLongitude === "") {
      newErrors.gpsLongitude = "Longitude is required";
    } else if (typeof gpsLongitude === "number" && (gpsLongitude < -180 || gpsLongitude > 180)) {
      newErrors.gpsLongitude = "Longitude must be between -180 and 180";
    }
    
    if (!selectedCourse) {
      newErrors.course = "Course selection is required";
    }
    
    if (allowedRadius < 10 || allowedRadius > 1000) {
      newErrors.allowedRadius = "Radius must be between 10 and 1000 meters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }
    
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLatitude(position.coords.latitude);
        setGpsLongitude(position.coords.longitude);
        toast.success("Location updated successfully!");
        setGettingLocation(false);
        // Clear any previous errors
        setErrors(prev => ({
          ...prev,
          gpsLatitude: undefined,
          gpsLongitude: undefined
        }));
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Failed to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable it in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out.";
            break;
        }
        toast.error(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
const handleCreateSession = async () => {
  if (!validateForm()) {
    toast.error("Please fix the errors in the form before submitting.");
    return;
  }
  try {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Payload matches the model exactly
    const payload = {
      session_id: sessionId,
      class_name: className,
      gps_latitude: Number(gpsLatitude),
      gps_longitude: Number(gpsLongitude),
      allowed_radius: allowedRadius,
      course: Number(selectedCourse), // Matches model field name
    };

    const response = await fetch("http://127.0.0.1:8000/api/sessions/", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle specific field errors
      const apiErrors: FormErrors = {};
      if (errorData.session_id) {
        apiErrors.sessionId = errorData.session_id.join(", ");
      }
      if (errorData.class_name) {
        apiErrors.className = errorData.class_name.join(", ");
      }
      if (errorData.gps_latitude) {
        apiErrors.gpsLatitude = errorData.gps_latitude.join(", ");
      }
      if (errorData.gps_longitude) {
        apiErrors.gpsLongitude = errorData.gps_longitude.join(", ");
      }
      if (errorData.allowed_radius) {
        apiErrors.allowedRadius = errorData.allowed_radius.join(", ");
      }
      if (errorData.course) {
        apiErrors.course = errorData.course.join(", ");
      }
      
      setErrors(apiErrors);
      throw new Error("Failed to create session. Please check the form for errors.");
    }

    toast.success("Session created successfully!");
    navigate("/session-list");
    
  } catch (error) {
    console.error("Error creating session:", error);
    toast.error(
      error instanceof Error 
        ? error.message || "Failed to create session. Please try again."
        : "Failed to create session. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="secondary"
                onClick={() => navigate("/lecturerview")}
                className="hover:bg-blue-50 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Session</h1>
            <p className="text-gray-600">Set up a new attendance session with location tracking</p>
          </div>

          {/* Form Card */}
          <Card className="p-8">
            <div className="space-y-6">
              {/* Session ID and Class Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  name="sessionId"
                  value={sessionId}
                  onChange={(e) => {
                    setSessionId(e.target.value);
                    setErrors(prev => ({ ...prev, sessionId: undefined }));
                  }}
                  placeholder="Enter unique session ID"
                  label="Session ID"
                  required
                  icon={<Hash className="w-5 h-5" />}
                  error={errors.sessionId}
                />
                
                <Input
                  name="className"
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                    setErrors(prev => ({ ...prev, className: undefined }));
                  }}
                  placeholder="Enter class name"
                  label="Class Name"
                  required
                  icon={<Users className="w-5 h-5" />}
                  error={errors.className}
                />
              </div>

              {/* Course Selection */}
              <div className="space-y-2">
                <label htmlFor="course-select" className="block text-sm font-medium text-gray-700">
                  Course
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <select
                    id="course-select"
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      setErrors(prev => ({ ...prev, course: undefined }));
                    }}
                    disabled={coursesLoading}
                    className={`block w-full rounded-lg border-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200 pl-10 pr-4 py-3 text-gray-900 ${
                      coursesLoading ? 'bg-gray-100' : ''
                    } ${errors.course ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  >
                    <option value="">{coursesLoading ? "Loading courses..." : "Select a course"}</option>
                    {!coursesLoading && courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.title} ({course.credit_hours} credits)
                      </option>
                    ))}
                  </select>
                  {coursesLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    </div>
                  )}
                </div>
                {errors.course && (
                  <p className="text-sm text-red-500 mt-1">{errors.course}</p>
                )}
                {coursesError && (
                  <p className="text-sm text-red-500 mt-1">{coursesError}</p>
                )}
                {!coursesLoading && courses.length === 0 && !coursesError && (
                  <p className="text-sm text-gray-500 mt-1">No courses available. Please create courses first.</p>
                )}
              </div>

              {/* GPS Coordinates Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Location Settings</h3>
                  <Button
                    variant="secondary"
                    onClick={handleUseCurrentLocation}
                    disabled={gettingLocation}
                    className="hover:bg-green-50 hover:text-green-700"
                  >
                    {gettingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Use Current Location
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="number"
                    name="gpsLatitude"
                    value={gpsLatitude}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                      setGpsLatitude(value);
                      setErrors(prev => ({ ...prev, gpsLatitude: undefined }));
                    }}
                    placeholder="e.g., -15.397596"
                    label="GPS Latitude"
                    required
                    icon={<MapPin className="w-5 h-5" />}
                    min={-90}
                    max={90}
                    step={0.01}
                    error={errors.gpsLatitude}
                  />
                  
                  <Input
                    type="number"
                    name="gpsLongitude"
                    value={gpsLongitude}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                      setGpsLongitude(value);
                      setErrors(prev => ({ ...prev, gpsLongitude: undefined }));
                    }}
                    placeholder="e.g., 28.322817"
                    label="GPS Longitude"
                    required
                    icon={<MapPin className="w-5 h-5" />}
                    min={-180}
                    max={180}
                    step={0.01}
                    error={errors.gpsLongitude}
                  />
                </div>
              </div>

              {/* Allowed Radius */}
              <Input
                type="number"
                name="allowedRadius"
                value={allowedRadius}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 100;
                  setAllowedRadius(value);
                  setErrors(prev => ({ ...prev, allowedRadius: undefined }));
                }}
                placeholder="Enter radius in meters"
                label="Allowed Radius (meters)"
                required
                icon={<Target className="w-5 h-5" />}
                min={10}
                max={1000}
                error={errors.allowedRadius}
              />

              {/* Info Boxes */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 mt-0.5">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">Location Tip</h4>
                      <p className="text-sm text-green-700">
                        Click "Use Current Location" to automatically fill in your GPS coordinates.
                        Manual entries must be between -90 to 90 for latitude and -180 to 180 for longitude.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Attendance Tracking</h4>
                      <p className="text-sm text-blue-700">
                        Students must be within the specified radius (10-1000 meters) of the GPS coordinates to mark their attendance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  onClick={handleCreateSession}
                  disabled={loading || coursesLoading || !selectedCourse}
                  className="flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Session...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Session
                    </>
                  )}
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => navigate("/session-list")}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;