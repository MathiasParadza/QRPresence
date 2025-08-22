import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css"; // Import the enhanced CSS file
const Login = ({ setUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post("http://127.0.0.1:8000/api/login/", {
                username,
                password,
            });
            const { access, refresh } = res.data;
            localStorage.setItem("access_token", access);
            localStorage.setItem("refresh_token", refresh);
            const userRes = await axios.get("http://127.0.0.1:8000/api/user/", {
                headers: {
                    Authorization: `Bearer ${access}`,
                },
            });
            setUser(userRes.data);
            toast.success("Login successful!");
            navigate("/dashboard");
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Login failed", error.message);
            }
            else {
                console.error("Login failed", error);
            }
            toast.error("Login failed. Please check your credentials.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "login-container", children: [_jsx(ToastContainer, {}), _jsxs("form", { onSubmit: handleLogin, className: "login-form", children: [_jsxs("div", { className: "login-header", children: [_jsx("h2", { className: "login-title", children: " QRPresence Login" }), _jsx("p", { className: "login-subtitle", children: "Sign in to your account" })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Username" }), _jsx("input", { type: "text", placeholder: "Enter your username", className: "input-field", value: username, onChange: (e) => setUsername(e.target.value), required: true })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Password" }), _jsx("input", { type: "password", placeholder: "Enter your password", className: "input-field", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsx("button", { type: "submit", disabled: loading, className: "login-button", children: loading ? (_jsxs("span", { className: "loading-text", children: [_jsx("span", { className: "loading-spinner" }), "Signing in..."] })) : ("Sign In") }), _jsxs("div", { className: "register-section", children: [_jsx("p", { className: "register-text", children: "Don't have an account?" }), _jsx("a", { href: "/register", className: "register-link", children: "Create Account" })] })] })] }));
};
export default Login;
