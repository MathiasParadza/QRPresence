import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";
import { User } from "../types/user";

interface LoginProps {
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login request
      const loginResponse = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        throw new Error(
          loginResponse.status === 401
            ? "Invalid username or password"
            : errorData.detail || `Login failed with status: ${loginResponse.status}`
        );
      }

      const tokenData: TokenResponse = await loginResponse.json();
      const { access, refresh } = tokenData;
      
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // Get user data
      const userResponse = await fetch("http://127.0.0.1:8000/api/user/", {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userResponse.status}`);
      }

      const userData: User = await userResponse.json();
      setUser(userData);
      toast.success("Login successful!");
      
      // Redirect based on user role
      if (userData.role === "lecturer") {
        navigate("/lecturerview");
      } else if (userData.role === "student") {
        navigate("/studentview");
      } else {
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login failed", error.message);
        if (error.message.includes("Invalid username or password")) {
          toast.error("Invalid username or password.");
        } else if (error.message.includes("Failed to fetch")) {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error(error.message || "Login failed. Please try again.");
        }
      } else {
        console.error("Login failed", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer />
      <form onSubmit={handleLogin} className="login-form">
        <div className="login-header">
          <h2 className="login-title">QRPresence Login</h2>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <div className="input-group">
          <label className="input-label">Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="login-button"
        >
          {loading ? (
            <span className="loading-text">
              <span className="loading-spinner"></span>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>

        <div className="register-section">
          <p className="register-text">Don't have an account?</p>
          <a href="/register" className="register-link">
            Create Account
          </a>
        </div>
      </form>
    </div>
  );
};

export default Login;