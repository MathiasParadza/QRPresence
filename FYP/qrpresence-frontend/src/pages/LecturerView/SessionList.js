import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import "./SessionList.css";
// Custom Button Component
const Button = ({ children, onClick, disabled = false, variant = "primary", className = "", type = "button" }) => {
    return (_jsx("button", { type: type, className: `session-button session-button--${variant} ${className} ${disabled ? 'session-button--disabled' : ''}`, onClick: onClick, disabled: disabled, children: children }));
};
// Custom Card Component
const Card = ({ children, className = "" }) => {
    return (_jsx("div", { className: `session-card ${className}`, children: children }));
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
        return (_jsxs("div", { className: "session-container", children: [_jsx("div", { className: "session-container__background", children: _jsx("div", { className: "session-container__overlay" }) }), _jsxs("div", { className: "session-loading", children: [_jsx("div", { className: "session-loading__spinner" }), _jsx("p", { className: "session-loading__text", children: "Loading sessions..." })] })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "session-container", children: [_jsx("div", { className: "session-container__background", children: _jsx("div", { className: "session-container__overlay" }) }), _jsx(Card, { className: "session-error", children: _jsxs("div", { className: "session-error__content", children: [_jsx("p", { className: "session-error__title", children: "Error loading sessions" }), _jsx("p", { className: "session-error__message", children: error }), _jsx(Button, { variant: "secondary", onClick: () => fetchSessions(), children: "Retry" })] }) })] }));
    }
    return (_jsxs("div", { className: "session-container", children: [_jsx("div", { className: "session-container__background", children: _jsx("div", { className: "session-container__overlay" }) }), _jsxs("div", { className: "session-content", children: [_jsxs("div", { className: "session-header", children: [_jsxs(Button, { variant: "secondary", onClick: () => navigate("/lecturerview"), className: "session-header__back-button", children: [_jsx(ArrowLeft, { className: "session-icon" }), "Back to Dashboard"] }), _jsxs("div", { className: "session-header__title-section", children: [_jsx("h1", { className: "session-header__title", children: "Session Management" }), _jsx("p", { className: "session-header__subtitle", children: "Manage your class sessions and attendance tracking" })] })] }), _jsx("div", { className: "session-list", children: _jsx("div", { className: "session-list__content", children: sessions.length === 0 ? (_jsx(Card, { className: "session-empty", children: _jsxs("div", { className: "session-empty__content", children: [_jsx("p", { className: "session-empty__title", children: "No sessions found" }), _jsx("p", { className: "session-empty__message", children: "Create your first session to get started." })] }) })) : (sessions.map((session) => (_jsx(Card, { className: "session-item", children: _jsxs("div", { className: "session-item__content", children: [_jsxs("div", { className: "session-item__info", children: [_jsxs("div", { className: "session-item__header", children: [_jsx("h3", { className: "session-item__title", children: session.class_name }), _jsx("span", { className: "session-item__status", children: "Active" })] }), _jsx("div", { className: "session-item__details", children: _jsxs("div", { className: "session-detail", children: [_jsx("span", { className: "session-detail__label", children: "Session ID:" }), _jsx("span", { className: "session-detail__value session-detail__value--code", children: session.session_id })] }) }), _jsxs("div", { className: "session-item__details", children: [_jsxs("div", { className: "session-detail", children: [_jsx("span", { className: "session-detail__label", children: "Location:" }), _jsxs("span", { className: "session-detail__value session-detail__value--mono", children: [session.gps_latitude.toFixed(6), ", ", session.gps_longitude.toFixed(6)] })] }), _jsxs("div", { className: "session-detail", children: [_jsx("span", { className: "session-detail__label", children: "Radius:" }), _jsxs("span", { className: "session-detail__value", children: [session.allowed_radius, "m"] })] }), _jsxs("div", { className: "session-detail", children: [_jsx("span", { className: "session-detail__label", children: "Created:" }), _jsx("span", { className: "session-detail__value", children: new Date(session.timestamp).toLocaleString() })] })] })] }), _jsxs("div", { className: "session-item__actions", children: [_jsxs(Button, { variant: "secondary", onClick: () => navigate(`/sessions/edit/${session.id}`), children: [_jsx(Pencil, { className: "session-icon" }), "Edit"] }), _jsxs(Button, { variant: "danger", onClick: () => handleDelete(session.id), children: [_jsx(Trash2, { className: "session-icon" }), "Delete"] })] })] }) }, session.id)))) }) }), count > 0 && (_jsx("div", { className: "session-pagination", children: _jsx(Card, { className: "session-pagination__card", children: _jsxs("div", { className: "session-pagination__content", children: [_jsx(Button, { variant: "secondary", disabled: !prevUrl, onClick: () => prevUrl && fetchSessions(prevUrl), className: "session-pagination__button", children: "Previous" }), _jsxs("div", { className: "session-pagination__info", children: [_jsxs("span", { className: "session-pagination__page", children: ["Page ", currentPage] }), _jsx("span", { className: "session-pagination__divider" }), _jsxs("span", { className: "session-pagination__total", children: ["Total: ", count, " sessions"] })] }), _jsx(Button, { variant: "secondary", disabled: !nextUrl, onClick: () => nextUrl && fetchSessions(nextUrl), className: "session-pagination__button", children: "Next" })] }) }) }))] })] }));
};
export default SessionList;
