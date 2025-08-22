import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css"; // Import the enhanced CSS file
import { User } from "../types/user";

interface LoginProps {
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
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
      interface TokenResponse {
        access: string;
        refresh: string;
      }

      const res = await axios.post<TokenResponse>("http://127.0.0.1:8000/api/login/", {
        username,
        password,
      });

      const { access, refresh } = res.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      const userRes = await axios.get<User>("http://127.0.0.1:8000/api/user/", {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      setUser(userRes.data);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login failed", error.message);
      } else {
        console.error("Login failed", error);
      }
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer />
      <form onSubmit={handleLogin} className="login-form">
        <div className="login-header">
          <h2 className="login-title"> QRPresence Login</h2>
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