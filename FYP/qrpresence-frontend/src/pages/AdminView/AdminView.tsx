import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AttendanceTrends from "@/components/ui/AttendanceTrends";
import Heatmap from "@/components/ui/Heatmap";
import Card from "@/components/ui/card";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();

  interface Stat {
    label: string;
    value: number;
  }

  interface HeatmapDataItem {
    session: string;
    missed: number;
  }

  const [stats, setStats] = useState<Stat[]>([]);
  const [missedSessions, setMissedSessions] = useState<HeatmapDataItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMissedSessions, setLoadingMissedSessions] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("/api/admin/stats/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        // Check if response.data is an object; if so, convert it to array
        if (Array.isArray(response.data)) {
          setStats(response.data);
        } else if (typeof response.data === "object" && response.data !== null) {
          const convertedStats = Object.keys(response.data).map((key) => ({
            label: key,
            value: response.data[key],
          }));
          setStats(convertedStats);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchMissedSessions = async () => {
      try {
        const response = await axios.get("/api/admin/missed-sessions/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setMissedSessions(response.data as HeatmapDataItem[]);
      } catch (error) {
        console.error("Failed to fetch missed sessions:", error);
      } finally {
        setLoadingMissedSessions(false);
      }
    };

    fetchStats();
    fetchMissedSessions();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("access_token"); // <-- Clear token on logout
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">QRPresence Admin Dashboard</h1>
        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
          Logout
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {loadingStats ? (
          <p>Loading stats...</p>
        ) : stats.length > 0 ? (
          stats.map((stat, index) => (
            <Card key={index} className="shadow-md">
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <h2 className="text-2xl font-bold mt-2">{stat.value}</h2>
            </Card>
          ))
        ) : (
          <p>No stats available.</p>
        )}
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-md">
          <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
          <Button className="w-full mb-2" onClick={() => navigate("/students/new")}>
            Add New Student
          </Button>
          <Button className="w-full mb-2" onClick={() => navigate("/lecturers/new")}>
            Add New Lecturer
          </Button>
          <Button className="w-full mb-2" onClick={() => navigate("/users")}>
            View All Users
          </Button>
          <Button className="w-full" onClick={() => navigate("/users/search")}>
            Search User
          </Button>
        </Card>

        <Card className="shadow-md">
          <h2 className="text-xl font-semibold mb-4">Manage Sessions</h2>
          <Button className="w-full mb-2" onClick={() => navigate("/sessions/all")}>
            View All Sessions
          </Button>
          <Button className="w-full" onClick={() => navigate("/sessions/old")}>
            Delete Old Sessions
          </Button>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md col-span-2">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>

          <h3 className="text-lg font-semibold mb-2">Attendance Trends</h3>
          <AttendanceTrends />

          <h3 className="text-lg font-semibold mt-8 mb-2">Most Missed Sessions</h3>
          {loadingMissedSessions ? (
            <p>Loading heatmap...</p>
          ) : missedSessions.length > 0 ? (
            <Heatmap data={missedSessions} />
          ) : (
            <p>No missed sessions data available.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
