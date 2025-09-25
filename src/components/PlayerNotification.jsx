import React, { useEffect } from 'react';

// 🔒 COMPONENTE PROTEGIDO - NOTIFICACIONES DE ESTADO DE JUGADORES
// ⚠️  NO MODIFICAR: Este componente maneja las notificaciones críticas
// de estado de jugadores (join/leave) en el juego
// Si se modifica, las notificaciones de estado NO funcionarán
export default function PlayerNotification({ notification, onClose }) {

  if (!notification) return null;

  let message = '';
  let color = '';
  let icon = '';
  if (notification.type === 'join') {
    message = `${notification.playerName} se ha unido a la partida!`;
    color = 'text-green-400';
    icon = '🎉';
  } else if (notification.type === 'leave') {
    message = `${notification.playerName} ha abandonado la partida.`;
    color = 'text-red-400';
    icon = '👋';
  } else if (notification.type === 'player_left_game') {
    message = notification.message || `${notification.playerName} abandonó la partida`;
    color = 'text-orange-400';
    icon = '🚪';
  } else if (notification.type === 'enemy_destroyed') {
    message = notification.message || `${notification.playerName} destruyó un enemigo!`;
    color = 'text-yellow-400';
    icon = notification.isBoss ? '👑' : '💥';
  } else if (notification.type === 'powerup_taken') {
    message = notification.message || `${notification.playerName} tomó un power-up!`;
    color = 'text-purple-400';
    icon = '⚡';
  }

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-black/90 px-8 py-3 rounded-xl border-2 border-blue-400 shadow-lg font-orbitron text-xl font-bold animate-slide-in ${color}`}>
      <div className="flex items-center space-x-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <span>{message}</span>
      </div>
    </div>
  );
}
