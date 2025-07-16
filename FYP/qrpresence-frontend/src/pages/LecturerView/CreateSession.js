import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/lecturer/CreateSession.tsx
import { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import "react-toastify/dist/ReactToastify.css";
const CreateSession = () => {
    const [sessionId, setSessionId] = useState("");
    const [className, setClassName] = useState("");
    const [gpsLatitude, setGpsLatitude] = useState("");
    const [gpsLongitude, setGpsLongitude] = useState("");
    const [allowedRadius, setAllowedRadius] = useState(100);
    const [loading, setLoading] = useState(false);
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported.");
            return;
        }
        navigator.geolocation.getCurrentPosition((pos) => {
            setGpsLatitude(pos.coords.latitude);
            setGpsLongitude(pos.coords.longitude);
            toast.success("Location updated!");
        }, () => toast.error("Failed to fetch location."));
    };
    const handleCreateSession = async () => {
        if (!sessionId || !className || gpsLatitude === "" || gpsLongitude === "") {
            toast.error("Please fill in all fields!");
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
            await axios.post("http://127.0.0.1:8000/api/sessions/", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Session created!");
            setSessionId("");
            setClassName("");
            setGpsLatitude("");
            setGpsLongitude("");
            setAllowedRadius(100);
        }
        catch (err) {
            toast.error("Error creating session.");
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center bg-gray-100 p-4", children: [_jsx(ToastContainer, {}), _jsxs(Card, { className: "p-6 w-full max-w-xl shadow", children: [_jsx("h2", { className: "text-2xl font-bold mb-4 text-center", children: "Create New Session" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsx("input", { type: "text", placeholder: "Session ID", className: "p-2 border rounded", value: sessionId, onChange: (e) => setSessionId(e.target.value) }), _jsx("input", { type: "text", placeholder: "Class Name", className: "p-2 border rounded", value: className, onChange: (e) => setClassName(e.target.value) }), _jsx("input", { type: "number", placeholder: "Latitude", className: "p-2 border rounded", value: gpsLatitude, onChange: (e) => setGpsLatitude(e.target.value === "" ? "" : parseFloat(e.target.value)) }), _jsx("input", { type: "number", placeholder: "Longitude", className: "p-2 border rounded", value: gpsLongitude, onChange: (e) => setGpsLongitude(e.target.value === "" ? "" : parseFloat(e.target.value)) }), _jsx("input", { type: "number", placeholder: "Allowed Radius", className: "p-2 border rounded", value: allowedRadius, onChange: (e) => setAllowedRadius(parseInt(e.target.value)) })] }), _jsx(Button, { onClick: handleUseCurrentLocation, className: "mb-4", children: "Use Current Location" }), _jsx(Button, { onClick: handleCreateSession, disabled: loading, children: "Create Session" })] })] }));
};
export default CreateSession;
