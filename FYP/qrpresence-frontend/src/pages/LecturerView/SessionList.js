import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/lecturer/SessionList.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
const SessionList = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    useEffect(() => {
        fetchSessions();
    }, []);
    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get("http://127.0.0.1:8000/api/sessions/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSessions(response.data);
        }
        catch {
            toast.error("Failed to fetch sessions.");
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this session?"))
            return;
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`http://127.0.0.1:8000/api/sessions/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Session deleted!");
            setSessions((prev) => prev.filter((s) => s.id !== id));
        }
        catch {
            toast.error("Failed to delete session.");
        }
    };
    return (_jsxs("div", { className: "min-h-screen p-4 bg-gray-100 flex flex-col items-center", children: [_jsx(ToastContainer, {}), _jsxs(Card, { className: "p-6 w-full max-w-3xl", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "All Sessions" }), _jsx("input", { type: "text", placeholder: "Search by class name or session ID", className: "w-full mb-4 p-2 border rounded", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value.toLowerCase()) }), sessions
                        .filter((s) => s.class_name.toLowerCase().includes(searchTerm) ||
                        s.session_id.toLowerCase().includes(searchTerm))
                        .map((session) => (_jsxs(Card, { className: "p-4 mb-4 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: session.class_name }), _jsxs("p", { className: "text-sm", children: ["ID: ", session.session_id] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: () => navigate(`/edit-session/${session.id}`), children: [_jsx(Pencil, { size: 16 }), " Edit"] }), _jsxs(Button, { className: "bg-red-500 text-white hover:bg-red-600", onClick: () => handleDelete(session.id), children: [_jsx(Trash2, { size: 16 }), " Delete"] })] })] }, session.id)))] })] }));
};
export default SessionList;
