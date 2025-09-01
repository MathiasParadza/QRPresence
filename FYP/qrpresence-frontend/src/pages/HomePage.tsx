import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file

const HomePage: React.FC = () => {
  return (
    <div className="homepage-container">
      {/* Header Section */}
      <header className="homepage-header">
        <div className="homepage-header__container">
          <h1 className="homepage-header__title">
            Welcome to QRPresence
          </h1>
          <p className="homepage-header__subtitle">
            Your comprehensive solution for modern student registration and intelligent attendance tracking.
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section className="homepage-features">
        <div className="homepage-features__container">
          <div className="homepage-features__grid">
            {/* Registration Card */}
            <div className="homepage-card homepage-card--purple">
              <div className="homepage-card__content">
                <div className="homepage-card__icon-container">
                  <svg className="homepage-card__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="homepage-card__title">Student Registration</h2>
                <p className="homepage-card__description">
                  Streamline the registration process for new students and lecturers with our intuitive system.
                </p>
              </div>
              <Link
                to="/register"
                className="homepage-card__button homepage-card__button--purple"
              >
                Register Now
                <svg className="homepage-card__button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Login Card */}
            <div className="homepage-card homepage-card--blue">
              <div className="homepage-card__content">
                <div className="homepage-card__icon-container">
                  <svg className="homepage-card__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="homepage-card__title">User Login</h2>
                <p className="homepage-card__description">
                  Access your personalized dashboard to manage attendance records and sessions securely.
                </p>
              </div>
              <Link
                to="/Login"
                className="homepage-card__button homepage-card__button--blue"
              >
                Go to Login
                <svg className="homepage-card__button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* QR Code Feature Card */}
            <div className="homepage-card homepage-card--green">
              <div className="homepage-card__content">
                <div className="homepage-card__icon-container">
                  <svg className="homepage-card__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h2 className="homepage-card__title">QR Code Attendance</h2>
                <p className="homepage-card__description">
                  Revolutionary QR code technology for instant, contactless attendance tracking.
                </p>
              </div>
              <div className="homepage-card__button homepage-card__button--green">
                Scan to be Present
                <svg className="homepage-card__button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="homepage-why-choose">
            <h3 className="homepage-why-choose__title">Why Choose QRPresence?</h3>
            <div className="homepage-why-choose__grid">
              <div className="homepage-why-choose__feature">
                <div className="homepage-why-choose__feature-icon">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h4 className="homepage-why-choose__feature-title">Reliable</h4>
                <p className="homepage-why-choose__feature-description">99.9% uptime with enterprise-grade security</p>
              </div>
              <div className="homepage-why-choose__feature">
                <div className="homepage-why-choose__feature-icon">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2.05v2.02c4.39.54 7.5 4.53 6.96 8.92-.39 3.16-2.9 5.67-6.06 6.06-4.39.54-8.38-2.57-8.92-6.96S7.55 4.59 11 4.05V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10s10.01-4.48 10.01-10c0-5.19-3.95-9.45-9-9.95z"/>
                  </svg>
                </div>
                <h4 className="homepage-why-choose__feature-title">Fast</h4>
                <p className="homepage-why-choose__feature-description">Lightning-fast QR code generation and scanning</p>
              </div>
              <div className="homepage-why-choose__feature">
                <div className="homepage-why-choose__feature-icon">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h4 className="homepage-why-choose__feature-title">Easy</h4>
                <p className="homepage-why-choose__feature-description">Intuitive interface designed for all users</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="homepage-footer__container">
          <p className="homepage-footer__copyright">
            &copy; 2025 QRPresence. All rights reserved.
          </p>
          <p className="homepage-footer__tagline">
            Built with modern technology for seamless attendance management.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;