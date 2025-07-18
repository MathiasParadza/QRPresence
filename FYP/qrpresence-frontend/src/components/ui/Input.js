import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => {
    return (_jsxs("div", { className: "flex flex-col space-y-1", children: [label && _jsx("label", { className: "text-sm font-medium", children: label }), _jsx("input", { ref: ref, className: `border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`, ...props }), error && _jsx("span", { className: "text-xs text-red-500", children: error })] }));
});
Input.displayName = 'Input';
export default Input;
