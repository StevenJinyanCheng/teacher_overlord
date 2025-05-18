import React from 'react';

const SimpleNotificationCenter: React.FC = () => {
  return (
    <button
      aria-label="Notifications"
      onClick={() => alert('Notifications feature coming soon!')}
      style={{ 
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        padding: '8px'
      }}
    >
      🔔
    </button>
  );
};

export default SimpleNotificationCenter;
