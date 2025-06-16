import { jsx as _jsx } from "react/jsx-runtime";
const Card = ({ children, className }) => {
    return (_jsx("div", { className: `bg-white shadow-lg rounded-lg p-6 ${className}`, children: children }));
};
export default Card;
