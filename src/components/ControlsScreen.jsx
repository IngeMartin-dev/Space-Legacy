// START OF FILE ControlsScreen.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Keyboard, Gamepad2, Zap, Star, Sparkles, Gamepad } from 'lucide-react';

const ControlsScreen = ({ onBack, controls, onUpdateControls }) => {
  const [localControls, setLocalControls] = useState(controls);
  const [remapping, setRemapping] = useState(null);

  useEffect(() => {
    // Deep copy controls to avoid direct mutation issues if they are nested objects
    setLocalControls(JSON.parse(JSON.stringify(controls))); 
  }, [controls]);

  const handleRemapClick = (playerKey, control) => {
    setRemapping({ player: playerKey, control });
  };

  const handleSaveChanges = () => {
    onUpdateControls(localControls);
    onBack();
  };

  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      if (remapping) {
        e.preventDefault();
        // Prevent remapping to 'P' (Pause) or 'Escape' (Back/Cancel)
        // These keys have critical functions and should not be remapped.
        if (e.code === 'KeyP' || e.code === 'Escape') {
          setRemapping(null);
          return;
        }

        const { player, control } = remapping;
        setLocalControls(prev => ({
          ...prev,
          [player]: {
            ...prev[player],
            [control]: e.code
          }
        }));
        setRemapping(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyPress);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [remapping]);

  const playerLabels = ['Jugador 1 (Individual & Multi)', 'Jugador 2 (Local)', 'Jugador 3 (Local)', 'Jugador 4 (Local)'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron relative overflow-hidden">
      {/* Animated Background - Same as LoginScreen */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30"></div>
      
      {/* Animated Stars and Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-blue-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-purple-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-twinkle-delayed"></div>
        {/* Additional decorative elements */}
        <div className="absolute top-20 left-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-pink-400 rounded-full animate-bounce-slow opacity-70"></div>
        <div className="absolute top-1/3 right-10 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-80"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-float-delayed opacity-50"></div>
        {/* Sparkle effects */}
        <div className="absolute top-40 right-1/4">
          <Sparkles className="w-4 h-4 text-yellow-300 animate-spin opacity-30" />
        </div>
        <div className="absolute bottom-60 left-1/2">
          <Star className="w-3 h-3 text-blue-300 animate-pulse opacity-40" />
        </div>
      </div>

      <button onClick={handleSaveChanges} className="absolute top-8 left-8 flex items-center space-x-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl shadow-green-500/30 border border-green-400/30 backdrop-blur-sm">
        <ArrowLeft size={20} className="animate-pulse" />
        <span className="font-bold">GUARDAR Y VOLVER</span>
        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
      </button>

      <div className="text-center mb-8 relative">
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Zap className="w-8 h-8 text-yellow-400 animate-bounce opacity-60" />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-glow relative">
          CONTROLES
          <div className="absolute -top-2 -right-8">
            <Gamepad className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
        </h1>
        <div className="flex items-center justify-center space-x-2 text-gray-300 bg-black/20 rounded-full px-6 py-3 backdrop-blur-sm border border-purple-500/30">
          <Keyboard size={24} className="text-blue-400" />
          <span className="font-semibold">Haz clic en una tecla para cambiarla</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-black/60 via-purple-900/40 to-indigo-900/40 rounded-3xl p-8 w-full max-w-5xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30 backdrop-blur-sm relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-4 right-4 w-16 h-16 bg-purple-400/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-indigo-400/10 rounded-full blur-lg animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-400/10 rounded-full blur-md animate-bounce-slow"></div>
        </div>

        <div className="relative z-10 max-h-[calc(100vh-300px)] overflow-y-auto pr-4 grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
          {Object.keys(localControls || {}).map((playerKey, index) => (
            <div key={playerKey} className="bg-gradient-to-br from-purple-800/40 to-indigo-800/40 rounded-2xl p-6 border border-purple-400/30 shadow-xl backdrop-blur-sm hover:shadow-purple-400/20 transition-all duration-300 relative overflow-hidden group">
              {/* Card background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>

              <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg animate-float">
                  <Gamepad2 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                    {playerLabels[index]}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${index === 0 ? 'bg-blue-400' : index === 1 ? 'bg-green-400' : index === 2 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                    <span className="text-xs text-gray-400">Activo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-300 font-semibold">Izquierda:</span>
                    </div>
                    <button
                      onClick={() => handleRemapClick(playerKey, 'left')}
                      className={`px-4 py-2 rounded-lg font-mono min-w-32 text-center transition-all duration-300 transform hover:scale-105 shadow-md relative overflow-hidden ${
                        remapping?.player === playerKey && remapping.control === 'left'
                          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-black animate-pulse border-2 border-yellow-300 shadow-yellow-400/50'
                          : 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 border border-gray-500/30 hover:border-purple-400/50'
                      }`}
                    >
                      {remapping?.player === playerKey && remapping.control === 'left' ? (
                        <span className="flex items-center space-x-2 relative z-10">
                          <Zap className="w-4 h-4 animate-bounce" />
                          <span className="font-bold">ESPERANDO...</span>
                        </span>
                      ) : (
                        <span className="relative z-10">{localControls[playerKey]?.left || 'N/A'}</span>
                      )}
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Presiona la tecla deseada</p>
                </div>

                <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 font-semibold">Derecha:</span>
                    </div>
                    <button
                      onClick={() => handleRemapClick(playerKey, 'right')}
                      className={`px-4 py-2 rounded-lg font-mono min-w-32 text-center transition-all duration-300 transform hover:scale-105 shadow-md relative overflow-hidden ${
                        remapping?.player === playerKey && remapping.control === 'right'
                          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-black animate-pulse border-2 border-yellow-300 shadow-yellow-400/50'
                          : 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 border border-gray-500/30 hover:border-green-400/50'
                      }`}
                    >
                      {remapping?.player === playerKey && remapping.control === 'right' ? (
                        <span className="flex items-center space-x-2 relative z-10">
                          <Zap className="w-4 h-4 animate-bounce" />
                          <span className="font-bold">ESPERANDO...</span>
                        </span>
                      ) : (
                        <span className="relative z-10">{localControls[playerKey]?.right || 'N/A'}</span>
                      )}
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Presiona la tecla deseada</p>
                </div>

                <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-red-300 font-semibold">Disparo:</span>
                    </div>
                    <button
                      onClick={() => handleRemapClick(playerKey, 'shoot')}
                      className={`px-4 py-2 rounded-lg font-mono min-w-32 text-center transition-all duration-300 transform hover:scale-105 shadow-md relative overflow-hidden ${
                        remapping?.player === playerKey && remapping.control === 'shoot'
                          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-black animate-pulse border-2 border-yellow-300 shadow-yellow-400/50'
                          : 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 hover:from-red-600 hover:via-pink-600 hover:to-purple-600 border border-gray-500/30 hover:border-red-400/50'
                      }`}
                    >
                      {remapping?.player === playerKey && remapping.control === 'shoot' ? (
                        <span className="flex items-center space-x-2 relative z-10">
                          <Zap className="w-4 h-4 animate-bounce" />
                          <span className="font-bold">ESPERANDO...</span>
                        </span>
                      ) : (
                        <span className="relative z-10">{localControls[playerKey]?.shoot || 'N/A'}</span>
                      )}
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Presiona la tecla deseada</p>
                </div>
              </div>

              {/* Player indicator */}
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <div className="flex items-center justify-center space-x-2 text-sm text-purple-300">
                  <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-400' : index === 1 ? 'bg-green-400' : index === 2 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span>Jugador {index + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlsScreen;
// END OF FILE ControlsScreen.jsx