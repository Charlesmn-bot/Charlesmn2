
import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);

  const handleScan = (data: { text: string } | null) => {
    if (data) {
      onScan(data.text);
      onClose();
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please enable camera permissions in your browser settings.');
    } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure a camera is connected and enabled.');
    }
    else {
        setError('An error occurred while accessing the camera.');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Scan Sale QR Code</h2>
      <div className="bg-brand-surface dark:bg-[#374151] rounded-lg overflow-hidden shadow-lg w-full aspect-square">
        {error ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%', height: '100%' }}
            constraints={{ video: { facingMode: 'environment' } }}
          />
        )}
      </div>
       <p className="text-gray-500 dark:text-gray-400 mt-4">Point the camera at the QR code on the receipt.</p>
    </div>
  );
};