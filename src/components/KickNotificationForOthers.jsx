import React, { useEffect } from 'react';
import { UserX, X } from 'lucide-react';

const KickNotificationForOthers = ({ kickedPlayerName, hostName, onClose }) => {
  useEffect(() => {
    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 font-orbitron animate-slide-in-right">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-4 border border-red-400 shadow-2xl shadow-red-500/50 min-w-[300px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserX className="text-white" size={24} />
            <div>
              <p className="text-white font-semibold text-sm">¡Jugador expulsado!</p>
              <div className="flex flex-col space-y-1">
                <span className="text-red-100 font-bold">{kickedPlayerName}</span>
                <span className="text-orange-200 text-xs">Por: {hostName}</span>
              </div>
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

export default KickNotificationForOthers;