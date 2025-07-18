import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@/components/ui/button';
const StudentManager = () => {
    const [students, setStudents] = useState([]);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUrl, setCurrentUrl] = useState('/api/students/');
    const fetchStudents = async (url) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setStudents(res.data?.results || []); // ✅ Protect against undefined
            setNextPage(res.data?.next || null);
            setPrevPage(res.data?.previous || null);
        }
        catch (err) {
            console.error('Error fetching students:', err);
            setStudents([]); // ✅ Prevent map crash
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchStudents(currentUrl);
    }, [currentUrl]);
    return (_jsxs("div", { className: "p-4 bg-white rounded shadow", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Student Manager" }), loading ? (_jsx("p", { children: "Loading..." })) : (_jsxs(_Fragment, { children: [students.length === 0 ? (_jsx("p", { children: "No students found." })) : (_jsxs("table", { className: "w-full border-collapse mb-4", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100", children: [_jsx("th", { className: "border px-2 py-1 text-left", children: "ID" }), _jsx("th", { className: "border px-2 py-1 text-left", children: "Username" }), _jsx("th", { className: "border px-2 py-1 text-left", children: "Name" }), _jsx("th", { className: "border px-2 py-1 text-left", children: "Email" }), _jsx("th", { className: "border px-2 py-1 text-left", children: "Program" })] }) }), _jsx("tbody", { children: students.map((student) => (_jsxs("tr", { children: [_jsx("td", { className: "border px-2 py-1", children: student.student_id }), _jsx("td", { className: "border px-2 py-1", children: student.user?.username ?? '—' }), _jsx("td", { className: "border px-2 py-1", children: student.name ?? '—' }), _jsx("td", { className: "border px-2 py-1", children: student.email ?? '—' }), _jsx("td", { className: "border px-2 py-1", children: student.program ?? '—' })] }, student.student_id))) })] })), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { onClick: () => prevPage && setCurrentUrl(prevPage), disabled: !prevPage, className: "bg-gray-300 hover:bg-gray-400 text-black rounded disabled:opacity-50", children: "Previous" }), _jsx(Button, { onClick: () => nextPage && setCurrentUrl(nextPage), disabled: !nextPage, className: "bg-gray-300 hover:bg-gray-400 text-black rounded disabled:opacity-50", children: "Next" })] })] }))] }));
};
export default StudentManager;
