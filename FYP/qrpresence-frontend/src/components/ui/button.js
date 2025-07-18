import { jsx as _jsx } from "react/jsx-runtime";
const Button = ({ children, onClick, className = "", type = "button", disabled = false, variant = "default", // ✅ default variant
 }) => {
    const baseClasses = "px-4 py-2 rounded-md border text-white focus:outline-none focus:ring-2 transition-colors";
    const variantClasses = {
        default: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300",
        secondary: "bg-gray-500 hover:bg-gray-600 focus:ring-gray-300",
        destructive: "bg-red-600 hover:bg-red-700 focus:ring-red-300",
        outline: "bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-300",
        ghost: "bg-transparent text-blue-500 hover:bg-blue-100 focus:ring-blue-300",
    };
    return (_jsx("button", { type: type, onClick: onClick, disabled: disabled, className: `${baseClasses} ${variantClasses[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`, children: children }));
};
export default Button;
