import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import QRScanner from '../../components/QRScanner';
import { toast } from 'react-toastify';
import defaultAvatar from '../../assets/avatar.png';
const StudentView = () => {
    const [profile, setProfile] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [editing, setEditing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        student_id: '',
        program: '',
    });
    const token = localStorage.getItem('access_token');
    const API_BASE_URL = 'http://localhost:8000';
    useEffect(() => {
        if (!token) {
            toast.error('No access token found. Please login again.');
            window.location.href = '/login';
            return;
        }
        const fetchAll = async () => {
            try {
                await fetchProfile();
                await fetchOverview();
            }
            catch (err) {
                console.error(err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);
    const fetchOverview = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student/overview/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Request failed with status ${response.status}`);
            }
            const data = await response.json();
            setTodayStatus(data.today_status);
            setAttendanceHistory(data.attendance_history);
        }
        catch (error) {
            console.error('Error fetching overview:', error);
            toast.error('Failed to load attendance overview');
        }
    };
    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student-profile/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Request failed with status ${response.status}`);
            }
            const data = await response.json();
            setProfile({
                student_id: data.student_id?.toString() || '',
                program: data.program || '',
                name: data.name || '',
                email: data.email || '',
            });
            setFormData({
                student_id: data.student_id?.toString() || '',
                program: data.program || '',
            });
        }
        catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
        }
    };
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSave = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student-profile/`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: formData.student_id,
                    program: formData.program,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to update profile');
            }
            toast.success('Profile updated successfully');
            setEditing(false);
            fetchProfile();
        }
        catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error instanceof Error ? error.message : 'Update failed');
        }
    };
    if (loading) {
        return (_jsx("div", { style: {
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }, children: _jsx("div", { style: {
                    backgroundColor: '#ffffff',
                    padding: '2rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#6b21a8'
                }, children: _jsx("p", { style: { fontSize: '1.125rem', margin: 0 }, children: "Loading student data..." }) }) }));
    }
    return (_jsxs("div", { style: {
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
            minHeight: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    backgroundColor: '#ffffff',
                    padding: '1rem 1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }, children: [_jsxs("h1", { style: {
                            color: '#6b21a8',
                            margin: 0,
                            fontSize: '1.875rem',
                            fontWeight: '700'
                        }, children: ["Welcome, ", profile?.name || 'Student', "!"] }), _jsx("img", { src: defaultAvatar, alt: "Avatar", style: {
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border: '3px solid #6b21a8',
                            transition: 'transform 0.2s ease'
                        }, onClick: () => setShowProfile((prev) => !prev), onMouseOver: (e) => e.currentTarget.style.transform = 'scale(1.1)', onMouseOut: (e) => e.currentTarget.style.transform = 'scale(1)' })] }), showProfile && profile && (_jsxs("div", { style: {
                    backgroundColor: '#ffffff',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                }, children: [_jsx("h2", { style: {
                            color: '#6b21a8',
                            marginTop: 0,
                            marginBottom: '1.5rem',
                            fontSize: '1.5rem',
                            fontWeight: '600'
                        }, children: "Profile Information" }), !editing ? (_jsxs("div", { style: { display: 'grid', gap: '1rem' }, children: [_jsxs("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1rem'
                                }, children: [_jsxs("div", { style: {
                                            backgroundColor: '#f1f5f9',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #cbd5e1'
                                        }, children: [_jsx("strong", { style: { color: '#475569' }, children: "Name:" }), _jsx("p", { style: { margin: '0.5rem 0 0 0', color: '#1e293b' }, children: profile.name })] }), _jsxs("div", { style: {
                                            backgroundColor: '#f1f5f9',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #cbd5e1'
                                        }, children: [_jsx("strong", { style: { color: '#475569' }, children: "Email:" }), _jsx("p", { style: { margin: '0.5rem 0 0 0', color: '#1e293b' }, children: profile.email })] }), _jsxs("div", { style: {
                                            backgroundColor: '#f1f5f9',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #cbd5e1'
                                        }, children: [_jsx("strong", { style: { color: '#475569' }, children: "Student ID:" }), _jsx("p", { style: { margin: '0.5rem 0 0 0', color: '#1e293b' }, children: profile.student_id })] }), _jsxs("div", { style: {
                                            backgroundColor: '#f1f5f9',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #cbd5e1'
                                        }, children: [_jsx("strong", { style: { color: '#475569' }, children: "program:" }), _jsx("p", { style: { margin: '0.5rem 0 0 0', color: '#1e293b' }, children: profile.program })] })] }), _jsx("button", { onClick: () => setEditing(true), style: {
                                    backgroundColor: '#6b21a8',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s ease',
                                    alignSelf: 'flex-start'
                                }, onMouseOver: (e) => e.currentTarget.style.backgroundColor = '#581c87', onMouseOut: (e) => e.currentTarget.style.backgroundColor = '#6b21a8', children: "Edit Profile" })] })) : (_jsxs("div", { style: { display: 'grid', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'grid', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: {
                                                    display: 'block',
                                                    marginBottom: '0.5rem',
                                                    color: '#475569',
                                                    fontWeight: '500'
                                                }, children: "Student ID:" }), _jsx("input", { type: "text", name: "student_id", value: formData.student_id, onChange: handleInputChange, placeholder: "Enter Student ID", style: {
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '1rem',
                                                    backgroundColor: '#ffffff',
                                                    boxSizing: 'border-box'
                                                } })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                                    display: 'block',
                                                    marginBottom: '0.5rem',
                                                    color: '#475569',
                                                    fontWeight: '500'
                                                }, children: "program:" }), _jsx("input", { type: "text", name: "program", value: formData.program, onChange: handleInputChange, placeholder: "program", style: {
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '1rem',
                                                    backgroundColor: '#ffffff',
                                                    boxSizing: 'border-box'
                                                } })] })] }), _jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("button", { onClick: handleSave, style: {
                                            backgroundColor: '#16a34a',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            transition: 'background-color 0.2s ease'
                                        }, onMouseOver: (e) => e.currentTarget.style.backgroundColor = '#15803d', onMouseOut: (e) => e.currentTarget.style.backgroundColor = '#16a34a', children: "Save Changes" }), _jsx("button", { onClick: () => setEditing(false), style: {
                                            backgroundColor: '#64748b',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            transition: 'background-color 0.2s ease'
                                        }, onMouseOver: (e) => e.currentTarget.style.backgroundColor = '#475569', onMouseOut: (e) => e.currentTarget.style.backgroundColor = '#64748b', children: "Cancel" })] })] }))] })), _jsx("div", { style: {
                    backgroundColor: '#ffffff',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    marginBottom: '2rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                }, children: _jsx("p", { style: {
                        margin: 0,
                        color: '#475569',
                        fontSize: '1.125rem',
                        textAlign: 'center'
                    }, children: "Your attendance is being tracked. Scan the QR code below to mark your attendance." }) }), _jsxs("div", { style: {
                    backgroundColor: '#ffffff',
                    padding: '2rem',
                    borderRadius: '0.75rem',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }, children: [_jsx("h2", { style: {
                            color: '#6b21a8',
                            marginTop: 0,
                            marginBottom: '1.5rem',
                            fontSize: '1.5rem',
                            fontWeight: '600'
                        }, children: "QR Code Scanner" }), _jsx(QRScanner, {})] }), _jsxs("div", { style: {
                    backgroundColor: '#f0fdf4',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    marginBottom: '2rem',
                    border: '1px solid #bbf7d0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }, children: [_jsx("h2", { style: {
                            color: '#16a34a',
                            marginTop: 0,
                            marginBottom: '1rem',
                            fontSize: '1.5rem',
                            fontWeight: '600'
                        }, children: "Today's Attendance Status" }), _jsx("div", { style: {
                            backgroundColor: '#ffffff',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #bbf7d0'
                        }, children: _jsx("p", { style: {
                                margin: 0,
                                fontSize: '1.125rem',
                                color: todayStatus ? '#16a34a' : '#64748b',
                                fontWeight: '500'
                            }, children: todayStatus || 'No attendance recorded for today' }) })] }), _jsxs("div", { style: {
                    backgroundColor: '#ffffff',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                }, children: [_jsx("h2", { style: {
                            color: '#6b21a8',
                            marginTop: 0,
                            marginBottom: '1.5rem',
                            fontSize: '1.5rem',
                            fontWeight: '600'
                        }, children: "Attendance History" }), attendanceHistory.length > 0 ? (_jsx("div", { style: { display: 'grid', gap: '1rem' }, children: attendanceHistory.map((record) => (_jsxs("div", { style: {
                                backgroundColor: '#faf5ff',
                                padding: '1.5rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #e9d5ff',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem'
                            }, children: [_jsxs("div", { children: [_jsx("strong", { style: { color: '#6b21a8' }, children: "Date:" }), _jsx("p", { style: { margin: '0.25rem 0 0 0', color: '#1e293b' }, children: new Date(record.session_date).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("strong", { style: { color: '#6b21a8' }, children: "Time:" }), _jsx("p", { style: { margin: '0.25rem 0 0 0', color: '#1e293b' }, children: record.session_time })] }), _jsxs("div", { children: [_jsx("strong", { style: { color: '#6b21a8' }, children: "Status:" }), _jsx("p", { style: {
                                                margin: '0.25rem 0 0 0',
                                                color: record.status.toLowerCase() === 'present' ? '#16a34a' : '#dc2626',
                                                fontWeight: '500'
                                            }, children: record.status })] }), _jsxs("div", { children: [_jsx("strong", { style: { color: '#6b21a8' }, children: "Class:" }), _jsx("p", { style: { margin: '0.25rem 0 0 0', color: '#1e293b' }, children: record.class_name })] })] }, record.id))) })) : (_jsx("div", { style: {
                            backgroundColor: '#f8fafc',
                            padding: '2rem',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }, children: _jsx("p", { style: {
                                margin: 0,
                                color: '#64748b',
                                fontSize: '1.125rem',
                                fontStyle: 'italic'
                            }, children: "No attendance records found yet." }) }))] })] }));
};
export default StudentView;
