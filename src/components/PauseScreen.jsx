// START OF FILE PauseScreen.jsx
import React from 'react';
import { Play, Settings, Home, Shield } from 'lucide-react'; // Import Shield for admin icon

const PauseScreen = ({ onResume, onSettings, onMainMenu, gameState, user }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 font-orbitron">
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl p-8 w-full max-w-md border border-purple-500 shadow-2xl shadow-purple-500/20"> {/* Enhanced styling */}
        <h1 className="text-4xl font-bold mb-8 text-center text-red-400 animate-glow"> {/* Red glow effect */}
          JUEGO EN PAUSA
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg text-xl font-semibold transition-colors transform hover:scale-105 shadow-lg shadow-green-900/40" 
          >
            <Play size={24} />
            <span>CONTINUAR</span>
          </button>
          
          {/* Settings button, leads to Admin Panel if user is admin */}
          {user?.isAdmin && ( // Only show settings if admin
            <button
              onClick={onSettings}
              className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg text-xl font-semibold transition-colors transform hover:scale-105 shadow-lg shadow-blue-900/40" 
            >
              <Settings size={24} />
              <span>CONFIGURACIÓN</span>
            </button>
          )}

          <button
            onClick={onMainMenu}
            className="w-full flex items-center justify-center space-x-3 bg-red-600 hover:bg-red-700 px-6 py-4 rounded-lg text-xl font-semibold transition-colors transform hover:scale-105 shadow-lg shadow-red-900/40" 
          >
            <Home size={24} />
            <span>MENÚ PRINCIPAL</span>
          </button>
        </div>

        {user?.isAdmin && (
          <div className="mt-4 text-center text-sm text-yellow-400 flex items-center justify-center space-x-2 animate-pulse-slow"> {/* Added animation and icon */}
            <Shield size={16} className="text-yellow-300" />
            <p>MODO ADMIN ACTIVO</p>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Puntuación: {gameState.score.toLocaleString()}</p>
          <p>Nivel: {gameState.level}</p>
          <p>Vidas: {'❤️'.repeat(gameState.lives)}</p>
        </div>
      </div>
    </div>
  );
};

export default PauseScreen;
// END OF FILE PauseScreen.jsx