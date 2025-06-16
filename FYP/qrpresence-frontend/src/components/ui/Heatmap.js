import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from "lucide-react"; // optional: nice spinner icon (install lucide-react if not already)
const Heatmap = ({ data }) => {
    const getColor = (missed) => {
        if (missed > 40)
            return "bg-red-500";
        if (missed > 20)
            return "bg-yellow-400";
        return "bg-green-400";
    };
    if (!Array.isArray(data)) {
        return (_jsxs("div", { className: "flex justify-center items-center p-6", children: [_jsx(Loader2, { className: "h-6 w-6 animate-spin text-gray-500" }), _jsx("span", { className: "ml-2 text-gray-500", children: "Loading heatmap..." })] }));
    }
    if (data.length === 0) {
        return (_jsx("div", { className: "text-center text-gray-500 p-6", children: "No heatmap data available." }));
    }
    return (_jsx("div", { className: "grid grid-cols-2 gap-4", children: data.map((item, index) => (_jsxs("div", { className: `p-4 rounded-lg ${getColor(item.missed)} text-white text-center`, children: [_jsx("h3", { className: "font-semibold", children: item.session }), _jsxs("p", { children: [item.missed, "% Missed"] })] }, index))) }));
};
export default Heatmap;
