import React from 'react';
import './ImageUpload.css';

function ImageUpload({ onChange, multiple = true }) {
  return (
    <label className="image-upload-box">
      <input 
        type="file" 
        accept="image/*" 
        multiple={multiple} 
        onChange={onChange} 
        style={{ display: 'none' }} 
      />
      <span className="image-upload-text">
        + เพิ่มรูปภาพ (ได้หลายรูป)
      </span>
    </label>
  );
}

export default ImageUpload;
