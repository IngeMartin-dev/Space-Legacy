import React, { useState } from 'react';
import { ArrowLeft, Users, Palette } from 'lucide-react';

const PlayerSetupScreen = ({ onBack, onStartGame }) => {
  const [numPlayers, setNumPlayers] = useState(1);
  const [playerColors, setPlayerColors] = useState(['#0077FF', '#FF0000', '#00FF00', '#FFFF00']);

  const colors = [
    '#0077FF', '#FF0000', '#00FF00', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  const handleColorChange = (playerIndex, color) => {
    const newColors = [...playerColors];
    newColors[playerIndex] = color;
    setPlayerColors(newColors);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
      >
        <ArrowLeft size={20} />
        <span>VOLVER</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-glow">
          CONFIGURAR JUGADORES
        </h1>
        <div className="flex items-center justify-center space-x-2 text-gray-300">
          <Users size={24} />
          <span>Personaliza tu experiencia de juego</span>
        </div>
      </div>

      <div className="bg-black/50 rounded-2xl p-8 w-full max-w-4xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Número de Jugadores</h2>
          <div className="flex justify-center space-x-4">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setNumPlayers(num)}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  numPlayers === num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {num} Jugador{num > 1 ? 'es' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: numPlayers }, (_, index) => (
            <div key={index} className="bg-purple-800/30 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Palette size={20} />
                <span>Jugador {index + 1}</span>
              </h3>
              
              <div className="flex items-center space-x-4">
                <span>Color:</span>
                <div className="flex space-x-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(index, color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        playerColors[index] === color
                          ? 'border-white scale-110'
                          : 'border-gray-400 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-4">
                <span>Vista previa:</span>
                <div
                  className="w-12 h-8 rounded"
                  style={{ backgroundColor: playerColors[index] }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onStartGame}
            className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg text-xl font-semibold transition-colors"
          >
            INICIAR JUEGO
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSetupScreen;