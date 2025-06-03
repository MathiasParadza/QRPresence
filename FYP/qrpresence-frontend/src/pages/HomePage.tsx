import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header Section */}
      <header className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Welcome to QRPresence</h1>
        <p className="text-lg mb-8">Your go-to solution for student registration and attendance tracking.</p>
      </header>

      {/* Main Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Student Registration Section */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Student Registration</h2>
          <p className="text-gray-700 mb-4">
            Easily register new students and manage their details for attendance tracking.
          </p>
          <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold">
            Register New User (Student/Lecturer)
          </Link>
        </div>

        {/* Attendance Tracking Section */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">User Login</h2>
          <p className="text-gray-700 mb-4">
            Login to your account to access attendance tracking and session management features.
          </p>
          <Link to="/Login" className="text-blue-500 hover:text-blue-600 font-semibold">
            Login
          </Link>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="text-center mt-8">
        <p className="text-gray-600">
          &copy; 2025 QRPresence. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
