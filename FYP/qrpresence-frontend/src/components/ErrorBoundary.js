import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ErrorBoundary.tsx
import { Component } from "react";
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(_) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { className: "text-center mt-20", children: [_jsx("h1", { className: "text-2xl font-bold text-red-600", children: "Something went wrong." }), _jsx("p", { children: "Please try refreshing the page." })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
