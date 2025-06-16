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
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSend = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role,
        };
        if (formData.role === "student") {
            dataToSend.student_id = formData.student_id;
        }
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/register/", dataToSend);
            console.log("Registered:", response.data);
            toast.success("Registration successful! Please login.");
            navigate("/login");
        }
        catch (err) {
            const data = err.response?.data;
            if (typeof data === "object") {
                const firstError = Object.values(data)?.[0]?.[0];
                setError(firstError || "Registration failed");
            }
            else {
                setError("Registration failed");
            }
            toast.error(error || "Registration failed. Please try again.");
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center bg-gray-100 p-4", children: [_jsx(ToastContainer, {}), _jsxs("form", { onSubmit: handleSubmit, className: "bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "Create an Account" }), error && _jsx("p", { className: "text-red-500 mb-4", children: error }), _jsx("input", { type: "text", name: "username", placeholder: "Username", value: formData.username, onChange: handleChange, className: "mb-4 w-full p-2 border rounded", required: true }), _jsx("input", { type: "email", name: "email", placeholder: "Email", value: formData.email, onChange: handleChange, className: "mb-4 w-full p-2 border rounded", required: true }), _jsx("input", { type: "password", name: "password", placeholder: "Password", value: formData.password, onChange: handleChange, className: "mb-4 w-full p-2 border rounded", required: true }), _jsxs("select", { name: "role", value: formData.role, onChange: handleChange, className: "mb-6 w-full p-2 border rounded", children: [_jsx("option", { value: "student", children: "Student" }), _jsx("option", { value: "lecturer", children: "Lecturer" }), _jsx("option", { value: "admin", children: "Admin" })] }), formData.role === "student" && (_jsx("input", { type: "text", name: "student_id", placeholder: "Student ID", value: formData.student_id, onChange: handleChange, className: "mb-4 w-full p-2 border rounded", required: true })), _jsx("button", { type: "submit", className: "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full", children: "Register" }), _jsxs("p", { className: "mt-4 text-center text-sm", children: ["Already have an account?", " ", _jsx("a", { href: "/login", className: "text-blue-600 hover:underline", children: "Login" })] })] })] }));
};
export default Register;
