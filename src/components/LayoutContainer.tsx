import React, { type ReactNode } from 'react';

interface LayoutContainerProps {
  children: ReactNode;
}

export const LayoutContainer: React.FC<LayoutContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {children}
      </div>
    </div>
  );
};

