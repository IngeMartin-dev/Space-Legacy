import React, { useState, useEffect } from 'react';
import { Shield, Clock, LogOut, AlertTriangle, X } from 'lucide-react';

const BanScreen = ({ banData, onCloseSession }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isPermanent, setIsPermanent] = useState(false);

  useEffect(() => {
    if (banData) {
      console.log(`🚫 PANTALLA DE BAN MOSTRADA: Usuario ${banData.isKickOnly ? 'expulsado' : 'baneado'} por "${banData.bannedBy}"`);
      console.log(`🚫 Razón: ${banData.reason}`);
      console.log(`🚫 Tipo: ${banData.isKickOnly ? 'EXPULSIÓN' : (banData.isPermanent ? 'PERMANENTE' : 'TEMPORAL')}`);

      setIsPermanent(banData.isPermanent || !banData.banEnd);

      if (!banData.isPermanent && banData.banEnd) {
        const calculateTimeLeft = () => {
          const now = new Date().getTime();
          const banEnd = new Date(banData.banEnd).getTime();
          const difference = banEnd - now;

          if (difference > 0) {
            const minutes = Math.floor(difference / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            setTimeLeft({ minutes, seconds });
          } else {
            setTimeLeft(null);
            // Ban has expired, close the screen
            onCloseSession();
          }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [banData, onCloseSession]);

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
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] font-orbitron backdrop-blur-sm">
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-purple-900 rounded-3xl p-8 border-2 border-red-500/50 shadow-2xl shadow-red-500/30 max-w-lg w-full mx-4 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close button in top-right corner */}
        <button
          onClick={onCloseSession}
          className="absolute top-4 right-4 text-red-300 hover:text-red-100 transition-colors z-10"
          title="Cerrar"
        >
          <X size={24} />
        </button>
        {/* Animated background particles */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-2 h-2 bg-red-400 rounded-full animate-float opacity-60"></div>
          <div className="absolute top-20 right-20 w-3 h-3 bg-orange-400 rounded-full animate-float-delayed opacity-50"></div>
          <div className="absolute bottom-20 left-20 w-2 h-2 bg-yellow-400 rounded-full animate-bounce-slow opacity-70"></div>
          <div className="absolute bottom-10 right-10 w-4 h-4 bg-red-300 rounded-full animate-float opacity-40"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="mb-8">
            <div className="relative inline-block">
              <Shield className="mx-auto text-red-400 animate-pulse drop-shadow-lg" size={80} />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent animate-glow">
              {banData?.isKickOnly ? 'EXPULSADO DE LA SALA' : 'CUENTA BANEADA'}
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
          </div>

          <div className="bg-gradient-to-br from-black/40 to-red-900/20 rounded-2xl p-6 mb-6 border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="text-yellow-400 mr-3 animate-bounce" size={24} />
              <span className="text-yellow-400 font-bold text-lg">
                {banData?.isKickOnly ? 'MOTIVO DE LA EXPULSIÓN:' : 'MOTIVO DEL BAN:'}
              </span>
            </div>
            <p className="text-white text-center text-lg leading-relaxed">
              {banData?.reason || (banData?.isKickOnly ? 'Expulsado de la sala por el anfitrión' : 'Violación de las reglas del juego')}
            </p>
          </div>

          {isPermanent && !banData?.isKickOnly ? (
            <div className="bg-gradient-to-br from-red-900/60 to-black/40 rounded-2xl p-6 mb-6 border border-red-500/40 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Clock className="text-red-400 mr-3" size={28} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-red-400 font-bold text-xl">BAN PERMANENTE</span>
              </div>
              <div className="text-2xl font-bold text-white mb-3">🚫 INDEFINIDO</div>
              <p className="text-gray-300 text-center text-sm leading-relaxed">
                Tu cuenta ha sido baneada permanentemente del juego
              </p>
            </div>
          ) : banData?.isKickOnly ? (
            <div className="bg-gradient-to-br from-orange-900/60 to-black/40 rounded-2xl p-6 mb-6 border border-orange-500/40 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Clock className="text-orange-400 mr-3 animate-pulse" size={28} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-orange-400 font-bold text-xl">EXPULSADO</span>
              </div>
              <div className="text-2xl font-bold text-white mb-3">🚷 DE LA SALA</div>
              <p className="text-gray-300 text-center text-sm leading-relaxed">
                Has sido removido de la sala multijugador por el anfitrión
              </p>
            </div>
          ) : timeLeft ? (
            <div className="bg-gradient-to-br from-orange-900/60 to-black/40 rounded-2xl p-6 mb-6 border border-orange-500/40 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                <Clock className="text-orange-400 mr-3 animate-pulse" size={28} />
                <span className="text-orange-400 font-bold text-xl">TIEMPO RESTANTE</span>
              </div>
              <div className="text-5xl font-bold text-white mb-3 font-mono animate-pulse bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {formatTime(timeLeft)}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((timeLeft.minutes * 60 + timeLeft.seconds) / (banData?.banEnd ? (new Date(banData.banEnd) - new Date(banData.banStart || Date.now())) / 1000 : 3600) * 100)))}%`
                  }}
                ></div>
              </div>
              <p className="text-gray-300 text-center text-sm leading-relaxed">
                El ban expirará automáticamente cuando llegue a cero
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-900/60 to-black/40 rounded-2xl p-6 mb-6 border border-green-500/40 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                <Clock className="text-green-400 mr-3" size={28} />
                <span className="text-green-400 font-bold text-xl">BAN EXPIRADO</span>
              </div>
              <div className="text-2xl font-bold text-white mb-3">✅ LIBRE</div>
              <p className="text-gray-300 text-center text-sm leading-relaxed">
                Tu ban ha expirado. Puedes volver a jugar normalmente.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={onCloseSession}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 transform hover:scale-105 shadow-xl shadow-red-500/40 flex items-center justify-center space-x-3 border border-red-500/30"
            >
              <LogOut size={24} />
              <span>VOLVER AL MENÚ PRINCIPAL</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </button>

            {banData?.bannedBy && (
              <div className="bg-black/30 rounded-xl p-4 border border-gray-600/30">
                <p className="text-gray-400 text-sm text-center">
                  <span className="text-gray-500">{banData?.isKickOnly ? 'Expulsado por:' : 'Baneado por:'}</span>
                  <span className="text-white font-semibold ml-2">{banData.bannedBy}</span>
                </p>
                {banData?.banStart && !banData?.isKickOnly && (
                  <p className="text-gray-500 text-xs text-center mt-2">
                    Fecha del ban: {new Date(banData.banStart).toLocaleString()}
                  </p>
                )}
                {banData?.isKickOnly && (
                  <p className="text-gray-500 text-xs text-center mt-2">
                    Espera un momento antes de intentar unirte a otra sala
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanScreen;