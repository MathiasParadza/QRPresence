// src/components/LoadingSpinner.tsx
import React from 'react';

const LoadingSpinner = () => {
  return (
    <div style={spinnerWrapperStyle}>
      <div style={spinnerStyle}></div>
    </div>
  );
};

// CSS in JS
const spinnerWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
};

const spinnerStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  border: '6px solid #f3f3f3',
  borderTop: '6px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

// Keyframes (inject globally)
const styleSheet = document.styleSheets[0];
const keyframes =
`@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default LoadingSpinner;
