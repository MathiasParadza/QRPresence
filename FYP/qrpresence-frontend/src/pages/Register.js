import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "student",
        student_id: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const validateForm = () => {
        const { username, email, password, role, student_id } = formData;
        if (!username || !email || !password || (role === "student" && !student_id)) {
            return "Please fill in all required fields.";
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return "Please enter a valid email address.";
        }
        if (password.length < 6) {
            return "Password must be at least 6 characters long.";
        }
        return null;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            toast.error(validationError);
            return;
        }
        const dataToSend = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            ...(formData.role === "student" && { student_id: formData.student_id }),
        };
        try {
            setLoading(true);
            await axios.post("http://127.0.0.1:8000/api/register/", dataToSend);
            toast.success("Registration successful! Please login.");
            navigate("/login");
        }
        catch (err) {
            let errorMessage = "Registration failed. Please try again.";
            if (err && typeof err === "object" && "response" in err) {
                const response = err.response;
                const data = response?.data;
                if (typeof data === "object") {
                    const firstError = Object.values(data)?.[0]?.[0];
                    errorMessage = firstError || errorMessage;
                }
            }
            setError(errorMessage);
            toast.error(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center bg-gray-100 p-4", children: [_jsx(ToastContainer, {}), _jsxs("form", { onSubmit: handleSubmit, className: "bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "Create an Account" }), error && _jsx("p", { className: "text-red-500 mb-4", children: error }), _jsx("input", { type: "text", name: "username", placeholder: "Username", value: formData.username, onChange: handleChange, className: "mb-4 w-full p-2 border rounded", required: true }), _jsx("input", { type: "email", name: "email", placeholder: "Email", value: formData.email, onChange: handleChange, className: "mb-4 w-full p-2 border rounded", required: true }), _jsx("input", { type: "password", name: "password", placeholder: "Password", value: formData.password, onChange: handleChange, className: "mb-4 w-full p-2 border rounded", required: true }), _jsx("label", { htmlFor: "role", className: "block mb-2 font-medium text-gray-700", children: "Role" }), _jsxs("select", { id: "role", name: "role", value: formData.role, onChange: handleChange, className: "mb-6 w-full p-2 border rounded", children: [_jsx("option", { value: "student", children: "Student" }), _jsx("option", { value: "lecturer", children: "Lecturer" })] }), formData.role === "student" && (_jsx("input", { type: "text", name: "student_id", placeholder: "Student ID", value: formData.student_id, onChange: handleChange, className: "mb-4 w-full p-2 border rounded", required: true })), _jsx("button", { type: "submit", disabled: loading, className: "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full flex justify-center items-center", children: loading ? (_jsxs("svg", { className: "animate-spin h-5 w-5 text-white", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" })] })) : ("Register") }), _jsxs("p", { className: "mt-4 text-center text-sm", children: ["Already have an account?", " ", _jsx("a", { href: "/login", className: "text-blue-600 hover:underline", children: "Login" })] })] })] }));
};
export default Register;
