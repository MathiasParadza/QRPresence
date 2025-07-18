import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import AdminView from './pages/AdminView/AdminView'; 
import HomePage from './pages/HomePage';
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentView from "./pages/StudentView/StudentView";
import LecturerView from "./pages/LecturerView/LecturerView";
import Dashboard from "./pages/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary"; 
import QRCodeGenerator from "./components/QRCodeGenerator";
import CreateSession from "./pages/LecturerView/CreateSession";
import SessionList from "./pages/LecturerView/SessionList";
import SessionEdit from "./pages/LecturerView/SessionEdit";
import StudentManager from './pages/LecturerView/StudentManager';
import LoadingSpinner from "./components/LoadingSpinner"; 
import { User } from "./types/user";


const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get<User>("http://127.0.0.1:8000/api/user/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  console.log("Current user:", user);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/generate-qr" element={<QRCodeGenerator />} />

        {/* Session Management Routes (Lecturer only) */}
        <Route
          path="/create-session"
          element={
            user && user.role === "lecturer" ? (
              <CreateSession />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/session-list"
          element={
            user && user.role === "lecturer" ? (
              <SessionList />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/lecturer/sessions/edit/:id"
          element={
            user && user.role === "lecturer" ? (
              <SessionEdit />
            ) : (
              <Navigate to="/login" />
            )
           }
        />
        <Route
         path="/student-manager"
         element={
           user && user.role === "lecturer" ? (
            <StudentManager />
           ) : (
             <Navigate to="/login" />
           )
          }
        />


        {/* Dashboard Route */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />

        {/* Role-based views */}
        <Route
          path="/lecturerview"
          element={
            user && user.role === "lecturer" ? (
              <ErrorBoundary>
                <LecturerView />
              </ErrorBoundary>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/studentview"
          element={
            user && user.role === "student" ? (
              <StudentView />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/adminview"
          element={
            user && user.role === "admin" ? (
              <AdminView />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
