import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
// Custom Button Component
const Button = ({ children, onClick, disabled = false, variant = "primary", className = "", type = "button" }) => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-fit";
    const variantStyles = {
        primary: "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",
        danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400"
    };
    return (_jsx("button", { type: type, className: `${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`, onClick: onClick, disabled: disabled, children: children }));
};
// Custom Card Component
const Card = ({ children, className = "" }) => {
    return (_jsx("div", { className: `bg-white rounded-lg shadow-md border border-gray-200 ${className}`, children: children }));
};
// Toast mock
const toast = {
    success: (message) => alert(`✅ ${message}`),
    error: (message) => alert(`❌ ${message}`)
};
const SessionList = () => {
    const [sessions, setSessions] = useState([]);
    const [nextUrl, setNextUrl] = useState(null);
    const [prevUrl, setPrevUrl] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const fetchSessions = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("access_token");
            const fetchUrl = url ?? `http://127.0.0.1:8000/api/sessions/?page=${currentPage}`;
            const res = await fetch(fetchUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || `Failed to fetch sessions: ${res.status}`);
            }
            const data = await res.json();
            // Handle both paginated and non-paginated responses
            const results = data.results || data;
            setSessions(results);
            setNextUrl(data.next);
            setPrevUrl(data.previous);
            setCount(data.count || results.length);
            // Update current page if URL contains page parameter
            if (url) {
                const urlObj = new URL(url);
                const pageParam = urlObj.searchParams.get("page");
                if (pageParam) {
                    setCurrentPage(Number(pageParam));
                }
            }
        }
        catch (err) {
            console.error("Failed to fetch sessions:", err);
            const errorMessage = typeof err === "object" && err !== null && "message" in err ? err.message : undefined;
            setError(errorMessage || "Failed to load sessions");
            toast.error(errorMessage || "Failed to load sessions");
        }
        finally {
            setLoading(false);
        }
    }, [currentPage]);
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this session?"))
            return;
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`http://127.0.0.1:8000/api/sessions/${id}/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Failed to delete session");
            }
            toast.success("Session deleted successfully");
            fetchSessions(); // Refresh the list
        }
        catch (err) {
            console.error("Delete error:", err);
            const errorMessage = typeof err === "object" && err !== null && "message" in err ? err.message : undefined;
            toast.error(errorMessage || "Failed to delete session");
        }
    };
    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);
    if (loading) {
        return (_jsx("div", { className: "h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading sessions..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "h-screen bg-gray-50 flex items-center justify-center", children: _jsx(Card, { className: "p-8 text-center", children: _jsxs("div", { className: "text-red-500", children: [_jsx("p", { className: "text-lg font-medium mb-2", children: "Error loading sessions" }), _jsx("p", { className: "text-sm", children: error }), _jsx(Button, { variant: "secondary", onClick: () => fetchSessions(), className: "mt-4", children: "Retry" })] }) }) }));
    }
    return (_jsx("div", { className: "h-screen bg-gray-50 flex flex-col", children: _jsxs("div", { className: "flex-1 px-6 py-6 overflow-hidden flex flex-col", children: [_jsxs("div", { className: "mb-6 flex-shrink-0", children: [_jsxs(Button, { variant: "secondary", onClick: () => navigate("/lecturerview"), className: "hover:bg-blue-50 hover:text-blue-700", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Dashboard"] }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Session Management" }), _jsx("p", { className: "text-gray-600", children: "Manage your class sessions and attendance tracking" })] }), _jsx("div", { className: "flex-1 overflow-y-auto mb-6", children: _jsx("div", { className: "space-y-4 pr-2", children: sessions.length === 0 ? (_jsx(Card, { className: "p-8 text-center", children: _jsxs("div", { className: "text-gray-500", children: [_jsx("p", { className: "text-lg font-medium mb-2", children: "No sessions found" }), _jsx("p", { className: "text-sm", children: "Create your first session to get started." })] }) })) : (sessions.map((session) => (_jsx(Card, { className: "p-6 hover:shadow-lg transition-shadow duration-200", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", children: [_jsxs("div", { className: "flex-1 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900", children: session.class_name }), _jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: "Active" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-600", children: "Course:" }), _jsxs("span", { className: "ml-2 text-gray-800", children: [session.course.code, " - ", session.course.title] })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-600", children: "Session ID:" }), _jsx("span", { className: "ml-2 text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded", children: session.session_id })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-600", children: "Lecturer:" }), _jsx("span", { className: "ml-2 text-gray-800", children: session.lecturer.name })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-600", children: "Location:" }), _jsxs("span", { className: "ml-2 text-gray-800", children: [session.gps_latitude.toFixed(6), ", ", session.gps_longitude.toFixed(6)] })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-600", children: "Radius:" }), _jsxs("span", { className: "ml-2 text-gray-800", children: [session.allowed_radius, "m"] })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-600", children: "Created:" }), _jsx("span", { className: "ml-2 text-gray-800", children: new Date(session.timestamp).toLocaleString() })] })] })] }), _jsxs("div", { className: "flex items-center gap-3 flex-shrink-0", children: [_jsxs(Button, { variant: "secondary", onClick: () => navigate(`/sessions/edit/${session.id}`), className: "hover:bg-blue-50 hover:text-blue-700", children: [_jsx(Pencil, { className: "w-4 h-4" }), "Edit"] }), _jsxs(Button, { variant: "danger", onClick: () => handleDelete(session.id), children: [_jsx(Trash2, { className: "w-4 h-4" }), "Delete"] })] })] }) }, session.id)))) }) }), count > 0 && (_jsx("div", { className: "flex-shrink-0", children: _jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4", children: [_jsx(Button, { variant: "secondary", disabled: !prevUrl, onClick: () => prevUrl && fetchSessions(prevUrl), className: "w-full sm:w-auto", children: "Previous" }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600", children: [_jsxs("span", { className: "font-medium", children: ["Page ", currentPage] }), _jsx("span", { className: "w-px h-4 bg-gray-300" }), _jsxs("span", { children: ["Total: ", count, " sessions"] })] }), _jsx(Button, { variant: "secondary", disabled: !nextUrl, onClick: () => nextUrl && fetchSessions(nextUrl), className: "w-full sm:w-auto", children: "Next" })] }) }) }))] }) }));
};
export default SessionList;
