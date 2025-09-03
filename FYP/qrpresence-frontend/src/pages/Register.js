import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Register.css"; // Import the enhanced CSS file
const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "student",
        student_id: "",
        name: "",
        program: "",
        lecturer_id: "",
        department: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const validateForm = () => {
        const { username, email, password, role, student_id, name, program, lecturer_id, department } = formData;
        if (!username.trim())
            return "Username is required.";
        if (!email.trim())
            return "Email is required.";
        if (!password)
            return "Password is required.";
        if (!name.trim())
            return "Full name is required.";
        if (!/\S+@\S+\.\S+/.test(email)) {
            return "Please enter a valid email address.";
        }
        if (password.length < 6) {
            return "Password must be at least 6 characters long.";
        }
        if (role === "student") {
            if (!student_id.trim())
                return "Student ID is required.";
            if (!/^\d+$/.test(student_id))
                return "Student ID must contain only numbers.";
            if (!program.trim())
                return "Program is required for students.";
        }
        if (role === "lecturer") {
            if (!lecturer_id?.trim())
                return "Lecturer ID is required.";
            if (!department?.trim())
                return "Department is required for lecturers.";
        }
        if (role === "admin") {
            // Admin registration might require additional validation if needed
            // For now, just basic validation
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
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            name: formData.name.trim(),
        };
        // Add role-specific fields
        if (formData.role === "student") {
            dataToSend.student_id = formData.student_id.trim();
            dataToSend.program = formData.program.trim();
        }
        else if (formData.role === "lecturer") {
            dataToSend.lecturer_id = formData.lecturer_id?.trim();
            dataToSend.department = formData.department?.trim();
        }
        // Admin role doesn't need additional fields
        try {
            setLoading(true);
            const response = await fetch("http://127.0.0.1:8000/api/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSend),
            });
            const responseData = await response.json();
            if (response.ok) {
                let successMessage = "Registration successful! Please login.";
                if (formData.role === "student") {
                    successMessage = "Student registration successful! Please login.";
                }
                else if (formData.role === "lecturer") {
                    successMessage = "Lecturer registration successful! Please login.";
                }
                else if (formData.role === "admin") {
                    successMessage = "Admin registration successful! Please login.";
                }
                toast.success(successMessage);
                navigate("/login");
            }
            else {
                let errorMessage = "Registration failed. Please try again.";
                if (typeof responseData === "object") {
                    const fieldErrors = Object.values(responseData).flat();
                    if (fieldErrors.length > 0) {
                        errorMessage = Array.isArray(fieldErrors[0])
                            ? fieldErrors[0][0]
                            : fieldErrors[0];
                    }
                    else if (responseData.detail) {
                        errorMessage = responseData.detail;
                    }
                }
                else if (typeof responseData === "string") {
                    errorMessage = responseData;
                }
                console.error("Registration error:", responseData);
                setError(errorMessage);
                toast.error(errorMessage);
            }
        }
        catch (err) {
            const error = err;
            console.error("Network error:", error);
            setError("Network error. Please check your connection.");
            toast.error("Network error. Please check your connection.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "register-container", children: [_jsx(ToastContainer, {}), _jsxs("form", { onSubmit: handleSubmit, className: "register-form", children: [_jsxs("div", { className: "register-header", children: [_jsx("h2", { className: "register-title", children: "Create Account" }), _jsx("p", { className: "register-subtitle", children: "Join our platform today" })] }), error && _jsx("div", { className: "error-message", children: error }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Username" }), _jsx("input", { type: "text", name: "username", placeholder: "Enter your username", value: formData.username, onChange: handleChange, className: "input-field", required: true })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Email" }), _jsx("input", { type: "email", name: "email", placeholder: "Enter your email", value: formData.email, onChange: handleChange, className: "input-field", required: true })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Full Name" }), _jsx("input", { type: "text", name: "name", placeholder: "Enter your full name", value: formData.name, onChange: handleChange, className: "input-field", required: true })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Password" }), _jsx("input", { type: "password", name: "password", placeholder: "Create a secure password", value: formData.password, onChange: handleChange, className: "input-field", required: true })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { htmlFor: "role", className: "input-label", children: "Role" }), _jsxs("select", { id: "role", name: "role", value: formData.role, onChange: handleChange, className: "select-field", children: [_jsx("option", { value: "student", children: "Student" }), _jsx("option", { value: "lecturer", children: "Lecturer" }), _jsx("option", { value: "admin", children: "Administrator" })] })] }), formData.role === "student" && (_jsxs("div", { className: "student-fields", children: [_jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Student ID" }), _jsx("input", { type: "text", name: "student_id", placeholder: "Enter your student ID", value: formData.student_id, onChange: handleChange, className: "input-field", required: true })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Program" }), _jsx("input", { type: "text", name: "program", placeholder: "Enter your program", value: formData.program, onChange: handleChange, className: "input-field", required: true })] })] })), formData.role === "lecturer" && (_jsxs("div", { className: "lecturer-fields", children: [_jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Lecturer ID" }), _jsx("input", { type: "text", name: "lecturer_id", placeholder: "Enter your lecturer ID", value: formData.lecturer_id, onChange: handleChange, className: "input-field", required: true })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { className: "input-label", children: "Department" }), _jsx("input", { type: "text", name: "department", placeholder: "Enter your department", value: formData.department, onChange: handleChange, className: "input-field", required: true })] })] })), formData.role === "admin" && (_jsx("div", { className: "admin-note", children: _jsxs("p", { className: "note-text", children: [_jsx("strong", { children: "Note:" }), " Admin accounts have full system access and privileges. Please ensure proper authorization before creating admin accounts."] }) })), _jsx("button", { type: "submit", disabled: loading, className: "register-button", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "loading-spinner" }), "Creating Account..."] })) : ("Create Account") }), _jsxs("div", { className: "login-section", children: [_jsx("p", { className: "login-text", children: "Already have an account?" }), _jsx("a", { href: "/login", className: "login-link", children: "Sign In" })] })] })] }));
};
export default Register;
