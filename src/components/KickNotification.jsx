import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const KickNotification = ({ message, hostName, onClose }) => {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-28 right-4 z-[9999] font-orbitron animate-slide-in-right">
      <div className="bg-gradient-to-r from-red-600/95 to-orange-600/95 rounded-lg p-4 border-2 border-red-400 shadow-2xl shadow-red-500/70 min-w-[320px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-white text-2xl animate-bounce">🚫</div>
            <div>
              <p className="text-white font-semibold text-sm">¡EXPULSADO!</p>
              {hostName && (
                <p className="text-orange-200 text-xs">Por: {hostName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors ml-2"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default KickNotification;