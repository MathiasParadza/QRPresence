# QRPresence
...........

QRPresence is a QR Code-based Student Registration and Attendance Tracking System. It allows lecturers to generate session QR codes, and students can scan them to mark attendance. The system provides detailed attendance records, analytics, and administrative management features.

# Table of Contents
....................

Features

System Requirements

Installation

Running the System

Demo Credentials

Usage Guide

Project Structure

API Endpoints

# FEATURES
...........

JWT-based Authentication

Role-based Access

  . Students

  . Lecturers

  . Admin

QR Code Generation for session attendance

QR Code Scanning via webcam for students

Attendance Analytics

Student Enrollment & Management

Export Attendance Records (CSV/PDF)

Profile Management for lecturers and students

# SYSTEM REQUIREMENTS
......................

Backend: Django 4.x, Django REST Framework, MySQL 8.x

Frontend: React 18+, TypeScript, Vite

Other Tools: Node.js 20+, npm/yarn, Python 3.11+, Git

Browser: Chrome/Edge for QR code scanning

# INSTALLATION
................
Backend

Clone the repository:

git clone https://github.com/MathiasParadza/QRPresence.git
cd QRPresence/FYP


Create and activate a Python virtual environment:

python -m venv venv
source venv/Scripts/activate   # Windows
source venv/bin/activate       # Linux/Mac


Install backend dependencies:

pip install -r requirements.txt


Configure .env file:

DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=qrpresence
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=3306


Apply migrations:

python manage.py migrate


Create a superuser (optional for admin):

python manage.py createsuperuser


Start the backend server:

python manage.py runserver

Frontend

Navigate to the frontend directory:

cd qrpresence-frontend


Install dependencies:

npm install


Configure src/services/authService.ts with your backend URL:

const API_URL = "http://localhost:8000/api/";


Start the frontend:

npm run dev


Frontend will run at http://localhost:5173 (default Vite port).

# DEMO CREDENTIALS 
Admin
Username: MyAdmin
Password: myadmin123

Lecturer
Username: lecturer1
Password: lecturer123

Student
Username: student1
Password: student123

Usage Guide
For Students

Log in using your student credentials.

Navigate to the QR Scanner page.

Scan the QR code provided by your lecturer to mark attendance.

View attendance history and status.

For Lecturers

Log in using your lecturer credentials.

Manage courses and student enrollments.

Create sessions and generate QR codes.

View attendance per session.

Export attendance reports as CSV or PDF.

For Admin

Manage all users (students, lecturers).

View and edit courses and sessions.

Access all attendance analytics.

Project Structure
QRPresence/
├─ FYP/                      # Django backend
│  ├─ attendance/             # Attendance models, views, serializers
│  ├─ students/               # Student model & API
│  ├─ lecturers/              # Lecturer model & API
│  ├─ courses/                # Course management
│  ├─ qr_codes/               # Generated QR codes (media folder)
│  ├─ templates/              # HTML templates (if any)
│  ├─ settings.py             # Django settings
│  └─ urls.py                 # URL routing
├─ qrpresence-frontend/       # React + TypeScript frontend
│  ├─ src/
│  │  ├─ components/          # UI Components
│  │  ├─ pages/               # StudentView, LecturerView, AdminDashboard
│  │  ├─ hooks/               # Custom hooks (useQRScanner, useAttendanceMarker)
│  │  ├─ services/            # API services (authService, attendanceService)
│  │  ├─ App.tsx              # Main App
│  │  └─ main.tsx             # Vite entry point
├─ requirements.txt           # Backend dependencies
├─ package.json               # Frontend dependencies
└─ README.md

API Endpoints (selected)
Endpoint	Method	Access	Description
/api/token/	POST	Public	Obtain JWT token
/api/student-profile/	GET	Student	Retrieve student profile
/api/student/today-status/	GET	Student	Get today's attendance status
/api/lecturer-attendance/	GET	Lecturer	Retrieve attendance for lecturer courses
/api/admin/users/	GET/POST/PUT/DELETE	Admin	Manage users
/api/admin/courses/	GET/POST/PUT/DELETE	Admin	Manage courses
/api/ai_chat/	POST	Lecturer	AI analytics & queries
