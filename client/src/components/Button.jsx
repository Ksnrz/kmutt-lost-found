
import React from 'react';
import './Button.css';

function Button({ children, className = '', onClick, type = 'button' }) {
    return (
        <button
            type={type}
            className={`custom-btn ${className}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default Button;
