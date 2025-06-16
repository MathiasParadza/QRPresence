import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
const CreateSession = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [sessionId, setSessionId] = useState("");
    const [className, setClassName] = useState("");
    const [gpsLatitude, setGpsLatitude] = useState("");
    const [gpsLongitude, setGpsLongitude] = useState("");
    const [allowedRadius, setAllowedRadius] = useState(100);
    const [loading, setLoading] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const checkAuthorization = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
            return false;
        }
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.role !== "lecturer") {
                toast.error("You are not authorized to access this page.");
                navigate("/403");
                return false;
            }
            return true;
        }
        catch (error) {
            toast.error("Session expired. Please login again.");
            localStorage.removeItem("access_token");
            navigate("/login");
            return false;
        }
    };
    useEffect(() => {
        const init = async () => {
            const authorized = await checkAuthorization();
            if (authorized)
                fetchSessions();
        };
        init();
    }, [navigate]);
    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get("http://127.0.0.1:8000/api/sessions/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSessions(response.data);
        }
        catch (error) {
            console.error("Failed to fetch sessions:", error);
            if (error.response && [401, 403].includes(error.response.status)) {
                toast.error("Session expired. Please login again.");
                localStorage.removeItem("access_token");
                navigate("/login");
            }
        }
    };
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported by your browser.");
            return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
            setGpsLatitude(position.coords.latitude);
            setGpsLongitude(position.coords.longitude);
            toast.success("Location updated!");
        }, (error) => {
            console.error("Error getting location:", error);
            toast.error("Failed to fetch location.");
        });
    };
    const handleCreateOrUpdateSession = async () => {
        if (!sessionId || !className || gpsLatitude === "" || gpsLongitude === "" || !allowedRadius) {
            toast.error("Please fill in all fields!");
            return;
        }
        const authorized = await checkAuthorization();
        if (!authorized)
            return;
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
            if (editingSessionId) {
                await axios.put(`http://127.0.0.1:8000/api/sessions/${editingSessionId}/`, payload, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Session updated successfully!");
            }
            else {
                await axios.post("http://127.0.0.1:8000/api/sessions/", payload, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Session created successfully!");
            }
            setSessionId("");
            setClassName("");
            setGpsLatitude("");
            setGpsLongitude("");
            setAllowedRadius(100);
            setEditingSessionId(null);
            fetchSessions();
        }
        catch (error) {
            console.error("Failed to create/update session:", error);
            if (error.response && error.response.status === 400) {
                toast.error("Bad Request: " + JSON.stringify(error.response.data));
            }
            else if (error.response && [401, 403].includes(error.response.status)) {
                toast.error("Session expired. Please login again.");
                localStorage.removeItem("access_token");
                navigate("/login");
            }
            else {
                toast.error("Something went wrong.");
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteSession = async (id) => {
        if (!window.confirm("Are you sure you want to delete this session?"))
            return;
        const authorized = await checkAuthorization();
        if (!authorized)
            return;
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`http://127.0.0.1:8000/api/sessions/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Session deleted successfully!");
            setSessions((prev) => prev.filter((session) => session.id !== id));
        }
        catch (error) {
            console.error("Failed to delete session:", error);
            if (error.response && [401, 403].includes(error.response.status)) {
                toast.error("Session expired. Please login again.");
                localStorage.removeItem("access_token");
                navigate("/login");
            }
            else {
                toast.error("Failed to delete session.");
            }
        }
    };
    const handleEditSession = (session) => {
        setSessionId(session.session_id);
        setClassName(session.class_name);
        setGpsLatitude(session.gps_latitude);
        setGpsLongitude(session.gps_longitude);
        setAllowedRadius(session.allowed_radius);
        setEditingSessionId(session.id);
    };
    return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4", children: [_jsx(ToastContainer, {}), _jsxs(Card, { className: "p-6 w-full max-w-2xl shadow-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: editingSessionId ? "Edit Session" : "Create New Session" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "sessionId", className: "block text-sm font-medium mb-1", children: "Session ID" }), _jsx("input", { id: "sessionId", type: "text", className: "w-full border rounded p-2", value: sessionId, onChange: (e) => setSessionId(e.target.value), placeholder: "Enter session ID" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "className", className: "block text-sm font-medium mb-1", children: "Class Name" }), _jsx("input", { id: "className", type: "text", className: "w-full border rounded p-2", value: className, onChange: (e) => setClassName(e.target.value), placeholder: "Enter class name" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "gpsLatitude", className: "block text-sm font-medium mb-1", children: "GPS Latitude" }), _jsx("input", { id: "gpsLatitude", type: "number", className: "w-full border rounded p-2", value: gpsLatitude, onChange: (e) => setGpsLatitude(e.target.value === "" ? "" : parseFloat(e.target.value)), placeholder: "Latitude" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "gpsLongitude", className: "block text-sm font-medium mb-1", children: "GPS Longitude" }), _jsx("input", { id: "gpsLongitude", type: "number", className: "w-full border rounded p-2", value: gpsLongitude, onChange: (e) => setGpsLongitude(e.target.value === "" ? "" : parseFloat(e.target.value)), placeholder: "Longitude" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "allowedRadius", className: "block text-sm font-medium mb-1", children: "Allowed Radius (meters)" }), _jsx("input", { id: "allowedRadius", type: "number", className: "w-full border rounded p-2", value: allowedRadius, onChange: (e) => setAllowedRadius(parseInt(e.target.value)), placeholder: "Allowed Radius" })] })] }), _jsx("div", { className: "mb-4", children: _jsx(Button, { onClick: handleUseCurrentLocation, children: "Use Current Location" }) }), _jsx(Button, { onClick: handleCreateOrUpdateSession, disabled: loading, children: editingSessionId ? "Update Session" : "Create Session" }), _jsx("h2", { className: "text-2xl font-bold mt-8 mb-4", children: "Sessions" }), _jsx("div", { className: "w-full max-w-2xl mb-4", children: _jsx("input", { type: "text", className: "w-full border rounded p-2", placeholder: "Search by class name or session ID", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value.toLowerCase()) }) }), _jsx("div", { className: "w-full max-w-2xl", children: sessions
                            .filter((session) => session.class_name.toLowerCase().includes(searchTerm) ||
                            session.session_id.toLowerCase().includes(searchTerm))
                            .map((session) => (_jsxs(Card, { className: "mb-4 p-4 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: session.class_name }), _jsxs("p", { className: "text-sm", children: ["Session ID: ", session.session_id] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: () => handleEditSession(session), children: [_jsx(Pencil, { size: 16 }), " Edit"] }), _jsxs(Button, { onClick: () => handleDeleteSession(session.id), className: "bg-red-500 text-white hover:bg-red-600", children: [_jsx(Trash2, { size: 16 }), " Delete"] })] })] }, session.id))) })] })] }));
};
export default CreateSession;
