import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface FormData {
  username: string;
  email: string;
  password: string;
  role: "student" | "lecturer";
  student_id: string;
  name: string;
  program: string;
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
    const { username, email, password, role, student_id, name, program } = formData;

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
      role: "student" | "lecturer";
      name: string;
      student_id?: string;
      program?: string;
    } = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
      name: formData.name.trim(),
      ...(formData.role === "student" && {
        student_id: formData.student_id.trim(),
        program: formData.program.trim(),
      }),
    };

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
        toast.success(
          formData.role === "student"
            ? "Student registration successful! Please login."
            : "Lecturer registration successful! Please login."
        );
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <ToastContainer />
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="mb-4 w-full p-2 border rounded"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="mb-4 w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="mb-4 w-full p-2 border rounded"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="mb-4 w-full p-2 border rounded"
          required
        />

        <label htmlFor="role" className="block mb-2 font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="mb-6 w-full p-2 border rounded"
        >
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
        </select>

        {formData.role === "student" && (
          <>
            <input
              type="text"
              name="student_id"
              placeholder="Student ID"
              value={formData.student_id}
              onChange={handleChange}
              className="mb-4 w-full p-2 border rounded"
              required
            />

            <input
              type="text"
              name="program"
              placeholder="Program"
              value={formData.program}
              onChange={handleChange}
              className="mb-4 w-full p-2 border rounded"
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full flex justify-center items-center"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
              ></path>
            </svg>
          ) : (
            "Register"
          )}
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default Register;
