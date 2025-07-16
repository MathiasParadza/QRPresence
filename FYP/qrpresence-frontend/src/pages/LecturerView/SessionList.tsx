// src/pages/lecturer/SessionList.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import { Pencil, Trash2 } from "lucide-react";

interface Session {
  id: number;
  session_id: string;
  class_name: string;
  gps_latitude: number;
  gps_longitude: number;
  allowed_radius: number;
  timestamp: string;
}

const SessionList = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get<Session[]>("http://127.0.0.1:8000/api/sessions/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(response.data);
    } catch {
      toast.error("Failed to fetch sessions.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this session?")) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`http://127.0.0.1:8000/api/sessions/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Session deleted!");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete session.");
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100 flex flex-col items-center">
      <ToastContainer />
      <Card className="p-6 w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">All Sessions</h2>

        <input
          type="text"
          placeholder="Search by class name or session ID"
          className="w-full mb-4 p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        />

        {sessions
          .filter((s) =>
            s.class_name.toLowerCase().includes(searchTerm) ||
            s.session_id.toLowerCase().includes(searchTerm)
          )
          .map((session) => (
            <Card key={session.id} className="p-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{session.class_name}</h3>
                <p className="text-sm">ID: {session.session_id}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate(`/edit-session/${session.id}`)}>
                  <Pencil size={16} /> Edit
                </Button>
                <Button
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={() => handleDelete(session.id)}
                >
                  <Trash2 size={16} /> Delete
                </Button>
              </div>
            </Card>
          ))}
      </Card>
    </div>
  );
};

export default SessionList;
