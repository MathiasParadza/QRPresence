import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "default" | "secondary" | "destructive"; // ✅ new
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
  variant = "default", // ✅ default variant
}) => {
  const baseClasses =
    "px-4 py-2 rounded-md border text-white focus:outline-none focus:ring-2 transition-colors";
  const variantClasses = {
    default: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300",
    secondary: "bg-gray-500 hover:bg-gray-600 focus:ring-gray-300",
    destructive: "bg-red-600 hover:bg-red-700 focus:ring-red-300",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
