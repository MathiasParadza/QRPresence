import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return children;
};
export default ProtectedRoute;
