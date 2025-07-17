import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Users, Target, Navigation, Hash } from "lucide-react";
// Custom Button Component
const Button = ({ children, onClick, disabled = false, variant = "primary", className = "", type = "button" }) => {
    const baseStyles = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-fit";
    const variantStyles = {
        primary: "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 shadow-lg hover:shadow-xl",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 shadow-md hover:shadow-lg",
        danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 shadow-lg hover:shadow-xl"
    };
    return (_jsx("button", { type: type, className: `${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`, onClick: onClick, disabled: disabled, children: children }));
};
// Custom Input Component
const Input = ({ type = "text", name, value, onChange, placeholder, required = false, icon, label }) => {
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] }), _jsxs("div", { className: "relative", children: [icon && (_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400", children: icon })), _jsx("input", { type: type, name: name, value: value, onChange: onChange, placeholder: placeholder, required: required, className: `block w-full rounded-lg border-gray-300 border-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200 ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 text-gray-900 placeholder-gray-500` })] })] }));
};
// Custom Card Component
const Card = ({ children, className = "" }) => {
    return (_jsx("div", { className: `bg-white rounded-xl shadow-lg border border-gray-200 ${className}`, children: children }));
};
// Toast mock
const toast = {
    success: (message) => alert(`✅ ${message}`),
    error: (message) => alert(`❌ ${message}`)
};
const CreateSession = () => {
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState("");
    const [className, setClassName] = useState("");
    const [gpsLatitude, setGpsLatitude] = useState("");
    const [gpsLongitude, setGpsLongitude] = useState("");
    const [allowedRadius, setAllowedRadius] = useState(100);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
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
        }, (error) => {
            console.error("Geolocation error:", error);
            toast.error("Failed to get your location. Please check your permissions.");
            setGettingLocation(false);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    };
    const handleCreateSession = async () => {
        if (!sessionId || !className || gpsLatitude === "" || gpsLongitude === "") {
            toast.error("Please fill in all required fields!");
            return;
        }
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            const payload = {
                session_id: sessionId,
                class_name: className,
                gps_latitude: Number(gpsLatitude),
                gps_longitude: Number(gpsLongitude),
                allowed_radius: allowedRadius,
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
                throw new Error(`Failed to create session: ${response.status}`);
            }
            toast.success("Session created successfully!");
            // Reset form
            setSessionId("");
            setClassName("");
            setGpsLatitude("");
            setGpsLongitude("");
            setAllowedRadius(100);
            // Navigate to session list after a short delay
            setTimeout(() => {
                navigate("/session-list");
            }, 1500);
        }
        catch (error) {
            console.error("Error creating session:", error);
            toast.error("Failed to create session. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "h-screen bg-gray-50 flex flex-col", children: _jsx("div", { className: "flex-1 px-6 py-6 overflow-y-auto", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("div", { className: "flex items-center gap-4 mb-4", children: _jsxs(Button, { variant: "secondary", onClick: () => navigate("/lecturerview"), className: "hover:bg-blue-50 hover:text-blue-700", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Dashboard"] }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Create New Session" }), _jsx("p", { className: "text-gray-600", children: "Set up a new attendance session with location tracking" })] }), _jsx(Card, { className: "p-8", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(Input, { name: "sessionId", value: sessionId, onChange: (e) => setSessionId(e.target.value), placeholder: "Enter unique session ID", label: "Session ID", required: true, icon: _jsx(Hash, { className: "w-5 h-5" }) }), _jsx(Input, { name: "className", value: className, onChange: (e) => setClassName(e.target.value), placeholder: "Enter class name", label: "Class Name", required: true, icon: _jsx(Users, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Location Settings" }), _jsx(Button, { variant: "secondary", onClick: handleUseCurrentLocation, disabled: gettingLocation, className: "hover:bg-green-50 hover:text-green-700", children: gettingLocation ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-current" }), "Getting Location..."] })) : (_jsxs(_Fragment, { children: [_jsx(Navigation, { className: "w-4 h-4" }), "Use Current Location"] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(Input, { type: "number", name: "gpsLatitude", value: gpsLatitude, onChange: (e) => setGpsLatitude(e.target.value === "" ? "" : parseFloat(e.target.value)), placeholder: "e.g., -15.397596", label: "GPS Latitude", required: true, icon: _jsx(MapPin, { className: "w-5 h-5" }) }), _jsx(Input, { type: "number", name: "gpsLongitude", value: gpsLongitude, onChange: (e) => setGpsLongitude(e.target.value === "" ? "" : parseFloat(e.target.value)), placeholder: "e.g., 28.322817", label: "GPS Longitude", required: true, icon: _jsx(MapPin, { className: "w-5 h-5" }) })] })] }), _jsx(Input, { type: "number", name: "allowedRadius", value: allowedRadius, onChange: (e) => setAllowedRadius(parseInt(e.target.value) || 100), placeholder: "Enter radius in meters", label: "Allowed Radius (meters)", required: true, icon: _jsx(Target, { className: "w-5 h-5" }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "text-green-600 mt-0.5", children: _jsx(Navigation, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-green-900 mb-1", children: "Location Tip" }), _jsx("p", { className: "text-sm text-green-700", children: "Click \"Use Current Location\" to automatically fill in your GPS coordinates." })] })] }) }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "text-blue-600 mt-0.5", children: _jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-blue-900 mb-1", children: "Attendance Tracking" }), _jsx("p", { className: "text-sm text-blue-700", children: "Students must be within the specified radius of the GPS coordinates to mark their attendance." })] })] }) })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 pt-6", children: [_jsx(Button, { onClick: handleCreateSession, disabled: loading, className: "flex-1 sm:flex-none", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), "Creating Session..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "w-4 h-4" }), "Create Session"] })) }), _jsx(Button, { variant: "secondary", onClick: () => navigate("/session-list"), disabled: loading, className: "flex-1 sm:flex-none", children: "Cancel" })] })] }) })] }) }) }));
};
export default CreateSession;
