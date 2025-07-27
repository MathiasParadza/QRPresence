import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";

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
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-fit";
  
  const variantStyles = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400"
  };
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
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
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
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
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="text-red-500">
            <p className="text-lg font-medium mb-2">Error loading sessions</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="secondary"
              onClick={() => fetchSessions()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 px-6 py-6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="mb-6 flex-shrink-0">
          <Button
            variant="secondary"
            onClick={() => navigate("/lecturerview")}
            className="hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Management</h1>
          <p className="text-gray-600">Manage your class sessions and attendance tracking</p>
        </div>

        {/* Sessions Grid */}
        <div className="flex-1 overflow-y-auto mb-6">
          <div className="space-y-4 pr-2">
            {sessions.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-gray-500">
                  <p className="text-lg font-medium mb-2">No sessions found</p>
                  <p className="text-sm">Create your first session to get started.</p>
                </div>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Session Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900">{session.class_name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Course:</span>
                          <span className="ml-2 text-gray-800">
                            {session.course.code} - {session.course.title}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-600">Session ID:</span>
                          <span className="ml-2 text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">
                            {session.session_id}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-600">Lecturer:</span>
                          <span className="ml-2 text-gray-800">
                            {session.lecturer.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Location:</span>
                          <span className="ml-2 text-gray-800">
                            {session.gps_latitude.toFixed(6)}, {session.gps_longitude.toFixed(6)}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-600">Radius:</span>
                          <span className="ml-2 text-gray-800">{session.allowed_radius}m</span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-600">Created:</span>
                          <span className="ml-2 text-gray-800">
                            {new Date(session.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/sessions/edit/${session.id}`)}
                        className="hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(session.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
          <div className="flex-shrink-0">
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  variant="secondary"
                  disabled={!prevUrl}
                  onClick={() => prevUrl && fetchSessions(prevUrl)}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-medium">
                    Page {currentPage}
                  </span>
                  <span className="w-px h-4 bg-gray-300"></span>
                  <span>
                    Total: {count} sessions
                  </span>
                </div>

                <Button
                  variant="secondary"
                  disabled={!nextUrl}
                  onClick={() => nextUrl && fetchSessions(nextUrl)}
                  className="w-full sm:w-auto"
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