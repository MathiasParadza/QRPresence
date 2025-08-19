import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-gray-50">
      {/* Header Section */}
      <header className="text-center py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-6 leading-tight">
            Welcome to QRPresence
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 font-light max-w-3xl mx-auto leading-relaxed">
            Your comprehensive solution for modern student registration and intelligent attendance tracking.
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Registration Card */}
            <div className="group relative bg-white rounded-2xl shadow-lg border border-purple-100 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-20 blur-sm"></div>
              <div className="mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-purple-700 mb-3">Student Registration</h2>
                <p className="text-gray-600 leading-relaxed">
                  Streamline the registration process for new students and lecturers with our intuitive system.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Register Now
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Login Card */}
            <div className="group relative bg-white rounded-2xl shadow-lg border border-blue-100 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 blur-sm"></div>
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue-700 mb-3">User Login</h2>
                <p className="text-gray-600 leading-relaxed">
                  Access your personalized dashboard to manage attendance records and sessions securely.
                </p>
              </div>
              <Link
                to="/Login"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Go to Login
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* QR Code Feature Card */}
            <div className="group relative bg-white rounded-2xl shadow-lg border border-green-100 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 md:col-span-2 lg:col-span-1">
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20 blur-sm"></div>
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-3">QR Code Attendance</h2>
                <p className="text-gray-600 leading-relaxed">
                  Revolutionary QR code technology for instant, contactless attendance tracking.
                </p>
              </div>
              <div className="inline-flex items-center justify-center w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg cursor-not-allowed opacity-75">
                Scan to be Present
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-3xl font-bold text-center mb-8">Why Choose QRPresence?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-2">Reliable</h4>
                <p className="text-purple-100">99.9% uptime with enterprise-grade security</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2.05v2.02c4.39.54 7.5 4.53 6.96 8.92-.39 3.16-2.9 5.67-6.06 6.06-4.39.54-8.38-2.57-8.92-6.96S7.55 4.59 11 4.05V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10s10.01-4.48 10.01-10c0-5.19-3.95-9.45-9-9.95z"/>
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-2">Fast</h4>
                <p className="text-purple-100">Lightning-fast QR code generation and scanning</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-2">Easy</h4>
                <p className="text-purple-100">Intuitive interface designed for all users</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 mb-2">
            &copy; 2025 QRPresence. All rights reserved.
          </p>
          <p className="text-sm text-gray-500">
            Built with modern technology for seamless attendance management.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;