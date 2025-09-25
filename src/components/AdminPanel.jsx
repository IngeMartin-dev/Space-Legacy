// START OF FILE AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Zap, Gauge, Settings, Target, Palette, Crown, Users, Database, Trash2, RotateCcw } from 'lucide-react';
import { io } from 'socket.io-client';
import { userService } from '../lib/supabase';

const AdminPanel = ({ user, onUpdateSettings, onClose }) => {
  // Asegurarse de que user.settings exista para evitar errores
  const settings = user.settings || {};
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeGames: 0,
    serverUptime: '0h 0m'
  });
  const [socket, setSocket] = useState(null);
  const [showBanScreen, setShowBanScreen] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [banDuration, setBanDuration] = useState(5);
  const [customBanMinutes, setCustomBanMinutes] = useState(5);
  const [banReason, setBanReason] = useState('');

  // Conectar al servidor para datos en tiempo real
  useEffect(() => {
    // Use environment variable if available, otherwise determine based on hostname (same logic as useMultiplayer)
    let serverUrl = import.meta.env.VITE_SERVER_URL;

    if (!serverUrl) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development - connect to server on port 3001
        serverUrl = 'http://localhost:3001';
        console.log('🏠 AdminPanel: Local development - connecting to:', serverUrl);
      } else {
        // Production fallback
        serverUrl = 'https://space-legacy.onrender.com';
        console.log('🌐 AdminPanel: Production - connecting to:', serverUrl);
      }
    } else {
      console.log('🔧 AdminPanel: Using VITE_SERVER_URL from env:', serverUrl);
    }

    console.log('🔧 AdminPanel: Final server URL:', serverUrl);

    try {
      const adminSocket = io(serverUrl, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      adminSocket.on('connect', () => {
        console.log('🔧 Panel de admin conectado exitosamente al servidor');
        console.log('🔧 URL del servidor:', serverUrl);
        setSocket(adminSocket);

        // Request initial data
        setTimeout(() => {
          if (adminSocket.connected) {
            adminSocket.emit('getConnectedUsers');
            console.log('📊 Solicitando datos iniciales de usuarios conectados...');
          }
        }, 1000);
      });

      adminSocket.on('disconnect', (reason) => {
        console.log('🔌 Panel de admin desconectado:', reason);
        setConnectedUsers([]);
        setSystemStats({
          totalUsers: 0,
          activeGames: 0,
          serverUptime: 'Desconectado'
        });
      });

      adminSocket.on('connect_error', (error) => {
        console.error('❌ Error de conexión del panel de admin:', error);
        console.error('❌ URL del servidor:', serverUrl);
        console.error('❌ Intentando reconectar automáticamente...');

        setConnectedUsers([]);
        setSystemStats({
          totalUsers: 0,
          activeGames: 0,
          serverUptime: 'Error de conexión'
        });

        // Show user-friendly error message
        console.log('⚠️ No se pudo conectar al servidor. Verifica que el servidor esté ejecutándose en el puerto 3001.');
        console.log('💡 Si el cliente está corriendo en un puerto diferente, el panel de admin intentará conectarse automáticamente.');
      });

      adminSocket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Panel de admin reconectado después de ${attemptNumber} intentos`);
        // Request data after reconnection
        setTimeout(() => {
          if (adminSocket.connected) {
            adminSocket.emit('getConnectedUsers');
          }
        }, 1000);
      });

      adminSocket.on('connectedUsersUpdate', (data) => {
        console.log('📊 Actualización de usuarios conectados recibida:', data);
        let users = data.users || [];

        // Aplicar validación para mostrar solo usuarios con nombres reales (no generados)
        const seen = new Set();
        users = users.filter(u => {
          if (!u || !u.username || !u.username.trim()) return false;
          // Excluir nombres generados automáticamente (como "Jugador-xxx-xxx")
          if (u.username.includes('Jugador-') || u.username.includes('Player-') ||
              u.username.match(/^[A-Za-z]+-[a-z0-9]+-[a-z0-9]+$/)) return false;
          if (seen.has(u.username)) return false;
          seen.add(u.username);
          return true;
        });

        console.log(`👥 AdminPanel: Mostrando ${users.length} usuarios conectados únicos`);
        users.forEach(u => console.log(`   👤 ${u.username}`));

        setConnectedUsers(users);
        setSystemStats({
          totalUsers: users.length,
          activeGames: data.activeRooms || 0,
          serverUptime: 'Conectado'
        });
      });

      // Resultado de ban de admin
      adminSocket.on('adminBanResult', (res) => {
        if (!res) return;
        if (res.ok) {
          const n = document.createElement('div');
          n.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-[10000] animate-fade-in';
          n.innerHTML = `✅ Ban aplicado a <b>${res.username}</b>${res.isPermanent ? ' (indefinido)' : res.banEnd ? ' hasta ' + new Date(res.banEnd).toLocaleString() : ''}`;
          document.body.appendChild(n);
          setTimeout(() => document.body.contains(n) && document.body.removeChild(n), 4000);
          // Refrescar lista
          setTimeout(() => {
            if (adminSocket.connected) {
              adminSocket.emit('getConnectedUsers');
            }
          }, 500);
        } else {
          const n = document.createElement('div');
          n.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-[10000] animate-fade-in';
          n.innerHTML = `❌ Error aplicando ban: ${res.error || 'desconocido'}`;
          document.body.appendChild(n);
          setTimeout(() => document.body.contains(n) && document.body.removeChild(n), 4000);
        }
      });

      // Request updates every 3 seconds for real-time updates
      const interval = setInterval(() => {
        if (adminSocket.connected) {
          adminSocket.emit('getConnectedUsers');
        }
      }, 3000);

      return () => {
        clearInterval(interval);
        if (adminSocket.connected) {
          adminSocket.disconnect();
        }
        adminSocket.off();
      };
    } catch (error) {
      console.error('❌ Error creando socket de admin:', error);
      setConnectedUsers([]);
      setSystemStats({
        totalUsers: 0,
        activeGames: 0,
        serverUptime: 'Error'
      });
    }
  }, []);

  const toggleSetting = (setting) => {
    onUpdateSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const updateFireRate = (rate) => {
    onUpdateSettings({
      ...settings,
      customFireRate: Math.max(1, Math.min(1000, rate))
    });
  };

  const updateBulletDamage = (damage) => {
    onUpdateSettings({
      ...settings,
      customBulletDamage: Math.max(1, Math.min(100, damage))
    });
  };

  const clearUserData = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos de usuario? Esta acción no se puede deshacer.')) {
      // Clear all user data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_') || key.includes('spaceInvaders')) {
          localStorage.removeItem(key);
        }
      });
      alert('Datos de usuario limpiados exitosamente.');
    }
  };

  const resetAllPlayersProgress = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que quieres resetear TODO el progreso de todos los jugadores?\n\n• Todos los usuarios normales serán reseteados a cero\n• Los admins especiales serán reseteados a cero\n• Los admins regulares tendrán monedas infinitas\n• Esta acción no se puede deshacer')) {
      return;
    }

    try {
      console.log('🔄 Iniciando reset completo de todos los usuarios...');
      const result = await userService.resetAllUsersProgress();

      alert(`✅ Reset completado exitosamente!\n\n📊 Resumen:\n• ${result.normalUsers.length} usuarios normales reseteados\n• ${result.specialAdmins.length} admins especiales reseteados\n• ${result.adminUsers.length} admins con monedas infinitas\n\nTotal: ${result.totalResets} usuarios afectados`);

      console.log('✅ Reset completado:', result);
    } catch (error) {
      console.error('❌ Error durante el reset:', error);
      alert('❌ Error durante el reset. Revisa la consola para más detalles.');
    }
  };

  const openBanScreen = (username) => {
    setUserToBan(username);
    setBanDuration(5);
    setCustomBanMinutes(5);
    setBanReason('');
    setShowBanScreen(true);
  };

  const confirmBan = () => {
    if (!userToBan) return;

    const isPermanent = banDuration === 'indefinido';
    const minutes = isPermanent ? null : banDuration;

    // Format duration for display
    let durationText = '';
    if (isPermanent) {
      durationText = 'Permanente (Indefinido)';
    } else if (banDuration >= 1440) {
      const days = Math.floor(banDuration / 1440);
      const hours = Math.floor((banDuration % 1440) / 60);
      durationText = `${days} día${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours}h` : ''}`;
    } else if (banDuration >= 60) {
      const hours = Math.floor(banDuration / 60);
      const mins = banDuration % 60;
      durationText = `${hours} hora${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins}min` : ''}`;
    } else {
      durationText = `${banDuration} minuto${banDuration > 1 ? 's' : ''}`;
    }

    if (socket && socket.connected) {
      // Emit new admin ban event that works globally by username
      socket.emit('adminBanUser', {
        username: userToBan,
        banMinutes: minutes,
        reason: banReason.trim() || `Baneado por administrador por ${isPermanent ? 'tiempo indefinido' : durationText.toLowerCase()}`,
        bannedBy: user?.username || 'Administrador'
      });

      console.log(`🚫 ACCIÓN DE ADMIN: Usuario "${userToBan}" baneado por ${isPermanent ? 'tiempo indefinido' : durationText}`);
      console.log(`🚫 Detalles: Usuario=${userToBan}, Duración=${isPermanent ? 'PERMANENTE' : durationText}, Admin=${user?.username}`);

      // Optimistic UI update: remove from local list and notify
      setConnectedUsers(prev => prev.filter(u => u.username !== userToBan));

      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 ${isPermanent ? 'bg-red-700' : 'bg-green-600'} text-white px-4 py-3 rounded-lg shadow-lg z-[10000] animate-fade-in max-w-sm`;
      notification.innerHTML = `
        <div class="font-bold flex items-center">
          <span class="mr-2">${isPermanent ? '🚫' : '✅'}</span>
          ${isPermanent ? 'BAN PERMANENTE' : 'Usuario Baneado'}
        </div>
        <div class="text-sm mt-1 font-semibold">${userToBan}</div>
        <div class="text-xs mt-1 opacity-90">${isPermanent ? '🚫 Ha sido baneado permanentemente' : `⏰ ${banDuration} minutos restantes`}</div>
        <div class="text-xs mt-1 opacity-75">Admin: ${user?.username || 'Administrador'}</div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 5000);
    } else {
      console.error('❌ Socket no conectado para ejecutar acción de ban');

      // Show connection error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-[10000] animate-fade-in';
      errorNotification.innerHTML = `
        <div class="font-bold">⚠️ Error de Conexión</div>
        <div class="text-sm mt-1">No se pudo conectar al servidor</div>
      `;
      document.body.appendChild(errorNotification);
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification);
        }
      }, 3000);
    }

    setShowBanScreen(false);
    setUserToBan(null);
    setCustomBanMinutes(5);
    setBanReason('');
  };

  return (
    <div className="admin-panel-overlay bg-black/80 flex items-center justify-center font-orbitron text-white overflow-y-auto relative z-[100]">
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl p-6 w-full max-w-4xl border border-purple-500 shadow-2xl shadow-purple-500/20 my-4 max-h-[90vh] overflow-y-auto relative z-[101]">
        {/* Main Content */}
        <div className="flex items-center justify-center mb-6">
          <Crown className={`mr-3 ${user.isSpecialAdmin ? 'text-pink-400' : 'text-yellow-400'}`} size={32} />
          <h2 className={`text-3xl font-bold text-center ${user.isSpecialAdmin ? 'bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent' : 'text-yellow-400'} animate-glow`}>
            {user.isSpecialAdmin ? 'PANEL DE ADMIN ESPECIAL ❤️' : 'PANEL DE ADMIN'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Admin Controls */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
              <Settings className="mr-2" size={20} />
              CONTROLES DE ADMIN
            </h3>

            <div className="flex items-center justify-between bg-black/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Shield className="text-blue-400" size={24} />
                <span className="text-white">No Clip (Invencible)</span>
              </div>
              <button
                onClick={() => toggleSetting('noclip')}
                className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors ${settings.noclip ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${settings.noclip ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Zap className="text-yellow-400" size={24} />
                <span className="text-white">Disparo Rápido</span>
              </div>
              <button
                onClick={() => toggleSetting('rapidFire')}
                className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors ${settings.rapidFire ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${settings.rapidFire ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Gauge className="text-green-400" size={24} />
                <span className="text-white">Super Velocidad</span>
              </div>
              <button
                onClick={() => toggleSetting('superSpeed')}
                className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors ${settings.superSpeed ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${settings.superSpeed ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Target className="text-orange-400" size={24} />
                <span className="text-white">Disparos por Segundo</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.customFireRate || 10}
                  onChange={(e) => updateFireRate(parseInt(e.target.value) || 1)}
                  className="w-16 bg-gray-700 border border-gray-500 rounded px-2 py-1 text-white text-center"
                  onFocus={(e) => e.target.select()}
                />
                <span className="text-gray-400 text-sm">DPS</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-black/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Target className="text-red-400" size={24} />
                <span className="text-white">Daño de Bala</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.customBulletDamage || 1}
                  onChange={(e) => updateBulletDamage(parseInt(e.target.value) || 1)}
                  className="w-16 bg-gray-700 border border-gray-500 rounded px-2 py-1 text-white text-center"
                  onFocus={(e) => e.target.select()}
                />
                <span className="text-gray-400 text-sm">DMG</span>
              </div>
            </div>
            {user.isSpecialAdmin && (
              <div className="flex items-center justify-between bg-black/30 rounded-lg p-4 border border-pink-500">
                <div className="flex items-center space-x-3">
                  <Palette className="text-pink-400" size={24} />
                  <span className="text-white">Modo Arcoíris ❤️</span>
                </div>
                <button
                  onClick={() => toggleSetting('rainbowMode')}
                  className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors ${settings.rainbowMode ? 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${settings.rainbowMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}

            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Settings className="text-purple-400" size={24} />
                <span className="text-white">Monedas Infinitas</span>
              </div>
              <p className="text-green-400 text-sm">✓ Activado por defecto para admins.</p>
            </div>
          </div>

          {/* Right Column - System Info & User Management */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
              <Database className="mr-2" size={20} />
              SISTEMA & USUARIOS
            </h3>

            {/* System Stats */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-300 mb-3">Estadísticas del Sistema</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Usuarios Conectados:</span>
                  <span className="text-green-400 ml-2 font-semibold">{systemStats.totalUsers}</span>
                  <div className="text-xs text-gray-500">Conexiones activas</div>
                </div>
                <div>
                  <span className="text-gray-400">Juegos Activos:</span>
                  <span className="text-white ml-2">{systemStats.activeGames}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Tiempo Activo:</span>
                  <span className="text-white ml-2">{systemStats.serverUptime}</span>
                </div>
              </div>
            </div>

            {/* Connected Users */}
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-green-300 flex items-center">
                  <Users className="mr-2" size={18} />
                  Usuarios Conectados ({connectedUsers.filter(u => u.username).length})
                </h4>
                <div className="flex items-center space-x-2 text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {connectedUsers.filter(u => u.username).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {connectedUsers.filter(u => u.username).map((connectedUser, index) => (
                      <div key={`${connectedUser.username}-${index}`} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${connectedUser.currentRoom ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                          <span className="text-white text-sm font-medium truncate">
                            {connectedUser.username}
                          </span>
                          {connectedUser.currentRoom && (
                            <div className="text-xs text-blue-300 bg-blue-900/30 px-1 py-0.5 rounded ml-1">
                              Sala: {connectedUser.currentRoom}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {/* Status indicator */}
                          <div className={`w-2 h-2 rounded-full animate-pulse ${connectedUser.currentRoom ? 'bg-green-400' : 'bg-gray-400'}`} title={connectedUser.currentRoom ? "En sala multijugador" : "Conectado al juego"}></div>
                          <button
                            onClick={() => openBanScreen(connectedUser.username)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-900/50 transition-all duration-200 hover:scale-105 flex-shrink-0"
                            title={`Banear usuario`}
                          >
                            BAN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">
                    <Users className="mx-auto mb-2 opacity-50" size={32} />
                    <div>No hay usuarios conectados</div>
                    <div className="text-xs mt-1 opacity-75">Los usuarios aparecerán aquí automáticamente</div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-300 mb-3">Acciones de Sistema</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (socket && socket.connected) {
                      socket.emit('getConnectedUsers');
                      console.log('🔄 Actualizando lista de usuarios conectados...');

                      // Mostrar notificación de actualización
                      const notification = document.createElement('div');
                      notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-[10000] animate-fade-in';
                      notification.innerHTML = '🔄 Actualizando lista de usuarios conectados...';
                      document.body.appendChild(notification);
                      setTimeout(() => {
                        if (document.body.contains(notification)) {
                          document.body.removeChild(notification);
                        }
                      }, 2000);
                    }
                  }}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500 text-blue-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 mb-2"
                >
                  <Users size={16} />
                  <span>Actualizar Lista</span>
                </button>
                <button
                  onClick={clearUserData}
                  className="w-full bg-red-600/20 hover:bg-red-600/40 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Limpiar Datos de Usuario</span>
                </button>
                <button
                  onClick={resetAllPlayersProgress}
                  className="w-full bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500 text-orange-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw size={16} />
                  <span>Resetear Todos los Jugadores</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ban Duration Screen */}
        {showBanScreen && userToBan && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] font-orbitron">
            <div className="bg-gradient-to-br from-red-900 to-purple-900 rounded-2xl p-6 border border-red-500 shadow-2xl shadow-red-500/20 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mb-6">
                  <Shield className="mx-auto mb-4 text-red-400 animate-pulse" size={48} />
                  <h2 className="text-2xl font-bold text-white mb-2">🚫 BANEAR USUARIO</h2>
                  <p className="text-red-200">
                    Selecciona la duración del ban para <span className="text-yellow-400 font-bold">
                      {userToBan}
                    </span>
                  </p>
                  <p className="text-red-300 text-sm mt-2">
                    ⚠️ Esta acción expulsará al usuario inmediatamente
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <div className="space-y-4">
                    {/* Preset durations */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setBanDuration(5)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          banDuration === 5
                            ? 'bg-red-600 text-white border-2 border-red-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        5 minutos
                      </button>
                      <button
                        onClick={() => setBanDuration(15)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          banDuration === 15
                            ? 'bg-red-600 text-white border-2 border-red-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        15 minutos
                      </button>
                      <button
                        onClick={() => setBanDuration(30)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          banDuration === 30
                            ? 'bg-red-600 text-white border-2 border-red-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        30 minutos
                      </button>
                      <button
                        onClick={() => setBanDuration(60)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          banDuration === 60
                            ? 'bg-red-600 text-white border-2 border-red-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        1 hora
                      </button>
                      <button
                        onClick={() => setBanDuration(360)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          banDuration === 360
                            ? 'bg-red-600 text-white border-2 border-red-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        6 horas
                      </button>
                      <button
                        onClick={() => setBanDuration(1440)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          banDuration === 1440
                            ? 'bg-red-600 text-white border-2 border-red-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        24 horas
                      </button>
                    </div>

                    {/* Ban Reason Input */}
                    <div className="border-t border-gray-600 pt-4">
                      <label className="block text-white text-sm font-medium mb-2">
                        Razón del ban (opcional):
                      </label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Ej: Violación de reglas, comportamiento tóxico, spam..."
                        className="w-full bg-gray-700 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400 resize-none"
                        rows="3"
                        maxLength="500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {banReason.length}/500 caracteres
                      </p>
                    </div>

                    {/* Custom duration input */}
                    <div className="border-t border-gray-600 pt-4">
                      <label className="block text-white text-sm font-medium mb-2">
                        Duración personalizada (mínimo 5 minutos):
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="5"
                          max="10080" // 1 week in minutes
                          value={customBanMinutes}
                          onChange={(e) => {
                            const value = Math.max(5, parseInt(e.target.value) || 5);
                            setCustomBanMinutes(value);
                            setBanDuration(value);
                          }}
                          className="flex-1 bg-gray-700 border border-gray-500 rounded px-3 py-2 text-white text-center focus:outline-none focus:border-red-400"
                          placeholder="Minutos"
                        />
                        <span className="text-gray-400 text-sm">minutos</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Máximo: 10,080 minutos (1 semana)
                      </p>
                    </div>

                    {/* Permanent ban option */}
                    <div className="border-t border-gray-600 pt-4">
                      <button
                        onClick={() => setBanDuration('indefinido')}
                        className={`w-full p-3 rounded-lg text-sm font-medium transition-all ${
                          banDuration === 'indefinido'
                            ? 'bg-red-700 text-white border-2 border-red-500'
                            : 'bg-gray-800 text-red-300 hover:bg-gray-700 border-2 border-red-800'
                        }`}
                      >
                        🚫 BAN PERMANENTE (Indefinido)
                      </button>
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ Esta acción no se puede deshacer
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowBanScreen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={confirmBan}
                    className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    🚫 EJECUTAR BAN
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 transform hover:scale-105 shadow-lg shadow-red-900/40"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
// END OF FILE AdminPanel.jsx
