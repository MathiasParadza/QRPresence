import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string; // Optional additional class for styling
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
