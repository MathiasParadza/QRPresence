import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AttendanceTrends = () => {
  // Dummy data for now — later fetch from API
  const data = [
    { month: "Jan", attendance: 85 },
    { month: "Feb", attendance: 82 },
    { month: "Mar", attendance: 88 },
    { month: "Apr", attendance: 86 },
    { month: "May", attendance: 90 },
    { month: "Jun", attendance: 87 },
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="attendance" stroke="#4f46e5" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceTrends;
