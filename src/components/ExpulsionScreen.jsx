import React, { useState, useEffect } from 'react';
import { Shield, Clock, LogOut, AlertTriangle, ArrowLeft } from 'lucide-react';

const ExpulsionScreen = ({ expulsionData, onBackToMenu, user }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isPermanent, setIsPermanent] = useState(false);

  useEffect(() => {
    if (expulsionData) {
      console.log(`🚫 PANTALLA DE EXPULSIÓN COMPLETA MOSTRADA: Usuario ${expulsionData.isBan ? 'baneado' : 'expulsado'}`);
      console.log(`🚫 Razón: ${expulsionData.reason}`);
      console.log(`🚫 Tipo: ${expulsionData.isBan ? (expulsionData.banData?.isPermanent ? 'PERMANENTE' : 'TEMPORAL') : 'EXPULSIÓN'}`);

      setIsPermanent(expulsionData.isBan && expulsionData.banData?.isPermanent);

      if (expulsionData.isBan && !expulsionData.banData?.isPermanent && expulsionData.banData?.banEnd) {
        const calculateTimeLeft = () => {
          const now = new Date().getTime();
          const banEnd = new Date(expulsionData.banData.banEnd).getTime();
          const difference = banEnd - now;

          if (difference > 0) {
            const minutes = Math.floor(difference / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            setTimeLeft({ minutes, seconds });
          } else {
            setTimeLeft(null);
            // Ban has expired, allow return to menu
            onBackToMenu();
          }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [expulsionData, onBackToMenu]);

  const formatTime = (time) => {
    if (!time) return '';
    const hours = Math.floor(time.minutes / 60);
    const mins = time.minutes % 60;
    const secs = time.seconds;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron relative overflow-hidden">
      {/* Animated Background - Same as other screens */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30"></div>

      {/* Animated Stars */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-blue-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-purple-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-twinkle-delayed"></div>
        {/* Additional floating elements */}
        <div className="absolute top-20 right-10 w-3 h-3 bg-yellow-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-pink-400 rounded-full animate-float-delayed opacity-70"></div>
        <div className="absolute top-1/2 left-10 w-1 h-1 bg-cyan-400 rounded-full animate-bounce-slow opacity-80"></div>
      </div>

      <button
        onClick={onBackToMenu}
        className="absolute top-8 left-8 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors transform focus:outline-none focus:ring-2 shadow-md z-10 bg-gray-600 hover:bg-gray-700 hover:scale-105 focus:ring-gray-400"
      >
        <ArrowLeft size={20} />
        <span>VOLVER AL MENÚ</span>
      </button>

      <div className="relative z-10 text-center max-w-2xl w-full animate-slide-up">
        <div className="mb-8">
          <div className="relative inline-block">
            <Shield className="mx-auto text-red-400 animate-pulse drop-shadow-lg" size={100} />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full animate-ping"></div>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent animate-glow">
            {expulsionData?.isBan ? 'CUENTA BANEADA' : 'EXPULSADO DE LA SALA'}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
        </div>

        <div className="bg-gradient-to-br from-black/40 to-red-900/20 rounded-3xl p-8 mb-8 border border-red-500/30 backdrop-blur-sm shadow-2xl shadow-red-500/20">
          <div className="flex items-center justify-center mb-6">
            <AlertTriangle className="text-yellow-400 mr-3 animate-bounce" size={32} />
            <span className="text-yellow-400 font-bold text-2xl">
              {expulsionData?.isBan ? 'MOTIVO DEL BAN:' : 'MOTIVO DE LA EXPULSIÓN:'}
            </span>
          </div>
          <p className="text-white text-center text-xl leading-relaxed mb-6">
            {expulsionData?.reason || (expulsionData?.isBan ? 'Violación de las reglas del juego' : 'Expulsado de la sala por el anfitrión')}
          </p>

          {expulsionData?.hostName && (
            <div className="flex items-center justify-center mb-6">
              <div className="text-2xl">👑</div>
              <span className="text-red-400 font-bold text-xl ml-3">
                {expulsionData?.isBan ? 'Baneado por:' : 'Expulsado por:'}
              </span>
              <span className="text-white font-bold text-xl ml-2">{expulsionData.hostName}</span>
            </div>
          )}
        </div>

        {isPermanent && expulsionData?.isBan ? (
          <div className="bg-gradient-to-br from-red-900/60 to-black/40 rounded-3xl p-8 mb-8 border border-red-500/40 backdrop-blur-sm shadow-2xl shadow-red-500/20">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Clock className="text-red-400 mr-3" size={36} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-red-400 font-bold text-3xl">BAN PERMANENTE</span>
            </div>
            <div className="text-6xl font-bold text-white mb-4 animate-pulse bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              🚫 INDEFINIDO
            </div>
            <p className="text-gray-300 text-center text-lg leading-relaxed">
              Tu cuenta ha sido baneada permanentemente del juego
            </p>
          </div>
        ) : expulsionData?.isBan && timeLeft ? (
          <div className="bg-gradient-to-br from-orange-900/60 to-black/40 rounded-3xl p-8 mb-8 border border-orange-500/40 backdrop-blur-sm shadow-2xl shadow-orange-500/20">
            <div className="flex items-center justify-center mb-6">
              <Clock className="text-orange-400 mr-3 animate-pulse" size={36} />
              <span className="text-orange-400 font-bold text-3xl">TIEMPO RESTANTE</span>
            </div>
            <div className="text-7xl font-bold text-white mb-4 font-mono animate-pulse bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {formatTime(timeLeft)}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.max(0, Math.min(100, ((timeLeft.minutes * 60 + timeLeft.seconds) / (expulsionData?.banData ? (new Date(expulsionData.banData.banEnd) - new Date(expulsionData.banData.banStart || Date.now())) / 1000 : 3600) * 100)))}%`
                }}
              ></div>
            </div>
            <p className="text-gray-300 text-center text-lg leading-relaxed">
              El ban expirará automáticamente cuando llegue a cero
            </p>
          </div>
        ) : !expulsionData?.isBan ? (
          <div className="bg-gradient-to-br from-orange-900/60 to-black/40 rounded-3xl p-8 mb-8 border border-orange-500/40 backdrop-blur-sm shadow-2xl shadow-orange-500/20">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Clock className="text-orange-400 mr-3 animate-pulse" size={36} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-orange-400 font-bold text-3xl">EXPULSADO</span>
            </div>
            <div className="text-6xl font-bold text-white mb-4 animate-pulse bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              🚷 DE LA SALA
            </div>
            <p className="text-gray-300 text-center text-lg leading-relaxed">
              Has sido removido de la sala multijugador por el anfitrión
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-900/60 to-black/40 rounded-3xl p-8 mb-8 border border-green-500/40 backdrop-blur-sm shadow-2xl shadow-green-500/20">
            <div className="flex items-center justify-center mb-6">
              <Clock className="text-green-400 mr-3" size={36} />
              <span className="text-green-400 font-bold text-3xl">BAN EXPIRADO</span>
            </div>
            <div className="text-6xl font-bold text-white mb-4 animate-pulse bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              ✅ LIBRE
            </div>
            <p className="text-gray-300 text-center text-lg leading-relaxed">
              Tu ban ha expirado. Puedes volver a jugar normalmente.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={onBackToMenu}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-12 py-6 rounded-2xl font-bold text-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 transform hover:scale-105 shadow-2xl shadow-red-500/40 flex items-center justify-center space-x-4 border border-red-500/30"
          >
            <LogOut size={32} />
            <span>VOLVER AL MENÚ PRINCIPAL</span>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </button>

          {!expulsionData?.isBan && (
            <p className="text-red-200 text-lg animate-fade-in">
              Puedes intentar unirte a otra sala o crear una nueva
            </p>
          )}

          {expulsionData?.banData?.banStart && expulsionData?.isBan && (
            <div className="bg-black/30 rounded-2xl p-6 border border-gray-600/30">
              <p className="text-gray-400 text-center text-sm">
                <span className="text-gray-500">Fecha del ban:</span>
                <span className="text-white font-semibold ml-2">
                  {new Date(expulsionData.banData.banStart).toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpulsionScreen;
