import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import "./SessionList.css";

interface Course {
  id: number;
  code: string;
  title: string;
  credit_hours: number;
}

interface Session {
  id: number;
  session_id: string;
  class_name: string;
  gps_latitude: number;
  gps_longitude: number;
  allowed_radius: number;
  timestamp: string;
  course: Course;
  lecturer: {
    id: number;
    name: string;
  };
}

// Custom Button Component
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  type?: "button" | "submit";
}> = ({ children, onClick, disabled = false, variant = "primary", className = "", type = "button" }) => {
  return (
    <button
      type={type}
      className={`session-button session-button--${variant} ${className} ${disabled ? 'session-button--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Custom Card Component
const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`session-card ${className}`}>
      {children}
    </div>
  );
};

// Toast mock
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
};

const SessionList: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchSessions = useCallback(async (url?: string) => {
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
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      const errorMessage = typeof err === "object" && err !== null && "message" in err ? (err as { message?: string }).message : undefined;
      setError(errorMessage || "Failed to load sessions");
      toast.error(errorMessage || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;

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
    } catch (err) {
      console.error("Delete error:", err);
      const errorMessage = typeof err === "object" && err !== null && "message" in err ? (err as { message?: string }).message : undefined;
      toast.error(errorMessage || "Failed to delete session");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return (
      <div className="session-container">
        <div className="session-container__background">
          <div className="session-container__overlay"></div>
        </div>
        <div className="session-loading">
          <div className="session-loading__spinner"></div>
          <p className="session-loading__text">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-container">
        <div className="session-container__background">
          <div className="session-container__overlay"></div>
        </div>
        <Card className="session-error">
          <div className="session-error__content">
            <p className="session-error__title">Error loading sessions</p>
            <p className="session-error__message">{error}</p>
            <Button
              variant="secondary"
              onClick={() => fetchSessions()}
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="session-container">
      <div className="session-container__background">
        <div className="session-container__overlay"></div>
      </div>
      
      <div className="session-content">
        {/* Header */}
        <div className="session-header">
          <Button
            variant="secondary"
            onClick={() => navigate("/lecturerview")}
            className="session-header__back-button"
          >
            <ArrowLeft className="session-icon" />
            Back to Dashboard
          </Button>
          <div className="session-header__title-section">
            <h1 className="session-header__title">Session Management</h1>
            <p className="session-header__subtitle">
              Manage your class sessions and attendance tracking
            </p>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="session-list">
          <div className="session-list__content">
            {sessions.length === 0 ? (
              <Card className="session-empty">
                <div className="session-empty__content">
                  <p className="session-empty__title">No sessions found</p>
                  <p className="session-empty__message">Create your first session to get started.</p>
                </div>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="session-item">
                  <div className="session-item__content">
                    {/* Session Info */}
                    <div className="session-item__info">
                      <div className="session-item__header">
                        <h3 className="session-item__title">{session.class_name}</h3>
                        <span className="session-item__status">
                          Active
                        </span>
                      </div>
                      
                      <div className="session-item__details">

                        
                        <div className="session-detail">
                          <span className="session-detail__label">Session ID:</span>
                          <span className="session-detail__value session-detail__value--code">
                            {session.session_id}
                          </span>
                        </div>
                        

                      </div>
                      
                      <div className="session-item__details">
                        <div className="session-detail">
                          <span className="session-detail__label">Location:</span>
                          <span className="session-detail__value session-detail__value--mono">
                            {session.gps_latitude.toFixed(6)}, {session.gps_longitude.toFixed(6)}
                          </span>
                        </div>
                        
                        <div className="session-detail">
                          <span className="session-detail__label">Radius:</span>
                          <span className="session-detail__value">{session.allowed_radius}m</span>
                        </div>
                        
                        <div className="session-detail">
                          <span className="session-detail__label">Created:</span>
                          <span className="session-detail__value">
                            {new Date(session.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="session-item__actions">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/sessions/edit/${session.id}`)}
                      >
                        <Pencil className="session-icon" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(session.id)}
                      >
                        <Trash2 className="session-icon" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {count > 0 && (
          <div className="session-pagination">
            <Card className="session-pagination__card">
              <div className="session-pagination__content">
                <Button
                  variant="secondary"
                  disabled={!prevUrl}
                  onClick={() => prevUrl && fetchSessions(prevUrl)}
                  className="session-pagination__button"
                >
                  Previous
                </Button>

                <div className="session-pagination__info">
                  <span className="session-pagination__page">
                    Page {currentPage}
                  </span>
                  <span className="session-pagination__divider"></span>
                  <span className="session-pagination__total">
                    Total: {count} sessions
                  </span>
                </div>

                <Button
                  variant="secondary"
                  disabled={!nextUrl}
                  onClick={() => nextUrl && fetchSessions(nextUrl)}
                  className="session-pagination__button"
                >
                  Next
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionList;