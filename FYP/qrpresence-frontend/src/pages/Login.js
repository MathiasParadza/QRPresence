import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";
const Login = ({ setUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleLogin = async (e) => {
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
                throw new Error(loginResponse.status === 401
                    ? "Invalid username or password"
                    : errorData.detail || `Login failed with status: ${loginResponse.status}`);
            }
            const tokenData = await loginResponse.json();
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
            const userData = await userResponse.json();
            setUser(userData);
            toast.success("Login successful!");
            // Redirect based on user role
            if (userData.role === "lecturer") {
                navigate("/lecturerview");
            }
            else if (userData.role === "student") {
                navigate("/studentview");
            }
            else {
                navigate("/dashboard");
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Login failed", error.message);
                if (error.message.includes("Invalid username or password")) {
                    toast.error("Invalid username or password.");
                }
                else if (error.message.includes("Failed to fetch")) {
                    toast.error("Network error. Please check your connection.");
                }
                else {
                    toast.error(error.message || "Login failed. Please try again.");
                }
            }
            else {
                console.error("Login failed", error);
                toast.error("An unexpected error occurred. Please try again.");
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "login-container", children: [_jsx(ToastContainer, {}), _jsxs("form", { onSubmit: handleLogin, className: "login-form", children: [_jsxs("div", { className: "login-header", children: [_jsx("h2", { className: "login-title", children: "QRPresence Login" }), _jsx("p", { className: "login-subtitle", children: "Sign in to your account" })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Username" }), _jsx("input", { type: "text", placeholder: "Enter your username", className: "input-field", value: username, onChange: (e) => setUsername(e.target.value), required: true, disabled: loading })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Password" }), _jsx("input", { type: "password", placeholder: "Enter your password", className: "input-field", value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: loading })] }), _jsx("button", { type: "submit", disabled: loading, className: "login-button", children: loading ? (_jsxs("span", { className: "loading-text", children: [_jsx("span", { className: "loading-spinner" }), "Signing in..."] })) : ("Sign In") }), _jsxs("div", { className: "register-section", children: [_jsx("p", { className: "register-text", children: "Don't have an account?" }), _jsx("a", { href: "/register", className: "register-link", children: "Create Account" })] })] })] }));
};
export default Login;
