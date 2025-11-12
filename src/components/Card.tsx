<<<<<<< HEAD
import React from 'react';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-subtle p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
=======
import React from 'react';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-subtle p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
>>>>>>> 7263c8c7ff0af176bdd49dfbac64c8957ef07948
