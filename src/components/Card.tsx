// src/components/Card.tsx
import React from 'react';

const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white rounded-lg shadow-subtle p-6 ${className}`}>
      {title && <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>}
      {children}
    </div>
  );
};

export default Card;
