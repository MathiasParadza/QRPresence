import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Register.css"; // Import the enhanced CSS file

interface FormData {
  username: string;
  email: string;
  password: string;
  role: "student" | "lecturer" | "admin";
  student_id: string;
  name: string;
  program: string;
  lecturer_id?: string;
  department?: string;
}

const Register = () => {
  const [formData, setFormData] = useState<FormData>({
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = (): string | null => {
    const { username, email, password, role, student_id, name, program, lecturer_id, department } = formData;

    if (!username.trim()) return "Username is required.";
    if (!email.trim()) return "Email is required.";
    if (!password) return "Password is required.";
    if (!name.trim()) return "Full name is required.";

    if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    if (role === "student") {
      if (!student_id.trim()) return "Student ID is required.";
      if (!/^\d+$/.test(student_id)) return "Student ID must contain only numbers.";
      if (!program.trim()) return "Program is required for students.";
    }

    if (role === "lecturer") {
      if (!lecturer_id?.trim()) return "Lecturer ID is required.";
      if (!department?.trim()) return "Department is required for lecturers.";
    }

    if (role === "admin") {
      // Admin registration might require additional validation if needed
      // For now, just basic validation
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const dataToSend: {
      username: string;
      email: string;
      password: string;
      role: "student" | "lecturer" | "admin";
      name: string;
      student_id?: string;
      program?: string;
      lecturer_id?: string;
      department?: string;
    } = {
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
    } else if (formData.role === "lecturer") {
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
        } else if (formData.role === "lecturer") {
          successMessage = "Lecturer registration successful! Please login.";
        } else if (formData.role === "admin") {
          successMessage = "Admin registration successful! Please login.";
        }

        toast.success(successMessage);
        navigate("/login");
      } else {
        let errorMessage = "Registration failed. Please try again.";

        if (typeof responseData === "object") {
          const fieldErrors = Object.values(responseData).flat();
          if (fieldErrors.length > 0) {
            errorMessage = Array.isArray(fieldErrors[0])
              ? fieldErrors[0][0]
              : fieldErrors[0];
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          }
        } else if (typeof responseData === "string") {
          errorMessage = responseData;
        }

        console.error("Registration error:", responseData);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const error = err as Error;
      console.error("Network error:", error);
      setError("Network error. Please check your connection.");
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="register-form">
        <div className="register-header">
          <h2 className="register-title">Create Account</h2>
          <p className="register-subtitle">Join our platform today</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="input-group">
          <label className="input-label">Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a secure password"
            value={formData.password}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="role" className="input-label">Role</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="select-field"
          >
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {formData.role === "student" && (
          <div className="student-fields">
            <div className="input-group">
              <label className="input-label">Student ID</label>
              <input
                type="text"
                name="student_id"
                placeholder="Enter your student ID"
                value={formData.student_id}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Program</label>
              <input
                type="text"
                name="program"
                placeholder="Enter your program"
                value={formData.program}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>
        )}

        {formData.role === "lecturer" && (
          <div className="lecturer-fields">
            <div className="input-group">
              <label className="input-label">Lecturer ID</label>
              <input
                type="text"
                name="lecturer_id"
                placeholder="Enter your lecturer ID"
                value={formData.lecturer_id}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Department</label>
              <input
                type="text"
                name="department"
                placeholder="Enter your department"
                value={formData.department}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>
        )}

        {formData.role === "admin" && (
          <div className="admin-note">
            <p className="note-text">
              <strong>Note:</strong> Admin accounts have full system access and privileges.
              Please ensure proper authorization before creating admin accounts.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="register-button"
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <div className="login-section">
          <p className="login-text">Already have an account?</p>
          <a href="/login" className="login-link">
            Sign In
          </a>
        </div>
      </form>
    </div>
  );
};

export default Register;