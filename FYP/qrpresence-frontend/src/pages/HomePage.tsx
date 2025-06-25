import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 p-6">
      {/* Header Section */}
      <header className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 drop-shadow">
          Welcome to QRPresence
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 font-light max-w-2xl mx-auto">
          Your go-to solution for student registration and attendance tracking.
        </p>
      </header>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-20">
        {/* Registration */}
        <div className="relative bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          <div className="absolute -top-4 -right-4 bg-indigo-500 w-10 h-10 rounded-full blur-xl opacity-30"></div>
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Student Registration</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Easily register new students or lecturers and manage their details for attendance tracking.
          </p>
          <Link
            to="/register"
            className="inline-block px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Register Now
          </Link>
        </div>

        {/* Login */}
        <div className="relative bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          <div className="absolute -top-4 -left-4 bg-blue-500 w-10 h-10 rounded-full blur-xl opacity-30"></div>
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">User Login</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Log in to your dashboard to view attendance records and manage sessions securely.
          </p>
          <Link
            to="/Login"
            className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm">
        &copy; 2025 QRPresence. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
