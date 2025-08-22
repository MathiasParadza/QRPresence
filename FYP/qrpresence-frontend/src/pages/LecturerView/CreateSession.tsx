import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Users, Target, Navigation, Hash, BookOpen } from "lucide-react";
import "./CreateSession.css";

// Custom Button Component
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  type?: "button" | "submit";
}> = ({ children, onClick, disabled = false, variant = "primary", className = "", type = "button" }) => {
  const baseStyles = "create-session-button";
  const variantStyles = {
    primary: "create-session-button--primary",
    secondary: "create-session-button--secondary",
    danger: "create-session-button--danger"
  };
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'create-session-button--disabled' : ''} ${className}`}
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
    <div className="create-session-field">
      <label className="create-session-field__label">
        {label}
        {required && <span className="create-session-field__required">*</span>}
      </label>
      <div className="create-session-field__wrapper">
        {icon && (
          <div className="create-session-field__icon">
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
          className={`create-session-field__input ${icon ? 'create-session-field__input--with-icon' : ''} ${error ? 'create-session-field__input--error' : ''}`}
        />
      </div>
      {error && <p className="create-session-field__error">{error}</p>}
    </div>
  );
};

// Custom Select Component
const Select: React.FC<{
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  label: string;
  error?: string;
  loading?: boolean;
}> = ({ value, onChange, options, placeholder, required = false, disabled = false, icon, label, error, loading = false }) => {
  return (
    <div className="create-session-field">
      <label className="create-session-field__label">
        {label}
        {required && <span className="create-session-field__required">*</span>}
      </label>
      <div className="create-session-field__wrapper">
        {icon && (
          <div className="create-session-field__icon">
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled || loading}
          required={required}
          className={`create-session-field__select ${icon ? 'create-session-field__select--with-icon' : ''} ${error ? 'create-session-field__select--error' : ''} ${loading ? 'create-session-field__select--loading' : ''}`}
          title={label}
        >
          <option value="">{loading ? "Loading..." : (placeholder || "Select an option")}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {loading && (
          <div className="create-session-field__loading">
            <div className="create-session-spinner"></div>
          </div>
        )}
      </div>
      {error && <p className="create-session-field__error">{error}</p>}
    </div>
  );
};

// Custom Info Box Component
const InfoBox: React.FC<{
  type: "success" | "info";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ type, icon, title, children }) => {
  return (
    <div className={`create-session-info-box create-session-info-box--${type}`}>
      <div className="create-session-info-box__icon">
        {icon}
      </div>
      <div className="create-session-info-box__content">
        <h4 className="create-session-info-box__title">{title}</h4>
        <div className="create-session-info-box__text">{children}</div>
      </div>
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

  // Prepare course options for Select component
  const courseOptions = courses.map(course => ({
    value: course.id,
    label: `${course.code} - ${course.title} (${course.credit_hours} credits)`
  }));

  return (
    <div className="create-session-container">
      <div className="create-session-container__background"></div>
      <div className="create-session-container__overlay"></div>
      
      <div className="create-session-content">
        {/* Header */}
        <div className="create-session-header">
          <div className="create-session-header__back-button">
            <Button
              variant="secondary"
              onClick={() => navigate("/lecturerview")}
            >
              <ArrowLeft className="create-session-icon" />
              Back to Dashboard
            </Button>
          </div>
          
          <h1 className="create-session-header__title">Create New Session</h1>
          <p className="create-session-header__subtitle">Set up a new attendance session with location tracking</p>
        </div>

        {/* Form Card */}
        <div className="create-session-card">
          <div className="create-session-form">
            {/* Basic Information Section */}
            <div className="create-session-form__section">
              <div className="create-session-form__row create-session-form__row--two-columns">
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
                  icon={<Hash className="create-session-icon" />}
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
                  icon={<Users className="create-session-icon" />}
                  error={errors.className}
                />
              </div>

              {/* Course Selection */}
              <Select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setErrors(prev => ({ ...prev, course: undefined }));
                }}
                options={courseOptions}
                placeholder="Select a course"
                required
                disabled={coursesLoading}
                icon={<BookOpen className="create-session-icon" />}
                label="Course"
                error={errors.course ?? coursesError ?? undefined}

                loading={coursesLoading}
              />
              
              {!coursesLoading && courses.length === 0 && !coursesError && (
                <p className="create-session-field__error">No courses available. Please create courses first.</p>
              )}
            </div>

            {/* Location Settings Section */}
            <div className="create-session-form__section">
              <div className="create-session-section-header">
                <h3 className="create-session-section-title">Location Settings</h3>
                <Button
                  variant="secondary"
                  onClick={handleUseCurrentLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <>
                      <div className="create-session-spinner"></div>
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <Navigation className="create-session-icon" />
                      Use Current Location
                    </>
                  )}
                </Button>
              </div>
              
              <div className="create-session-form__row create-session-form__row--two-columns">
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
                  icon={<MapPin className="create-session-icon" />}
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
                  icon={<MapPin className="create-session-icon" />}
                  min={-180}
                  max={180}
                  step={0.01}
                  error={errors.gpsLongitude}
                />
              </div>

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
                icon={<Target className="create-session-icon" />}
                min={10}
                max={1000}
                error={errors.allowedRadius}
              />
            </div>

            {/* Info Boxes */}
            <div className="create-session-form__section">
              <InfoBox
                type="success"
                icon={<Navigation className="create-session-icon" />}
                title="Location Tip"
              >
                Click "Use Current Location" to automatically fill in your GPS coordinates.
                Manual entries must be between -90 to 90 for latitude and -180 to 180 for longitude.
              </InfoBox>

              <InfoBox
                type="info"
                icon={
                  <svg className="create-session-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                }
                title="Attendance Tracking"
              >
                Students must be within the specified radius (10-1000 meters) of the GPS coordinates to mark their attendance.
              </InfoBox>
            </div>

            {/* Action Buttons */}
            <div className="create-session-actions">
              <Button
                variant="secondary"
                onClick={() => navigate("/session-list")}
                disabled={loading}
                className="create-session-actions__button"
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleCreateSession}
                disabled={loading || coursesLoading || !selectedCourse}
                className="create-session-actions__button"
              >
                {loading ? (
                  <>
                    <div className="create-session-spinner"></div>
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Plus className="create-session-icon" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;