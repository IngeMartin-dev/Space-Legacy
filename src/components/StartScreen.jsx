// START OF FILE StartScreen.jsx
import React, { useState, useEffect } from 'react';
import { Gamepad2, Users, Trophy, Settings, Zap, Shield, LogOut, Globe, User } from 'lucide-react'; // Import User for the icon

const StartScreen = ({
  user,
  onStartSingle,
  onStartLocalMultiplayer,
  onStartMultiplayer,
  onShowShop,
  onShowControls,
  onShowHighScores,
  onShowAdminPanel,
  onLogout,
  onCustomizeUser, // New prop for user customization
  showAdminPanel = false // Add prop to know if admin panel is open
}) => {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [heartParts, setHeartParts] = useState([]);

  // Easter Egg Effect
  useEffect(() => {
    if (showEasterEgg) {
      // Generar partes del corazón progresivamente
      const heartPositions = [
        { x: 50, y: 30, delay: 0 },
        { x: 70, y: 30, delay: 200 },
        { x: 40, y: 45, delay: 400 },
        { x: 60, y: 45, delay: 600 },
        { x: 80, y: 45, delay: 800 },
        { x: 35, y: 60, delay: 1000 },
        { x: 85, y: 60, delay: 1200 },
        { x: 30, y: 75, delay: 1400 },
        { x: 90, y: 75, delay: 1600 },
        { x: 60, y: 90, delay: 1800 }
      ];

      heartPositions.forEach((pos, index) => {
        setTimeout(() => {
          setHeartParts(prev => [...prev, { ...pos, id: index }]);
        }, pos.delay);
      });

      // Auto cerrar después de 20 segundos
      const timer = setTimeout(() => {
        setShowEasterEgg(false);
        setHeartParts([]);
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, [showEasterEgg]);
  
  return (

    <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron animate-fade-in relative overflow-hidden ${showAdminPanel ? 'pointer-events-none' : ''}`}>
      {/* Animated Background - Same as LoginScreen */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30"></div>
      
      {/* Animated Stars */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-blue-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-purple-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-20 left-3/4 w-1 h-1 bg-pink-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-cyan-300 rounded-full animate-twinkle-delayed"></div>
      </div>

      {/* Flying Spaceships */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 text-2xl animate-ship-fly-right">🚀</div>
        <div className="absolute top-1/2 right-0 text-xl animate-ship-fly-left transform scale-x-[-1]">🛸</div>
        <div className="absolute bottom-1/3 left-0 text-lg animate-ship-fly-diagonal">✈️</div>
      </div>

      {/* User Info - NOW CLICKABLE */}
      <button
        onClick={onCustomizeUser} // Add onClick for customization
        className={`absolute top-8 left-8 bg-black/60 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3 transition-all hover:bg-black/70 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-500 shadow-lg ${user?.isSpecialAdmin ? 'animate-pulse' : ''} ${showAdminPanel ? 'opacity-0 pointer-events-none' : 'z-10'}`}
      >
        <div className={`text-2xl ${user?.isSpecialAdmin ? 'animate-pulse' : ''}`}>{user?.avatar || '👨‍🚀'}</div>
        <div>
          <div className={`font-bold ${user?.isAdmin ? 'text-yellow-400' : 'text-white'}`}>
            {user?.username || 'Invitado'} {/* Use username */}
            {user?.isSpecialAdmin && <span className="text-xs ml-2 bg-pink-600 px-2 py-1 rounded animate-pulse">ADMIN ESPECIAL 💖</span>}
            {user?.isAdmin && !user?.isSpecialAdmin && <span className="text-xs ml-2 bg-yellow-600 px-2 py-1 rounded">ADMIN</span>}
          </div>
          <div className="text-sm text-gray-300">Monedas: {user?.isAdmin ? '∞' : (user?.coins || 0).toLocaleString()}</div>
        </div>
      </button>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className={`absolute top-8 right-8 flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors transform hover:scale-105 shadow-md ${showAdminPanel ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <LogOut size={20} />
        <span>SALIR</span>
      </button>

      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-glow">
         SPACE LEGACY
        </h1>
        <h2 className="text-2xl md:text-4xl font-semibold text-green-400 mb-8">
          Defiende la galaxia contra invasores alienígenas
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Hecho por <span className="font-bold text-yellow-400">Martin Oviedo</span>
        </p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-opacity duration-300 ${showAdminPanel ? 'opacity-0 pointer-events-none' : ''}`}>
        <button
          onClick={onStartSingle}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-4 px-8 py-6 rounded-2xl text-white font-bold transition-all transform hover:scale-105"
        >
          <Gamepad2 size={32} />
          <span className="text-xl font-semibold">JUEGO INDIVIDUAL</span>
        </button>

        <button
          onClick={onStartLocalMultiplayer}
          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 flex items-center space-x-4 px-8 py-6 rounded-2xl text-white font-bold transition-all transform hover:scale-105"
        >
          <Users size={32} />
          <span className="text-xl font-semibold">MULTIJUGADOR LOCAL</span>
        </button>

        <button
          onClick={onStartMultiplayer}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center space-x-4 px-8 py-6 rounded-2xl text-white font-bold transition-all transform hover:scale-105"
        >
          <Globe size={32} />
          <span className="text-xl font-semibold">MULTIJUGADOR ONLINE</span>
        </button>
      </div>

      <div className={`flex flex-wrap justify-center gap-4 transition-opacity duration-300 ${showAdminPanel ? 'opacity-0 pointer-events-none' : ''}`}>
        <button
          onClick={onShowShop}
          className="bg-yellow-600 hover:bg-yellow-700 flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold transition-all transform hover:scale-105"
        >
          <Zap size={20} />
          <span>TIENDA</span>
        </button>

        <button
          onClick={onShowHighScores}
          className="bg-orange-600 hover:bg-orange-700 flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold transition-all transform hover:scale-105"
        >
          <Trophy size={20} />
          <span>PUNTUACIONES</span>
        </button>

        <button
          onClick={onShowControls}
          className="bg-gray-600 hover:bg-gray-700 flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold transition-all transform hover:scale-105"
        >
          <Settings size={20} />
          <span>CONTROLES</span>
        </button>

        {user?.isAdmin && (
          <button
            onClick={onShowAdminPanel}
            className="bg-red-600 hover:bg-red-700 flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold transition-all transform hover:scale-105 animate-pulse"
          >
            <Shield size={20} />
            <span>ADMIN</span>
          </button>
        )}
      </div>

      <div className={`absolute bottom-4 left-4 text-xs text-gray-500 transition-opacity duration-300 ${showAdminPanel ? 'opacity-0' : ''}`}>
        <p>Presiona P para pausar durante el juego</p>
      </div>
    </div>

  );
};

export default StartScreen;
// END OF FILE StartScreen.jsx