import React, { useEffect } from 'react';
import { Trophy, X } from 'lucide-react';

const ScoreAchievementNotification = ({
  playerName,
  avatar,
  achievement,
  score,
  onClose
}) => {
  useEffect(() => {
    console.log('🏆 ScoreAchievementNotification component mounted for:', playerName, 'achievement:', achievement);
    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      console.log('🏆 Auto-closing achievement notification for:', playerName);
      onClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose, playerName, achievement]);

  const getAchievementIcon = (achievement) => {
    switch (achievement) {
      case 'top_score':
        return '🥇';
      case 'new_leader':
        return '👑';
      case 'high_score':
        return '🏆';
      case 'level_up':
        return '⬆️';
      case 'banned':
        return '🚫';
      default:
        return '⭐';
    }
  };

  const getAchievementMessage = (achievement) => {
    switch (achievement) {
      case 'top_score':
        return '¡Nuevo récord de puntuación!';
      case 'new_leader':
        return '¡Ahora eres el líder!';
      case 'high_score':
        return '¡Puntuación impresionante!';
      case 'level_up':
        return '¡Subiste de nivel!';
      case 'banned':
        return '¡Has sido baneado!';
      default:
        return '¡Logro desbloqueado!';
    }
  };

  const getAchievementColor = (achievement) => {
    switch (achievement) {
      case 'top_score':
        return 'from-yellow-600/95 to-orange-600/95 border-yellow-400';
      case 'new_leader':
        return 'from-purple-600/95 to-pink-600/95 border-purple-400';
      case 'high_score':
        return 'from-green-600/95 to-emerald-600/95 border-green-400';
      case 'level_up':
        return 'from-blue-600/95 to-indigo-600/95 border-blue-400';
      case 'banned':
        return 'from-red-600/95 to-red-700/95 border-red-400';
      default:
        return 'from-gray-600/95 to-slate-600/95 border-gray-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[10000] font-orbitron animate-slide-in-right shadow-2xl">
      <div className={`rounded-lg p-4 border-2 shadow-2xl min-w-[320px] backdrop-blur-sm ${getAchievementColor(achievement)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl animate-bounce">
              {getAchievementIcon(achievement)}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {getAchievementMessage(achievement)}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl animate-bounce">{avatar || '👤'}</span>
                <span className="text-white font-bold">
                  {playerName}
                </span>
              </div>
              {score && (
                <div className="text-yellow-300 font-bold text-lg">
                  {score.toLocaleString()} pts
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white transition-colors ml-2 hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreAchievementNotification;