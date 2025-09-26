// START OF FILE MultiplayerScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useMultiplayer } from './hooks/useMultiplayer';
import { ArrowLeft, Users, Plus, UserPlus, MessageCircle, LogOut, XCircle, Send, X } from 'lucide-react';
import MultiplayerChat from './MultiplayerChat';
import JoinNotification from './JoinNotification';

const CopyButton = ({ currentRoom, gameStartCountdown }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    // Copiar al portapapeles
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentRoom).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(() => {
        fallbackCopy(currentRoom);
      });
    } else {
      fallbackCopy(currentRoom);
    }
  };

  const fallbackCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      disabled={gameStartCountdown !== null}
      className={`px-3 py-1 rounded text-xs transition-all duration-300 ${gameStartCountdown !== null
          ? 'bg-gray-600 cursor-not-allowed opacity-50'
          : isCopied
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
    >
      {isCopied ? '¡Copiado!' : '📋 Copiar'}
    </button>
  );
};

const MultiplayerScreen = ({
  onBack,
  onCreateRoom,
  onJoinRoom,
  isConnected,
  currentRoom,
  roomPlayers,
  isHost,
  error,
  onStartGame,
  onLeaveRoom,
  currentUser,
  socket,
  isReconnecting,
  onForceReconnect,
  joinNotification,
  clearJoinNotification,
  kickNotification,
  clearKickNotification
}) => {
  // Ensure roomPlayers is always an array
  const safeRoomPlayers = Array.isArray(roomPlayers) ? roomPlayers : [];



  const [joinCode, setJoinCode] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [gameStartCountdown, setGameStartCountdown] = useState(null);
  const [showKickNotificationScreen, setShowKickNotificationScreen] = useState(false);
  const [kickNotificationData, setKickNotificationData] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [localError, setLocalError] = useState('');



  // Component rendered

  // Sync local error with prop error
  useEffect(() => {
    if (error) {
      setLocalError(error);
      // Auto-clear after 3 seconds
      const timer = setTimeout(() => {
        setLocalError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);



  // Enhanced player status notifications
  const [playerStatusNotifications, setPlayerStatusNotifications] = useState([]);

  // Clear notifications when room changes
  useEffect(() => {
    if (!currentRoom) {
      setPlayerStatusNotifications([]);
      previousPlayersRef.current = [];
    }
  }, [currentRoom]);

  // Simple notification system - track basic player changes
  const previousPlayersRef = useRef([]);

  useEffect(() => {
    if (currentRoom && Array.isArray(roomPlayers)) {
      const currentPlayerIds = new Set(roomPlayers.map(p => p.id));
      const previousPlayerIds = new Set(previousPlayersRef.current.map(p => p.id));
      const newNotifications = [];

      // New players joined
      roomPlayers.forEach(player => {
        if (!previousPlayerIds.has(player.id)) {
          newNotifications.push({
            id: `join-${player.id}-${Date.now()}`,
            playerId: player.id,
            playerName: player.name,
            avatar: player.avatar,
            type: 'joined',
            message: `${player.name} se unió a la sala`,
            timestamp: Date.now(),
            color: 'green'
          });
        }
      });

      // Players left
      previousPlayersRef.current.forEach(prevPlayer => {
        if (!currentPlayerIds.has(prevPlayer.id)) {
          newNotifications.push({
            id: `left-${prevPlayer.id}-${Date.now()}`,
            playerId: prevPlayer.id,
            playerName: prevPlayer.name,
            avatar: prevPlayer.avatar,
            type: 'disconnected',
            message: `${prevPlayer.name} salió de la sala`,
            timestamp: Date.now(),
            color: 'red'
          });
        }
      });

      if (newNotifications.length > 0) {
        setPlayerStatusNotifications(prev => [...prev, ...newNotifications]);

        // Auto-remove after 1 second
        newNotifications.forEach(notification => {
          setTimeout(() => {
            setPlayerStatusNotifications(prev =>
              prev.filter(n => n.id !== notification.id)
            );
          }, 1000);
        });
      }

      previousPlayersRef.current = [...roomPlayers];
    }
  }, [roomPlayers, currentRoom]);





  const handleSendMessage = (message) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('chatMessage', { room: currentRoom, sender: currentUser.username, text: message });

      const newMessage = {
        username: currentUser.username,
        text: message,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, newMessage]);
    }
  };

  const handleKickPlayer = (playerId) => {
    console.log('🚫 Intentando expulsar jugador:', playerId);
    console.log('📊 Estado actual:', { isHost, socketConnected: socket?.connected, currentRoom, playerId });

    if (isHost && socket && socket.connected && currentRoom && playerId) {
      console.log('✅ Enviando evento kickPlayer al servidor');
      socket.emit('kickPlayer', {
        roomCode: currentRoom,
        playerIdToKick: playerId
      });
    } else {
      console.log('❌ No se puede expulsar: condiciones no cumplidas');
      if (!isHost) console.log('  - No eres anfitrión');
      if (!socket?.connected) console.log('  - Socket no conectado');
      if (!currentRoom) console.log('  - No hay sala actual');
      if (!playerId) console.log('  - No hay ID de jugador');
    }
  };


  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        // Show feedback
        const btn = document.activeElement;
        if (btn && btn.tagName === 'BUTTON') {
          const originalText = btn.textContent;
          const originalClasses = btn.className;

          btn.textContent = 'Copiado';
          btn.className = originalClasses.replace('bg-blue-600 hover:bg-blue-700', 'bg-green-600 hover:bg-green-700');

          setTimeout(() => {
            btn.textContent = originalText;
            btn.className = originalClasses;
          }, 2000);
        }
      } else {
        alert(`Código de sala: ${text}`);
      }
    } catch (err) {
      alert(`Código de sala: ${text}`);
    }

    document.body.removeChild(textArea);
  };


  useEffect(() => {
    if (!socket) return;

    const handleNewChatMessage = (message) => {
      setChatMessages(prev => {
        // Avoid duplicates by checking if message already exists
        const messageExists = prev.some(msg =>
          msg.username === message.username &&
          msg.text === message.text &&
          Math.abs(msg.timestamp - message.timestamp) < 1000
        );

        if (messageExists) {
          return prev;
        }

        return [...prev, message];
      });
    };

    const handlePlayerJoined = (data) => {
      // roomPlayers is updated by the parent useMultiplayer hook
    };

    const handlePlayerLeft = (data) => {
      // roomPlayers is updated by the parent useMultiplayer hook
      // Leave notifications are handled by useMultiplayer hook via joinNotification

      // Show special notification for kicks/bans
      if (data.reason === 'kick' || data.reason === 'ban') {
        // The joinNotification will be set by useMultiplayer hook
      }
    };

    const handleGameStarting = (data) => {
      // Start countdown when game is about to start
      setGameStartCountdown(3);
      const countdownInterval = setInterval(() => {
        setGameStartCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleUserBanned = (banData) => {
      setBanData(banData);
      setShowBanScreen(true);
      // Clear room data by calling parent functions
      if (onLeaveRoom) {
        onLeaveRoom();
      }
    };

    socket.on('chatMessage', handleNewChatMessage);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('gameStarting', handleGameStarting);
    socket.on('userBanned', handleUserBanned);

    return () => {
      socket.off('chatMessage', handleNewChatMessage);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('gameStarting', handleGameStarting);
      socket.off('userBanned', handleUserBanned);
    };
  }, [socket, onLeaveRoom]);





  // Generate stable key for player list
  const playerListKey = `players-${safeRoomPlayers.map(p => p.id).join('-')}-${Date.now()}`;

  // Auto-refresh room data when reconnecting
  useEffect(() => {
    if (isConnected && currentRoom && socket && socket.connected) {
      // Request room update when connection is restored
      socket.emit('requestRoomUpdate', { roomCode: currentRoom });
    }
  }, [isConnected, currentRoom, socket]);

  // Reset loading states when room is created/joined or when there's an error
  useEffect(() => {
    if (currentRoom) {
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    }
  }, [currentRoom]);

  useEffect(() => {
    if (error) {
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    }
  }, [error]);


  const handleCreateRoomClick = () => {
    setIsCreatingRoom(true);
    onCreateRoom();
  };

  const handleJoinRoomClick = () => {
    if (joinCode.length === 6) {
      setIsJoiningRoom(true);
      onJoinRoom(joinCode);
    }
  };




  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-8 font-orbitron shadow-inset-2xl shadow-purple-900 relative overflow-hidden">
      {/* Animated Background - Same as LoginScreen */}
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
        onClick={onBack}
        disabled={gameStartCountdown !== null}
        className={`absolute top-8 left-8 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors transform focus:outline-none focus:ring-2 shadow-md z-10 ${gameStartCountdown !== null
            ? 'bg-gray-800 cursor-not-allowed opacity-60'
            : 'bg-gray-600 hover:bg-gray-700 hover:scale-105 focus:ring-gray-400'
          }`}
      >
        <ArrowLeft size={20} />
        <span>VOLVER</span>
      </button>

      {/* Connection Status Indicator */}
      <div className="absolute top-8 right-32 flex items-center space-x-2 text-sm z-10">
        <div className={`w-3 h-3 rounded-full ${
          isConnected
            ? 'bg-green-400 animate-pulse'
            : currentRoom?.startsWith('LOCAL-')
              ? 'bg-yellow-400 animate-pulse'
              : 'bg-red-400'
        }`}></div>
        <span className={
          isConnected
            ? 'text-green-400'
            : currentRoom?.startsWith('LOCAL-')
              ? 'text-yellow-400'
              : 'text-red-400'
        }>
          {isConnected
            ? 'Conectado'
            : currentRoom?.startsWith('LOCAL-')
              ? 'Modo Local'
              : 'Sin Servidor'
          }
        </span>
        {socket?.id && (
          <span className="text-gray-400 text-xs">
            ID: {socket.id.substring(0, 8)}...
          </span>
        )}
        {!isConnected && !currentRoom?.startsWith('LOCAL-') && (
          <span className="text-red-400 text-xs animate-pulse">
            ⚠️ Configura VITE_SERVER_URL
          </span>
        )}
        {/* Debug Button */}
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          title="Modo Debug"
        >
          🐛
        </button>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div className="absolute top-20 right-4 bg-black/90 text-white p-4 rounded-lg text-xs z-20 max-w-sm">
          <h3 className="font-bold mb-2">🐛 DEBUG INFO</h3>
          <div className="space-y-1">
            <div>Socket ID: {socket?.id || 'N/A'}</div>
            <div>Connected: {isConnected ? '✅' : '❌'}</div>
            <div>Room: {currentRoom || 'N/A'}</div>
            <div>Players: {safeRoomPlayers.length}</div>
            <div>Is Host: {isHost ? '✅' : '❌'}</div>
            <div>Notification: {joinNotification ? '✅' : '❌'}</div>
            <div>Reconnecting: {isReconnecting ? '✅' : '❌'}</div>
            <div>Error: {error || 'N/A'}</div>
          </div>
          <div className="mt-3 space-y-1">
            <button
              onClick={() => {
                if (socket && socket.connected) {
                  socket.emit('ping', { timestamp: Date.now() });
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
            >
              🏓 Test Ping
            </button>
            <button
              onClick={() => {
                console.log('🔍 Debug Info:', {
                  roomPlayers: roomPlayers?.length || 0,
                  currentRoom,
                  isHost,
                  socketConnected: socket?.connected,
                  joinNotification: !!joinNotification
                });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
            >
              📊 Log State
            </button>
            <button
              onClick={() => {
                if (currentRoom && socket && socket.connected) {
                  socket.emit('requestRoomUpdate', { roomCode: currentRoom });
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
            >
              🔄 Update Room
            </button>
            <button
              onClick={() => {
                if (socket && socket.connected) {
                  socket.emit('getConnectionInfo');
                }
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs"
            >
              📊 Server Info
            </button>
          </div>
        </div>
      )}


      {currentRoom && (
        <button
          onClick={onLeaveRoom}
          disabled={gameStartCountdown !== null}
          className={`absolute bottom-8 right-8 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors transform focus:outline-none focus:ring-2 shadow-md z-10 ${gameStartCountdown !== null
              ? 'bg-red-800 cursor-not-allowed opacity-60'
              : 'bg-red-600 hover:bg-red-700 hover:scale-105 focus:ring-red-400'
            }`}
        >
          <LogOut size={20} />
          <span>SALIR DE SALA</span>
        </button>
      )}



      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl w-full">


        <div className="flex-1 bg-black/50 rounded-2xl p-8 border border-purple-700 shadow-2xl shadow-purple-900/40 min-w-[320px]">
          {currentRoom && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-glow">
                  SALA: {currentRoom}
                  {currentRoom.startsWith('LOCAL-') && (
                    <span className="block text-lg text-yellow-300 mt-2 animate-pulse">
                      ⚠️ MODO LOCAL - Sin conexión al servidor
                    </span>
                  )}
                </h1>
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-gray-300 text-sm">
                    {currentRoom.startsWith('LOCAL-')
                      ? 'Sala local para pruebas - No se puede compartir'
                      : 'Comparte este código con tus amigos'
                    }
                  </p>
                  {!currentRoom.startsWith('LOCAL-') && (
                    <CopyButton
                      currentRoom={currentRoom}
                      gameStartCountdown={gameStartCountdown}
                    />
                  )}
                </div>
              </div>

            </>
          )}

          {!currentRoom && !kickNotification && (
            <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto mb-8 place-items-center">
              {/* CREATE ROOM CARD */}
              <div className="relative bg-gradient-to-br from-green-900/80 via-green-800/60 to-emerald-900/80 rounded-3xl p-8 text-center border-2 border-green-500/50 shadow-2xl shadow-green-500/20 backdrop-blur-sm overflow-hidden group min-h-[500px]">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-emerald-400/10 animate-pulse-slow"></div>
                <div className="absolute top-4 right-4 w-16 h-16 bg-green-400/20 rounded-full blur-xl animate-float"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-emerald-400/20 rounded-full blur-lg animate-float-delayed"></div>

                <div className="relative z-10 mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg shadow-green-400/30 animate-bounce-slow">
                    <Plus size={40} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                    CREAR SALA
                  </h2>
                  <p className="text-green-100 text-lg leading-relaxed">
                    Crea una nueva sala y invita a tus amigos a una aventura épica
                  </p>
                  <div className="mt-4 flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>

                <button
                  onClick={handleCreateRoomClick}
                  disabled={!isConnected || isCreatingRoom}
                  className={`relative w-full py-5 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl overflow-hidden group ${isConnected && !isCreatingRoom
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-500/30'
                      : 'bg-gray-700 cursor-not-allowed opacity-70 text-gray-400'
                    }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-5 flex items-center justify-center space-x-2">
                    {isConnected ? (
                      isCreatingRoom ? (
                        <>
                          <span>⏳ CREANDO SALA...</span>
                          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                        </>
                      ) : (
                        <>
                          <span>🚀 CREAR SALA</span>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </>
                      )
                    ) : (
                      <>
                        <span>⏳ CONECTANDO...</span>
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* JOIN ROOM CARD */}
              <div className="relative bg-gradient-to-br from-blue-900/80 via-blue-800/60 to-indigo-900/80 rounded-3xl p-8 text-center border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 backdrop-blur-sm overflow-hidden group min-h-[500px]">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-indigo-400/10 animate-pulse-slow"></div>
                <div className="absolute top-6 left-6 w-14 h-14 bg-blue-400/20 rounded-full blur-xl animate-float-delayed"></div>
                <div className="absolute bottom-6 right-6 w-10 h-10 bg-indigo-400/20 rounded-full blur-lg animate-float"></div>

                <div className="relative z-10 mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mb-4 shadow-lg shadow-blue-400/30 animate-bounce-slow">
                    <UserPlus size={40} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                    UNIRSE A SALA
                  </h2>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Ingresa el código de 6 dígitos para unirte a la batalla
                  </p>
                  <div className="mt-4 flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="relative z-10 mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onPaste={(e) => {
                        e.preventDefault();
                        const paste = (e.clipboardData || window.clipboardData).getData('text');
                        const cleanCode = paste.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
                        setJoinCode(cleanCode);
                      }}
                      onFocus={(e) => e.target.select()}
                      maxLength={6}
                      className="bg-black/60 border-2 border-blue-500/50 rounded-xl px-6 py-4 text-white text-center text-3xl tracking-widest w-full focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 relative z-30 placeholder-blue-300/50"
                      placeholder="CÓDIGO"
                      autoComplete="off"
                      spellCheck="false"
                      autoCapitalize="characters"
                      inputMode="text"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl pointer-events-none"></div>
                  </div>
                  <div className="mt-2 text-sm text-blue-200">
                    {joinCode.length}/6 caracteres
                  </div>
                  {localError && (
                    <div className="mt-2 text-center">
                      <p className="text-red-400 text-sm font-semibold animate-pulse">
                        {localError}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleJoinRoomClick}
                  disabled={!isConnected || joinCode.length !== 6 || isJoiningRoom}
                  className={`relative w-full py-5 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl overflow-hidden group ${isConnected && joinCode.length === 6 && !isJoiningRoom
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-blue-500/30'
                      : 'bg-gray-700 cursor-not-allowed opacity-70 text-gray-400'
                    }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {isConnected && joinCode.length === 6 ? (
                      isJoiningRoom ? (
                        <>
                          <span>⏳ UNIÉNDOSE...</span>
                          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                        </>
                      ) : (
                        <>
                          <span>🎯 UNIRSE A SALA</span>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </>
                      )
                    ) : (
                      <>
                        <span>{!isConnected ? '⏳ CONECTANDO...' : 'ESCRIBE EL CÓDIGO'}</span>
                        {!isConnected && <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}

          {currentRoom && (
            <div className="space-y-4 pr-2">
              {/* Mensaje si la sala está en partida */}
              {safeRoomPlayers.some(p => p.inGame) && (
                <div className="mb-4 p-4 bg-gradient-to-r from-orange-900/60 to-red-900/60 rounded-xl border border-orange-500/50 shadow-lg">
                  <div className="flex items-center justify-center">
                    <div className="text-orange-300 text-lg font-bold animate-pulse">
                      🎮 LA SALA YA ESTÁ EN PARTIDA
                    </div>
                  </div>
                  <div className="text-center text-orange-200 text-sm mt-2">
                    Puedes observar el progreso del juego
                  </div>
                </div>
              )}

              {/* LISTA DE JUGADORES */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl border border-blue-500/50 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-blue-300 flex items-center">
                    <Users className="mr-3" size={24} />
                    JUGADORES EN LA SALA ({safeRoomPlayers.length})
                  </h3>
                </div>
                <div className="text-sm text-gray-300 flex items-center justify-between">
                  <span className="flex items-center">
                    {isConnected ? '🟢 Conectado - Actualizaciones en tiempo real' : '🔴 Desconectado'}
                  </span>
                  {isConnected && safeRoomPlayers.length > 0 && (
                    <span className="text-green-400 text-xs animate-pulse font-semibold">
                      ⚡ Actualización instantánea
                    </span>
                  )}
                </div>
              </div>

              {safeRoomPlayers.length > 0 ? (
                <div key={playerListKey} className="space-y-2">
                  {/* Ordenar jugadores por nivel (descendente) para ranking */}
                  {safeRoomPlayers
                    .sort((a, b) => {
                      const levelA = a.playerLevel || 1;
                      const levelB = b.playerLevel || 1;
                      return levelB - levelA;
                    })
                    .map((player, index) => {
                      const isTopPlayer = index < 3;
                      const rankColor = index === 0 ? 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/50' :
                                       index === 1 ? 'from-gray-400/20 to-gray-500/20 border-gray-400/50' :
                                       index === 2 ? 'from-orange-500/20 to-orange-600/20 border-orange-400/50' :
                                       'from-purple-900/40 to-purple-800/40 border-purple-500/30';

                      const isCurrentUser = player?.id === socket?.id;
                      const canKickPlayer = (isHost || currentUser?.isAdmin) && !isCurrentUser;

                      return (
                        <div
                          key={`player-${player?.id || `fallback-${index}`}-${player?.name || 'unknown'}-${Date.now()}`}
                          className={`flex items-center justify-between rounded-xl p-4 border transition-all duration-300 shadow-lg ${
                            isTopPlayer
                              ? `bg-gradient-to-r ${rankColor} hover:scale-[1.02] shadow-xl`
                              : 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-500/40 hover:bg-purple-900/70 hover:scale-[1.02] hover:shadow-xl'
                          } ${isCurrentUser ? 'ring-2 ring-blue-400/50' : ''}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <span className="text-3xl">
                                {player?.avatar || '👤'}
                              </span>
                              {isCurrentUser && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-white text-lg flex items-center flex-wrap gap-2">
                                <span>{index + 1}. {player?.name || `Jugador ${index + 1}`}</span>
                                {player?.playerLevel && (
                                  <span className="text-yellow-400 text-sm bg-yellow-900/60 px-2 py-1 rounded-lg font-semibold">
                                    Lv.{player.playerLevel}
                                  </span>
                                )}
                                {isCurrentUser && isHost && (
                                  <span className="text-yellow-400 animate-pulse font-semibold bg-yellow-900/50 px-2 py-1 rounded-lg">
                                    👑 Anfitrión
                                  </span>
                                )}
                                {isCurrentUser && !isHost && (
                                  <span className="text-blue-400 animate-pulse font-semibold bg-blue-900/50 px-2 py-1 rounded-lg">
                                    🎮 Tú
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-300 mt-1">
                                <span className="font-medium">Nave:</span> {player?.ship || 'ship1'} |
                                <span className="font-medium"> Estado:</span> {player?.inGame ? '🎮 En Juego' : '⏳ Esperando'}
                                {player?.playerLevel && ` | Ventajas: +${(player.playerLevel - 1) * 10}%`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${isConnected ? (player?.inGame ? 'bg-green-500' : 'bg-yellow-500') : 'bg-red-500'} animate-pulse shadow-lg`}></div>
                              <span className="text-xs text-gray-300 font-semibold block">
                                {isConnected ? (player?.inGame ? 'ACTIVO' : 'LISTO') : 'OFFLINE'}
                              </span>
                            </div>
                            {canKickPlayer && (
                              <button
                                onClick={() => handleKickPlayer(player.id)}
                                disabled={gameStartCountdown !== null || safeRoomPlayers.some(p => p.inGame)}
                                className={`px-3 py-2 text-white text-sm rounded-lg transition-all duration-200 shadow-lg font-semibold ${
                                  gameStartCountdown !== null || safeRoomPlayers.some(p => p.inGame)
                                    ? 'bg-red-800 cursor-not-allowed opacity-60'
                                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 hover:scale-110 active:scale-95'
                                }`}
                                title={safeRoomPlayers.some(p => p.inGame) ? 'No se puede expulsar durante la partida' : `Expulsar a ${player?.name || 'este jugador'}`}
                              >
                                🚫
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-900/30 rounded-xl border border-gray-700/50">
                  <Users size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
                  <p className="text-xl font-semibold mb-2">Esperando jugadores...</p>
                  <p className="text-sm">{isConnected ? 'Los jugadores aparecerán aquí automáticamente cuando se unan' : 'Reconectando al servidor...'}</p>
                  {!isConnected && (
                    <div className="mt-6">
                      <button
                        onClick={onForceReconnect}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                      >
                        🔄 Reconectar al Servidor
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentRoom && (
            <div className="mt-8 space-y-4">
              {isHost && !currentRoom.startsWith('LOCAL-') && (
                <button
                  onClick={onStartGame}
                  disabled={safeRoomPlayers.length < 1 || gameStartCountdown !== null || safeRoomPlayers.some(p => p.inGame)}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors transform shadow-lg ${gameStartCountdown !== null || safeRoomPlayers.some(p => p.inGame)
                      ? 'bg-blue-800 cursor-not-allowed opacity-60'
                      : safeRoomPlayers.length >= 1
                        ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                        : 'bg-gray-700 cursor-not-allowed opacity-70'
                    }`}
                >
                  {safeRoomPlayers.some(p => p.inGame) ? 'PARTIDA EN CURSO' : 'INICIAR PARTIDA'}
                </button>
              )}

              {currentRoom.startsWith('LOCAL-') && (
                <div className="w-full py-3 rounded-lg font-semibold text-center bg-yellow-600/20 border border-yellow-500/50 text-yellow-300">
                  🎮 Modo Local - Inicia el juego desde el menú principal para jugar solo
                </div>
              )}
            </div>
          )}
        </div>


        <div className="space-y-4">
          {currentRoom && (
            <MultiplayerChat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              currentUser={currentUser.username}
              socket={socket}
              currentRoom={currentRoom}
            />
          )}
        </div>
      </div>

      {/* Game Start Countdown Overlay */}
      {gameStartCountdown !== null && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 font-orbitron pointer-events-none">
          <div className="text-center">
            <div className="text-8xl font-bold text-yellow-400 mb-4 drop-shadow-lg">
              {gameStartCountdown}
            </div>
            <div className="text-2xl text-white drop-shadow-lg">
              ¡La partida comienza en...!
            </div>
          </div>
        </div>
      )}


      {/* Notificación de entrada de jugadores (todos los tipos) */}
      {joinNotification && joinNotification.playerName && (
        <div className="fixed top-4 right-4 z-[10000] animate-slide-in-right shadow-2xl">
          <JoinNotification
            key={`join-${joinNotification.timestamp}-${joinNotification.playerName}-${joinNotification.isLeaving}`}
            playerName={joinNotification.playerName}
            avatar={joinNotification.avatar}
            onClose={() => {
              if (typeof clearJoinNotification === 'function') {
                clearJoinNotification();
              }
            }}
            isLeaving={joinNotification.isLeaving}
            reason={joinNotification.reason}
            kickedBy={joinNotification.kickedBy}
          />
        </div>
      )}

      {/* Simple Player Notifications */}
      {playerStatusNotifications.slice(0, 3).map((notification, index) => (
        <div
          key={notification.id}
          className={`fixed right-4 z-[9998] animate-slide-in-right shadow-2xl`}
          style={{ top: `${16 + index * 70}px` }}
        >
          <div className={`rounded-lg p-3 border-2 shadow-xl min-w-[250px] ${
            notification.color === 'green'
              ? 'bg-green-600/95 border-green-400 text-white'
              : notification.color === 'red'
              ? 'bg-red-600/95 border-red-400 text-white'
              : 'bg-blue-600/95 border-blue-400 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{notification.avatar || '👤'}</span>
                <div>
                  <p className="font-semibold text-sm">{notification.playerName}</p>
                  <p className="text-xs opacity-90">{notification.message}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isHost && notification.playerId && notification.playerId !== socket?.id) {
                    handleKickPlayer(notification.playerId);
                  }
                  setPlayerStatusNotifications(prev =>
                    prev.filter(n => n.id !== notification.id)
                  );
                }}
                className={`ml-2 hover:scale-110 transition-transform ${
                  isHost && notification.playerId && notification.playerId !== socket?.id
                    ? 'text-red-300 hover:text-red-200'
                    : 'text-white/80 hover:text-white'
                }`}
                title={isHost && notification.playerId && notification.playerId !== socket?.id ? '🚫 Expulsar' : '✖ Cerrar'}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}





      {/* Full-Screen Kick Notification Overlay */}
      {showKickNotificationScreen && kickNotificationData && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] font-orbitron backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-br from-red-900 via-red-800 to-purple-900 rounded-3xl p-8 border-2 border-red-500/50 shadow-2xl shadow-red-500/30 max-w-lg w-full mx-4 relative overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => {
                setShowKickNotificationScreen(false);
                setKickNotificationData(null);
                if (typeof clearJoinNotification === 'function') {
                  clearJoinNotification();
                }
              }}
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
                  <div className="text-8xl animate-bounce">🚫</div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent animate-glow">
                  JUGADOR EXPULSADO
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
              </div>

              <div className="bg-gradient-to-br from-black/40 to-red-900/20 rounded-2xl p-6 mb-6 border border-red-500/30 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-4xl animate-bounce">👤</div>
                  <span className="text-yellow-400 font-bold text-xl ml-3">{kickNotificationData.kickedPlayerName}</span>
                </div>
                <p className="text-white text-center text-lg leading-relaxed">
                  Ha sido {kickNotificationData.reason === 'ban' ? 'baneado' : 'expulsado'} de la sala
                </p>
              </div>

              {kickNotificationData.kickedBy && (
                <div className="bg-gradient-to-br from-red-900/60 to-black/40 rounded-2xl p-6 mb-6 border border-red-500/40 backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-4">
                    <div className="text-2xl">👑</div>
                    <span className="text-red-400 font-bold text-lg ml-2">Por el anfitrión:</span>
                  </div>
                  <p className="text-white text-center text-xl font-bold">{kickNotificationData.kickedBy}</p>
                </div>
              )}

              <div className="text-gray-400 text-sm animate-fade-in">
                Esta notificación se cerrará automáticamente
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MultiplayerScreen;
// END OF FILE MultiplayerScreen.jsx
