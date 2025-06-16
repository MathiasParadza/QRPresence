import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line
} from "recharts";

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

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="attendance"
            stroke="#4f46e5"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceTrends;
