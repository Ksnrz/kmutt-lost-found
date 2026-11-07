import React from 'react';
import './ImageUpload.css';

function ImageUpload({ text, size, onChange, multiple = true }) {
  return (
    <label className="image-upload-box" style={{ padding: size }}>
      <input 
        type="file" 
        accept="image/*" 
        multiple={multiple} 
        onChange={onChange} 
        style={{ display: 'none' }} 
      />
      <span className="image-upload-text">
        {text}
      </span>
    </label>
  );
}

export default ImageUpload;
