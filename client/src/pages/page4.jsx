import React from 'react';

function BackButton() {
  const handleBack = () => {
    window.history.back(); 
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <button 
        onClick={handleBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#555',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItem: 'center',
          gap: '5px',
          padding: '0'
        }}
      >
        ← กลับไปรายการโพสต์
      </button>
    </div>
  );
}

export default BackButton;