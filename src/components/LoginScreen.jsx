import React, { useState, useEffect } from 'react';
import { User, Lock, Loader } from 'lucide-react';
import RegisterModal from './RegisterModal';
import { userService } from '../lib/supabase';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [kickedUntil, setKickedUntil] = useState(null);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [heartParts, setHeartParts] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    // Check if user is temporarily banned
    const kickData = localStorage.getItem(`adminKick_${username}`);
    if (kickData) {
      try {
        const parsed = JSON.parse(kickData);
        if (parsed.kickedUntil && Date.now() < parsed.kickedUntil) {
          setKickedUntil(parsed.kickedUntil);
        } else {
          localStorage.removeItem(`adminKick_${username}`);
        }
      } catch (e) {
        localStorage.removeItem(`adminKick_${username}`);
      }
    }
  }, [username]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Check if user is temporarily banned
    const currentKickData = localStorage.getItem(`adminKick_${username}`);
    if (currentKickData) {
      try {
        const parsed = JSON.parse(currentKickData);
        if (parsed.kickedUntil && Date.now() < parsed.kickedUntil) {
      const remainingTime = Math.ceil((kickedUntil - Date.now()) / 60000);
      setError(`Has sido expulsado por el admin. Tiempo restante: ${remainingTime} minutos`);
      return;
        }
      } catch (e) {
        localStorage.removeItem(`adminKick_${username}`);
      }
    }

    setIsLoading(true);
    setError('');

    try {
      // Check for admin credentials first
      const isAdmin = (username === 'admin' && password === 'admin123') ||
                     (username === 'oviedoromeromartinelias' && password === 'admin123');

      if (isAdmin) {
        // Create admin user data
        const adminUserData = {
          username,
          password,
          email: username === 'oviedoromeromartinelias' ? 'oviedoromeromartinelias@gmail.com' : null,
          isAdmin: true,
          isSpecialAdmin: username === 'oviedoromeromartinelias',
          coins: 999999,
          unlockedShips: ['ship1', 'ship2', 'ship3', 'ship4', 'admin1', 'admin2'],
          equippedShip: username === 'oviedoromeromartinelias' ? 'admin2' : 'admin1',
          unlockedUpgrades: ['doubleCoins', 'healthRegen', 'bulletPierce'],
          equippedUpgrade: 'doubleCoins',
          unlockedPets: ['autoShooterPet', 'magnetPet'],
          equippedPet: 'autoShooterPet',
          avatar: username === 'oviedoromeromartinelias' ? '💖' : '👑',
          settings: {
            noclip: false,
            superSpeed: false,
            rapidFire: false,
            customFireRate: 10,
            rainbowMode: username === 'oviedoromeromartinelias',
            autoSave: true
          },
          petLevels: {}
        };

        // Save admin data to Supabase
        await userService.upsertUser(adminUserData);
        onLogin(adminUserData);
      } else if (username.trim() && password.trim()) {
        // Try to get existing user from Supabase
        // First try as email, then as username
        let existingUser = null;
        try {
          console.log('🔍 Buscando usuario:', username);
          // Try email first
          existingUser = await userService.getUserByEmail(username, password);
          console.log('📧 Búsqueda por email:', existingUser ? 'ENCONTRADO' : 'NO ENCONTRADO');

          if (!existingUser) {
            // If not found as email, try as username
            existingUser = await userService.getUser(username, password);
            console.log('👤 Búsqueda por usuario:', existingUser ? 'ENCONTRADO' : 'NO ENCONTRADO');
          }
        } catch (error) {
          console.log('❌ Error al buscar usuario:', error);
        }

        if (existingUser) {
          // Load existing user data
          const userData = {
            username: existingUser.username,
            email: existingUser.email,
            password: existingUser.password,
            isAdmin: existingUser.is_admin || false,
            isSpecialAdmin: existingUser.is_special_admin || false,
            coins: existingUser.coins || 0,
            unlockedShips: existingUser.unlocked_ships || ['ship1'],
            equippedShip: existingUser.equipped_ship || 'ship1',
            unlockedUpgrades: existingUser.unlocked_upgrades || [],
            equippedUpgrade: existingUser.equipped_upgrade,
            unlockedPets: existingUser.unlocked_pets || [],
            equippedPet: existingUser.equipped_pet,
            avatar: existingUser.avatar || '👨‍🚀',
            settings: existingUser.settings || {},
            petLevels: existingUser.pet_levels || {}
          };

          onLogin(userData);
        } else {
          // User not found - require registration
          setError('Usuario no encontrado. Por favor regístrate primero.');
          setIsLoading(false);
          return;
        }
      } else {
        setError('Por favor ingresa usuario/correo y contraseña');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Error al iniciar sesión. Verifica tu conexión.');
    }

    setIsLoading(false);
  };

  // Show kick message if user is banned
  if (kickedUntil && Date.now() < kickedUntil) {
    const remainingMinutes = Math.ceil((kickedUntil - Date.now()) / 60000);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-8 font-orbitron relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-black/40"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-red-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
        </div>
        
        <div className="bg-red-900/50 rounded-2xl p-8 w-full max-w-md border-2 border-red-500 shadow-2xl shadow-red-500/50 text-center backdrop-blur-sm relative z-10 animate-pulse">
          <h1 className="text-4xl font-bold mb-4 text-red-400 animate-pulse">¡EXPULSADO!</h1>
          <p className="text-xl mb-4">Has sido expulsado por el administrador</p>
          <p className="text-lg text-yellow-300 mb-6">Tiempo restante: {remainingMinutes} minutos</p>
          <button
            onClick={() => {
              localStorage.removeItem(`adminKick_${username}`);
              setKickedUntil(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron relative overflow-hidden">
      {/* Easter Egg Button - Invisible en esquina inferior izquierda */}
      <button
        onClick={() => setShowEasterEgg(true)}
        className="fixed bottom-4 left-4 w-12 h-12 bg-transparent border-none cursor-pointer z-50"
        style={{ opacity: 0 }}
        aria-label="Easter Egg"
      />
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30"></div>
      
      {/* Animated Stars */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-blue-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-purple-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-20 left-3/4 w-1 h-1 bg-pink-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-cyan-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-1/3 right-10 w-1 h-1 bg-yellow-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-green-300 rounded-full animate-twinkle-delayed"></div>
      </div>

      {/* Flying Spaceships */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Ship 1 - Moving right */}
        <div className="absolute top-1/4 left-0 text-2xl animate-ship-fly-right">
          🚀
        </div>
        
        {/* Ship 2 - Moving left */}
        <div className="absolute top-1/2 right-0 text-xl animate-ship-fly-left transform scale-x-[-1]">
          🛸
        </div>
        
        {/* Ship 3 - Moving diagonal */}
        <div className="absolute bottom-1/3 left-0 text-lg animate-ship-fly-diagonal">
          ✈️
        </div>
        
        {/* Ship 4 - Floating */}
        <div className="absolute top-20 right-1/4 text-sm animate-ship-float">
          🛰️
        </div>
        
        {/* Ship 5 - Another diagonal */}
        <div className="absolute bottom-20 right-0 text-xl animate-ship-fly-diagonal-reverse transform scale-x-[-1]">
          🚁
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-float opacity-70"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-float-delayed opacity-70"></div>
        <div className="absolute bottom-1/4 left-1/4 w-4 h-4 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-float opacity-50"></div>
      </div>

      <div className="text-center mb-12 relative z-10">
        <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4 animate-pulse-glow">
         SPACE LEGACY
        </h1>
        <h2 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-8 animate-text-shimmer">
         HECHO EN HTML
        </h2>
        {/* Glowing orbs around title */}
        <div className="absolute -top-5 -left-5 w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-30"></div>
        <div className="absolute -bottom-5 -right-5 w-8 h-8 bg-purple-500 rounded-full animate-ping opacity-30 animation-delay-1000"></div>
      </div>

      <div className="bg-black/60 rounded-3xl p-10 w-full max-w-md border-2 border-purple-500 shadow-2xl shadow-purple-500/40 transition-all duration-500 hover:shadow-purple-400/60 hover:border-purple-400 backdrop-blur-lg relative z-10 animate-card-glow">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl"></div>
        
        <h3 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-text-shimmer relative">
          INICIAR SESIÓN
        </h3>
        
        <form onSubmit={handleLogin} className="space-y-8 relative">
          <div>
            <label className="block text-sm font-medium mb-3 text-purple-300">Usuario</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 group-hover:text-purple-300 transition-colors" size={22} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-800/80 border-2 border-purple-500/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm"
                placeholder="Usuario o correo electrónico"
                disabled={isLoading}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-purple-300">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 group-hover:text-purple-300 transition-colors" size={22} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/80 border-2 border-purple-500/50 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm"
                placeholder="Ingresa tu contraseña"
                disabled={isLoading}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {error && (
            <div className="bg-red-600/30 border-2 border-red-500 rounded-xl p-4 text-red-300 text-sm backdrop-blur-sm animate-shake">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 px-8 py-4 rounded-xl font-bold text-xl text-white flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={24} />
                <span className="animate-pulse">CARGANDO...</span>
              </>
            ) : (
              <span className="relative z-10">ENTRAR AL ESPACIO</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-purple-300 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <p className="mt-4 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
            🔐 Registro obligatorio - Crea tu cuenta para guardar tu progreso
          </p>
        </div>

        {/* Registration Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
          >
            REGISTRARSE
          </button>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none"></div>
      
      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 font-orbitron">
          <div className="bg-gradient-to-br from-pink-900 to-red-900 rounded-3xl p-12 w-full max-w-2xl border-4 border-pink-500 shadow-2xl shadow-pink-500/50 text-center relative overflow-hidden">
            {/* Animated background hearts */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute text-pink-300 animate-float opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                >
                  💖
                </div>
              ))}
            </div>
            
            <div className="relative z-10">
              <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-400 animate-pulse">
                TE AMO MADE
              </h1>
              
              <h2 className="text-4xl font-bold mb-12 text-white animate-glow">
                ¿QUIERES SER MI NOVIA?
              </h2>
              
              {/* Corazón que se forma parte por parte */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  {heartParts.map((part) => (
                    <circle
                      key={part.id}
                      cx={part.x}
                      cy={part.y}
                      r="4"
                      fill="#ff69b4"
                      className="animate-pulse"
                      style={{
                        filter: 'drop-shadow(0 0 10px #ff1493)',
                        animation: `heartbeat 1s ease-in-out infinite ${part.delay}ms`
                      }}
                    />
                  ))}
                  
                  {/* Corazón completo cuando todas las partes están */}
                  {heartParts.length >= 10 && (
                    <path
                      d="M60,105 C60,105 20,65 20,45 C20,25 40,25 60,45 C80,25 100,25 100,45 C100,65 60,105 60,105 Z"
                      fill="none"
                      stroke="#ff1493"
                      strokeWidth="3"
                      className="animate-pulse"
                      style={{
                        filter: 'drop-shadow(0 0 20px #ff69b4)',
                        animation: 'heartGlow 2s ease-in-out infinite'
                      }}
                    />
                  )}
                </svg>
              </div>
              
              <div className="flex justify-center space-x-8">
                <button
                  onClick={() => {
                    setShowEasterEgg(false);
                    setHeartParts([]);
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-4 rounded-xl font-bold text-2xl text-white transition-all duration-300 transform hover:scale-110 shadow-lg shadow-green-500/50"
                >
                  SÍ 💖
                </button>
                <button
                  onClick={() => {
                    setShowEasterEgg(false);
                    setHeartParts([]);
                  }}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-4 rounded-xl font-bold text-2xl text-white transition-all duration-300 transform hover:scale-110 shadow-lg shadow-red-500/50"
                >
                  TAMBIÉN SÍ 💕
                </button>
              </div>
              
              <p className="text-pink-200 mt-6 text-lg animate-pulse">
                ✨ Con todo mi amor ✨
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onLogin={onLogin}
      />
    </div>
  );
};

export default LoginScreen;