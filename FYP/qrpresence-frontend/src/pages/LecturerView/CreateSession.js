import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Users, Target, Navigation, Hash, BookOpen } from "lucide-react";
import "./CreateSession.css";
// Custom Button Component
const Button = ({ children, onClick, disabled = false, variant = "primary", className = "", type = "button" }) => {
    const baseStyles = "create-session-button";
    const variantStyles = {
        primary: "create-session-button--primary",
        secondary: "create-session-button--secondary",
        danger: "create-session-button--danger"
    };
    return (_jsx("button", { type: type, className: `${baseStyles} ${variantStyles[variant]} ${disabled ? 'create-session-button--disabled' : ''} ${className}`, onClick: onClick, disabled: disabled, children: children }));
};
// Custom Input Component
const Input = ({ type = "text", name, value, onChange, placeholder, required = false, icon, label, min, max, step, error }) => {
    return (_jsxs("div", { className: "create-session-field", children: [_jsxs("label", { className: "create-session-field__label", children: [label, required && _jsx("span", { className: "create-session-field__required", children: "*" })] }), _jsxs("div", { className: "create-session-field__wrapper", children: [icon && (_jsx("div", { className: "create-session-field__icon", children: icon })), _jsx("input", { type: type, name: name, value: value, onChange: onChange, placeholder: placeholder, required: required, min: min, max: max, step: step, className: `create-session-field__input ${icon ? 'create-session-field__input--with-icon' : ''} ${error ? 'create-session-field__input--error' : ''}` })] }), error && _jsx("p", { className: "create-session-field__error", children: error })] }));
};
// Custom Select Component
const Select = ({ value, onChange, options, placeholder, required = false, disabled = false, icon, label, error, loading = false }) => {
    return (_jsxs("div", { className: "create-session-field", children: [_jsxs("label", { className: "create-session-field__label", children: [label, required && _jsx("span", { className: "create-session-field__required", children: "*" })] }), _jsxs("div", { className: "create-session-field__wrapper", children: [icon && (_jsx("div", { className: "create-session-field__icon", children: icon })), _jsxs("select", { value: value, onChange: onChange, disabled: disabled || loading, required: required, className: `create-session-field__select ${icon ? 'create-session-field__select--with-icon' : ''} ${error ? 'create-session-field__select--error' : ''} ${loading ? 'create-session-field__select--loading' : ''}`, title: label, children: [_jsx("option", { value: "", children: loading ? "Loading..." : (placeholder || "Select an option") }), options.map((option, index) => (_jsx("option", { value: option.value, children: option.label }, index)))] }), loading && (_jsx("div", { className: "create-session-field__loading", children: _jsx("div", { className: "create-session-spinner" }) }))] }), error && _jsx("p", { className: "create-session-field__error", children: error })] }));
};
// Custom Info Box Component
const InfoBox = ({ type, icon, title, children }) => {
    return (_jsxs("div", { className: `create-session-info-box create-session-info-box--${type}`, children: [_jsx("div", { className: "create-session-info-box__icon", children: icon }), _jsxs("div", { className: "create-session-info-box__content", children: [_jsx("h4", { className: "create-session-info-box__title", children: title }), _jsx("div", { className: "create-session-info-box__text", children: children })] })] }));
};
const toast = {
    success: (message) => alert(`✅ ${message}`),
    error: (message) => alert(`❌ ${message}`),
    info: (message) => alert(`ℹ️ ${message}`)
};
const CreateSession = () => {
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState("");
    const [className, setClassName] = useState("");
    const [gpsLatitude, setGpsLatitude] = useState("");
    const [gpsLongitude, setGpsLongitude] = useState("");
    const [allowedRadius, setAllowedRadius] = useState(100);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [errors, setErrors] = useState({});
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
            }
            catch (error) {
                console.error("Error fetching courses:", error);
                setCoursesError(error instanceof Error ? error.message : "Failed to load courses. Please try again later.");
            }
            finally {
                setCoursesLoading(false);
            }
        };
        fetchCourses();
    }, [navigate]);
    const validateForm = () => {
        const newErrors = {};
        if (!sessionId.trim()) {
            newErrors.sessionId = "Session ID is required";
        }
        else if (sessionId.length > 50) {
            newErrors.sessionId = "Session ID must be less than 50 characters";
        }
        if (!className.trim()) {
            newErrors.className = "Class name is required";
        }
        if (gpsLatitude === "") {
            newErrors.gpsLatitude = "Latitude is required";
        }
        else if (typeof gpsLatitude === "number" && (gpsLatitude < -90 || gpsLatitude > 90)) {
            newErrors.gpsLatitude = "Latitude must be between -90 and 90";
        }
        if (gpsLongitude === "") {
            newErrors.gpsLongitude = "Longitude is required";
        }
        else if (typeof gpsLongitude === "number" && (gpsLongitude < -180 || gpsLongitude > 180)) {
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
        navigator.geolocation.getCurrentPosition((position) => {
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
        }, (error) => {
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
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
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
                const apiErrors = {};
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
        }
        catch (error) {
            console.error("Error creating session:", error);
            toast.error(error instanceof Error
                ? error.message || "Failed to create session. Please try again."
                : "Failed to create session. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    // Prepare course options for Select component
    const courseOptions = courses.map(course => ({
        value: course.id,
        label: `${course.code} - ${course.title} (${course.credit_hours} credits)`
    }));
    return (_jsxs("div", { className: "create-session-container", children: [_jsx("div", { className: "create-session-container__background" }), _jsx("div", { className: "create-session-container__overlay" }), _jsxs("div", { className: "create-session-content", children: [_jsxs("div", { className: "create-session-header", children: [_jsx("div", { className: "create-session-header__back-button", children: _jsxs(Button, { variant: "secondary", onClick: () => navigate("/lecturerview"), children: [_jsx(ArrowLeft, { className: "create-session-icon" }), "Back to Dashboard"] }) }), _jsx("h1", { className: "create-session-header__title", children: "Create New Session" }), _jsx("p", { className: "create-session-header__subtitle", children: "Set up a new attendance session with location tracking" })] }), _jsx("div", { className: "create-session-card", children: _jsxs("div", { className: "create-session-form", children: [_jsxs("div", { className: "create-session-form__section", children: [_jsxs("div", { className: "create-session-form__row create-session-form__row--two-columns", children: [_jsx(Input, { name: "sessionId", value: sessionId, onChange: (e) => {
                                                        setSessionId(e.target.value);
                                                        setErrors(prev => ({ ...prev, sessionId: undefined }));
                                                    }, placeholder: "Enter unique session ID", label: "Session ID", required: true, icon: _jsx(Hash, { className: "create-session-icon" }), error: errors.sessionId }), _jsx(Input, { name: "className", value: className, onChange: (e) => {
                                                        setClassName(e.target.value);
                                                        setErrors(prev => ({ ...prev, className: undefined }));
                                                    }, placeholder: "Enter class name", label: "Class Name", required: true, icon: _jsx(Users, { className: "create-session-icon" }), error: errors.className })] }), _jsx(Select, { value: selectedCourse, onChange: (e) => {
                                                setSelectedCourse(e.target.value);
                                                setErrors(prev => ({ ...prev, course: undefined }));
                                            }, options: courseOptions, placeholder: "Select a course", required: true, disabled: coursesLoading, icon: _jsx(BookOpen, { className: "create-session-icon" }), label: "Course", error: errors.course ?? coursesError ?? undefined, loading: coursesLoading }), !coursesLoading && courses.length === 0 && !coursesError && (_jsx("p", { className: "create-session-field__error", children: "No courses available. Please create courses first." }))] }), _jsxs("div", { className: "create-session-form__section", children: [_jsxs("div", { className: "create-session-section-header", children: [_jsx("h3", { className: "create-session-section-title", children: "Location Settings" }), _jsx(Button, { variant: "secondary", onClick: handleUseCurrentLocation, disabled: gettingLocation, children: gettingLocation ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "create-session-spinner" }), "Getting Location..."] })) : (_jsxs(_Fragment, { children: [_jsx(Navigation, { className: "create-session-icon" }), "Use Current Location"] })) })] }), _jsxs("div", { className: "create-session-form__row create-session-form__row--two-columns", children: [_jsx(Input, { type: "number", name: "gpsLatitude", value: gpsLatitude, onChange: (e) => {
                                                        const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                                                        setGpsLatitude(value);
                                                        setErrors(prev => ({ ...prev, gpsLatitude: undefined }));
                                                    }, placeholder: "e.g., -15.397596", label: "GPS Latitude", required: true, icon: _jsx(MapPin, { className: "create-session-icon" }), min: -90, max: 90, step: 0.01, error: errors.gpsLatitude }), _jsx(Input, { type: "number", name: "gpsLongitude", value: gpsLongitude, onChange: (e) => {
                                                        const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                                                        setGpsLongitude(value);
                                                        setErrors(prev => ({ ...prev, gpsLongitude: undefined }));
                                                    }, placeholder: "e.g., 28.322817", label: "GPS Longitude", required: true, icon: _jsx(MapPin, { className: "create-session-icon" }), min: -180, max: 180, step: 0.01, error: errors.gpsLongitude })] }), _jsx(Input, { type: "number", name: "allowedRadius", value: allowedRadius, onChange: (e) => {
                                                const value = parseInt(e.target.value) || 100;
                                                setAllowedRadius(value);
                                                setErrors(prev => ({ ...prev, allowedRadius: undefined }));
                                            }, placeholder: "Enter radius in meters", label: "Allowed Radius (meters)", required: true, icon: _jsx(Target, { className: "create-session-icon" }), min: 10, max: 1000, error: errors.allowedRadius })] }), _jsxs("div", { className: "create-session-form__section", children: [_jsx(InfoBox, { type: "success", icon: _jsx(Navigation, { className: "create-session-icon" }), title: "Location Tip", children: "Click \"Use Current Location\" to automatically fill in your GPS coordinates. Manual entries must be between -90 to 90 for latitude and -180 to 180 for longitude." }), _jsx(InfoBox, { type: "info", icon: _jsx("svg", { className: "create-session-icon", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }), title: "Attendance Tracking", children: "Students must be within the specified radius (10-1000 meters) of the GPS coordinates to mark their attendance." })] }), _jsxs("div", { className: "create-session-actions", children: [_jsx(Button, { variant: "secondary", onClick: () => navigate("/session-list"), disabled: loading, className: "create-session-actions__button", children: "Cancel" }), _jsx(Button, { onClick: handleCreateSession, disabled: loading || coursesLoading || !selectedCourse, className: "create-session-actions__button", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "create-session-spinner" }), "Creating Session..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "create-session-icon" }), "Create Session"] })) })] })] }) })] })] }));
};
export default CreateSession;
