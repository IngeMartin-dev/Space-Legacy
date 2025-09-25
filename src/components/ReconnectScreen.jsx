// START OF FILE ReconnectScreen.jsx
import React from 'react';
import { Wifi, RefreshCw, AlertTriangle } from 'lucide-react';

const ReconnectScreen = ({ onForceReconnect }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 font-orbitron">
      <div className="bg-gradient-to-br from-gray-900 to-red-900 rounded-2xl p-8 w-full max-w-md border-2 border-red-500 shadow-2xl shadow-red-500/50 animate-pulse transform">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Wifi className="text-red-400 animate-bounce" size={64} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 animate-glow">RECONECTANDO...</h2>
          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <RefreshCw className="text-yellow-400 animate-spin" size={20} />
              <p className="text-yellow-300 text-lg">Intentando reconectar al servidor</p>
            </div>
            <p className="text-gray-300 text-sm">
              Se perdió la conexión con el servidor de juego. 
              Reintentando automáticamente...
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse shadow-lg" style={{ width: '60%' }}></div>
            </div>
            
            <button
              onClick={onForceReconnect}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 mx-auto transform hover:scale-105 shadow-lg shadow-blue-900/40"
            >
              <RefreshCw size={20} />
              <span>FORZAR RECONEXIÓN</span>
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
            <AlertTriangle size={16} />
            <span>Verifica tu conexión a internet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReconnectScreen;
// END OF FILE ReconnectScreen.jsx