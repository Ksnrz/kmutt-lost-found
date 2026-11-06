import React from 'react';
import './Input.css';

function Input({ type = 'text', placeholder, onChange }) {
  return (
    <div className="custom-input-wrapper">
      <input
        type={type}
        className="custom-input"
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
}

export default Input;