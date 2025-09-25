// START OF FILE GameHUD.jsx
import React from 'react';
import { Pause, Heart, Coins, Zap, Shield, Gauge, Clock, Star } from 'lucide-react';

const GameHUD = ({ gameState, players, user, onPause }) => {
  const { score, level, isMultiplayer } = gameState;
  const currentPlayer = players.find(p => p.isLocal) || players[0];
  const totalScore = isMultiplayer ? players.reduce((acc, p) => acc + (p.score || 0), 0) : score;

  return (
    <div className="absolute top-0 left-0 w-full p-4 z-10 font-orbitron">
      <div className="flex justify-between items-start">
        {/* Left Section: Score, Global Coins, Players */}
        <div className="space-y-2">
          {/* Total Score */}
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500 shadow-md">
            <div className="text-yellow-400 font-bold text-lg flex items-center space-x-2">
              <Zap size={20} className="text-yellow-300" />
              <span>PUNTOS: {totalScore.toLocaleString()}</span>
            </div>
          </div>

          {/* Power-up Inventory */}
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500 shadow-md">
            <div className="text-white font-bold text-sm mb-1">POWER-UPS:</div>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <span className="bg-blue-600/50 px-2 py-1 rounded">1:⚡{currentPlayer?.powerupInventory?.rapidFire || 0}</span>
              <span className="bg-blue-600/50 px-2 py-1 rounded">2:🛡️{currentPlayer?.powerupInventory?.shield || 0}</span>
              <span className="bg-blue-600/50 px-2 py-1 rounded">3:💨{currentPlayer?.powerupInventory?.speedBoost || 0}</span>
              <span className="bg-blue-600/50 px-2 py-1 rounded">4:🔱{currentPlayer?.powerupInventory?.tripleShot || 0}</span>
              <span className="bg-blue-600/50 px-2 py-1 rounded">5:⭐{currentPlayer?.powerupInventory?.invincibility || 0}</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">Presiona 1-5 para usar</div>
          </div>

          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500 shadow-md">
            <div className="flex items-center space-x-2 text-green-400 font-bold">
              <Coins size={18} className="text-green-300" />
              <span>MONEDAS: {user.isAdmin ? '∞' : (user.coins || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Multiplayer Players List (if more than 1 player) */}
          {players.length > 1 && (
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500 shadow-md">
              <div className="text-white font-bold text-sm mb-1">JUGADORES:</div>
              {players.map((player) => (
                <div key={player.id} className="flex items-center space-x-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className={player.isLocal ? 'text-blue-400 font-semibold' : 'text-white'}>
                    {player.name}: <span className="text-yellow-300">{(player.score || 0).toLocaleString()}</span>
                  </span>
                  {player.lives <= 0 && <span className="text-red-500 ml-1">(Eliminado)</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center Section: Level */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-2 border border-blue-500 shadow-md">
          <div className="text-center">
            <div className="text-blue-400 font-bold text-xl">NIVEL {level}</div>
          </div>
        </div>

        {/* Right Section: Lives, Pause Button, Admin Mode */}
        <div className="space-y-2">
          {/* Player Lives */}
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-500 shadow-md">
            <div className="flex items-center space-x-2 text-red-400 font-bold">
              <Heart size={18} className="text-red-300" />
              <span>VIDAS: {(() => {
                const lives = currentPlayer?.lives || 0;
                if (!isFinite(lives) || lives < 0) return '0';
                if (lives > 10) return `${lives}`;
                return '❤️'.repeat(Math.min(Math.max(0, Math.floor(lives)), 10));
              })()}</span>
            </div>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500 hover:bg-purple-600/20 transition-colors w-full shadow-md"
          >
            <div className="flex items-center space-x-2 text-white">
              <Pause size={18} />
              <span>PAUSA</span>
            </div>
          </button>

          {/* Admin Mode Indicator */}
          {user.isAdmin && (
            <div className={`backdrop-blur-sm rounded-lg px-4 py-2 border shadow-md ${
              user.isSpecialAdmin
                ? 'bg-gradient-to-r from-pink-800/70 to-purple-800/70 border-pink-500'
                : 'bg-yellow-800/70 border-yellow-500'
            }`}>
              <div className="text-yellow-300 font-bold text-sm mb-1 flex items-center space-x-1">
                <Shield size={16} className="text-yellow-200" />
                <span>{user.isSpecialAdmin ? 'MODO ADMIN ESPECIAL ❤️' : 'MODO ADMIN ACTIVO'}</span>
              </div>
              <div className="text-xs text-white-300">
                {user.settings.noclip && '🛡️ No Clip '}
                {user.settings.rapidFire && '⚡ Disparo Rápido '}
                {user.settings.superSpeed && '🚀 Super Velocidad '}
                {user.settings.rainbowMode && '🌈 Arcoíris '}
                {user.settings.customFireRate && `🎯 ${user.settings.customFireRate}DPS `}
              </div>
            </div>
          )}
          
          {/* Active powerups display */}
          {currentPlayer?.activePowerups && Object.keys(currentPlayer.activePowerups).length > 0 && (
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-500 shadow-md">
              <div className="text-green-400 font-bold text-sm mb-1">POWER-UPS ACTIVOS:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(currentPlayer.activePowerups).map(([type, endTime]) => {
                  if (endTime > Date.now()) {
                    const timeLeft = Math.ceil((endTime - Date.now()) / 1000);
                    const icons = {
                      rapidFire: '⚡',
                      shield: '🛡️',
                      tripleShot: '🔱',
                      speedBoost: '💨',
                      invincibility: '⭐',
                      laser: '🔴',
                      megaBomb: '💥',
                      timeFreeze: '❄️'
                    };
                    return (
                      <span key={type} className="text-xs bg-green-600/50 px-2 py-1 rounded">
                        {icons[type] || '🔥'} {timeLeft}s
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
// END OF FILE GameHUD.jsx