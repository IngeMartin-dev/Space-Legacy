import React, { useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';

const JoinNotification = ({ playerName, avatar, onClose, isLeaving, reason, kickedBy }) => {
  useEffect(() => {
    console.log('🔔 JoinNotification component mounted for:', playerName, 'isLeaving:', isLeaving, 'reason:', reason);
    console.log('🔔 JoinNotification props:', { playerName, avatar, isLeaving, reason });
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      console.log('🔔 Auto-closing notification for:', playerName);
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose, playerName, isLeaving, reason]);

  return (
    <div className="fixed top-4 right-4 z-[9999] font-orbitron animate-slide-in-right">
      <div className={`rounded-lg p-4 border-2 shadow-2xl min-w-[320px] backdrop-blur-sm ${
        isLeaving
          ? 'bg-gradient-to-r from-red-600/95 to-orange-600/95 border-red-400 shadow-red-500/70'
          : 'bg-gradient-to-r from-green-600/95 to-emerald-600/95 border-green-400 shadow-green-500/70'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isLeaving ? (
              reason === 'kick' || reason === 'ban' ? (
                <div className="text-white text-2xl animate-bounce">🚫</div>
              ) : (
                <div className="text-white text-2xl animate-bounce">👋</div>
              )
            ) : (
              <UserPlus className="text-white animate-pulse" size={24} />
            )}
            <div>
              <p className="text-white font-semibold text-sm">
                {isLeaving
                  ? (reason === 'kick'
                      ? `🚫 ${playerName} fue expulsado por ${kickedBy || 'el anfitrión'}`
                      : reason === 'ban'
                      ? `🚫 ${playerName} fue baneado por ${kickedBy || 'el administrador'}`
                      : `👋 ${playerName} se salió de la sala`)
                  : '🎉 ¡Jugador conectado!'
                }
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl animate-bounce">{avatar || '👤'}</span>
                <span className={`font-bold ${isLeaving ? (reason === 'kick' || reason === 'ban' ? 'text-red-100' : 'text-orange-100') : 'text-green-100'}`}>
                  {playerName}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`text-white transition-colors ml-2 ${
              isLeaving ? 'hover:text-red-200' : 'hover:text-green-200'
            }`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinNotification;