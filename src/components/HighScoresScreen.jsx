import React, { useState } from 'react';
import { ArrowLeft, Trophy, Users, User } from 'lucide-react';

const HighScoresScreen = ({ onBack, highScores = [] }) => {
  const [activeTab, setActiveTab] = useState('personal');

  const personalScores = highScores.filter(score => !score.isMultiplayer);
  const multiplayerScores = highScores.filter(score => score.isMultiplayer);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron relative overflow-hidden">
      {/* Animated Background - Same as LoginScreen */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30"></div>
      
      {/* Animated Stars */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-blue-300 rounded-full animate-twinkle-delayed"></div>
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-purple-300 rounded-full animate-twinkle"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-twinkle-delayed"></div>
      </div>

      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors z-10"
      >
        <ArrowLeft size={20} />
        <span>VOLVER</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-glow">
          MEJORES PUNTUACIONES
        </h1>
      </div>

      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            activeTab === 'personal'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          <User size={20} />
          <span>PERSONAL</span>
        </button>
        <button
          onClick={() => setActiveTab('multiplayer')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            activeTab === 'multiplayer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          <Users size={20} />
          <span>MULTIJUGADOR</span>
        </button>
      </div>

      <div className="bg-black/50 rounded-2xl p-6 w-full max-w-4xl">
        {activeTab === 'personal' ? (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Puntuaciones Personales</h2>
            {personalScores.length === 0 ? (
              <p className="text-center text-gray-400">No hay puntuaciones registradas</p>
            ) : (
              <div className="space-y-2">
                {personalScores.slice(0, 10).map((score, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-purple-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <div className="font-bold">{score.playerName}</div>
                        <div className="text-sm text-gray-400">{score.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-400">{score.score.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Nivel {score.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Puntuaciones Multijugador</h2>
            {multiplayerScores.length === 0 ? (
              <p className="text-center text-gray-400">No hay puntuaciones multijugador registradas</p>
            ) : (
              <div className="space-y-2">
                {multiplayerScores.slice(0, 10).map((score, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-green-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <div className="font-bold">Sala {score.roomCode}</div>
                        <div className="text-sm text-gray-400">{score.players} jugadores</div>
                        <div className="text-sm text-gray-400">{score.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-400">{score.score.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Nivel {score.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HighScoresScreen;