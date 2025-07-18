import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Dialog = ({ isOpen, onClose, children, title }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative", children: [title && _jsx("h2", { className: "text-xl font-semibold mb-4", children: title }), _jsx("button", { onClick: onClose, className: "absolute top-3 right-3 text-gray-600 hover:text-black text-lg", children: "\u00D7" }), children] }) }));
};
export default Dialog;
