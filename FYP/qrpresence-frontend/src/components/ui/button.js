import { jsx as _jsx } from "react/jsx-runtime";
const Button = ({ children, onClick, className = "", type = "button", disabled = false }) => {
    return (_jsx("button", { type: type, onClick: onClick, disabled: disabled, className: `px-4 py-2 rounded-md border text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: children }));
};
export default Button;
