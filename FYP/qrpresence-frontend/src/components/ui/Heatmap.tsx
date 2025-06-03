import { Loader2 } from "lucide-react"; // optional: nice spinner icon (install lucide-react if not already)

interface HeatmapDataItem {
  session: string;
  missed: number;
}

interface HeatmapProps {
  data?: HeatmapDataItem[]; // optional for safety
}

const Heatmap = ({ data }: HeatmapProps) => {
  const getColor = (missed: number): string => {
    if (missed > 40) return "bg-red-500";
    if (missed > 20) return "bg-yellow-400";
    return "bg-green-400";
  };

  if (!Array.isArray(data)) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading heatmap...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 p-6">
        No heatmap data available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {data.map((item, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg ${getColor(item.missed)} text-white text-center`}
        >
          <h3 className="font-semibold">{item.session}</h3>
          <p>{item.missed}% Missed</p>
        </div>
      ))}
    </div>
  );
};

export default Heatmap;
