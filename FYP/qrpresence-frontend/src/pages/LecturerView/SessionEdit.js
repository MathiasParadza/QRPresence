import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, MapPin, Users, Target } from "lucide-react";
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
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { htmlFor: name, className: "block text-sm font-medium text-gray-700", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] }), _jsxs("div", { className: "relative", children: [icon && (_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400", children: icon })), _jsx("input", { type: type, id: name, name: name, value: value, onChange: onChange, placeholder: placeholder, required: required, className: `block w-full rounded-lg border-gray-300 border-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200 ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 text-gray-900 placeholder-gray-500` })] })] }));
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
const SessionEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        class_name: "",
        gps_latitude: "",
        gps_longitude: "",
        allowed_radius: "",
    });
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const res = await fetch(`http://127.0.0.1:8000/api/sessions/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    throw new Error(`Failed to fetch session: ${res.status}`);
                }
                const data = await res.json();
                setFormData({
                    class_name: data.class_name ?? "",
                    gps_latitude: data.gps_latitude ?? "",
                    gps_longitude: data.gps_longitude ?? "",
                    allowed_radius: data.allowed_radius ?? "",
                });
            }
            catch (error) {
                console.error("Failed to load session:", error);
                toast.error("Failed to load session data");
            }
            finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchSession();
        }
    }, [id]);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`http://127.0.0.1:8000/api/sessions/${id}/`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (!res.ok) {
                throw new Error(`Update failed: ${res.status}`);
            }
            toast.success("Session updated successfully!");
            navigate("/session-list");
        }
        catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update session");
        }
        finally {
            setSubmitting(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading session data..." })] }) }));
    }
    return (_jsx("div", { className: "h-screen bg-gray-50 flex flex-col", children: _jsx("div", { className: "flex-1 px-6 py-6 overflow-y-auto", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("div", { className: "flex items-center gap-4 mb-4", children: _jsxs(Button, { variant: "secondary", onClick: () => navigate("/session-list"), className: "hover:bg-blue-50 hover:text-blue-700", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Sessions"] }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Edit Session" }), _jsx("p", { className: "text-gray-600", children: "Update session details and location settings" })] }), _jsx(Card, { className: "p-8", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsx(Input, { name: "class_name", value: formData.class_name, onChange: handleChange, placeholder: "Enter class name", label: "Class Name", required: true, icon: _jsx(Users, { className: "w-5 h-5" }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(Input, { type: "number", name: "gps_latitude", value: formData.gps_latitude, onChange: handleChange, placeholder: "e.g., -15.397596", label: "GPS Latitude", required: true, icon: _jsx(MapPin, { className: "w-5 h-5" }) }), _jsx(Input, { type: "number", name: "gps_longitude", value: formData.gps_longitude, onChange: handleChange, placeholder: "e.g., 28.322817", label: "GPS Longitude", required: true, icon: _jsx(MapPin, { className: "w-5 h-5" }) })] }), _jsx(Input, { type: "number", name: "allowed_radius", value: formData.allowed_radius, onChange: handleChange, placeholder: "Enter radius in meters", label: "Allowed Radius (meters)", required: true, icon: _jsx(Target, { className: "w-5 h-5" }) }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "text-blue-600 mt-0.5", children: _jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-blue-900 mb-1", children: "Location Settings" }), _jsx("p", { className: "text-sm text-blue-700", children: "Students will need to be within the specified radius of these GPS coordinates to mark their attendance." })] })] }) }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 pt-6", children: [_jsx(Button, { type: "submit", disabled: submitting, className: "flex-1 sm:flex-none", children: submitting ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), "Updating..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), "Update Session"] })) }), _jsx(Button, { variant: "secondary", onClick: () => navigate("/session-list"), disabled: submitting, className: "flex-1 sm:flex-none", children: "Cancel" })] })] }) })] }) }) }));
};
export default SessionEdit;
