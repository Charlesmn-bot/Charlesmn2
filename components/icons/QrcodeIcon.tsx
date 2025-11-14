
import React from 'react';

export const QrcodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6.5 2.5l-2.5 2.5M12 10v4m0 0v4m0-4h4m-4 0H8m4-4V6a2 2 0 00-2-2h-1m-1 4l-2 2m0 6l2 2m7-7l2-2" />
  </svg>
);
