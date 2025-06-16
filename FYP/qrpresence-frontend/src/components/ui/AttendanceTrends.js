import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
const AttendanceTrends = () => {
    // Dummy data for now — later fetch from API
    const data = [
        { month: "Jan", attendance: 85 },
        { month: "Feb", attendance: 82 },
        { month: "Mar", attendance: 90 },
        { month: "Apr", attendance: 87 },
        { month: "May", attendance: 88 },
        { month: "Jun", attendance: 84 }
    ];
    return (_jsx("div", { style: { width: "100%", height: 300 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month" }), _jsx(YAxis, { domain: [0, 100] }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "attendance", stroke: "#4f46e5", strokeWidth: 3 })] }) }) }));
};
export default AttendanceTrends;
