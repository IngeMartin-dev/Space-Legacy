import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { realtimeMultiplayerService, supabase } from '../../lib/supabase';

export const useMultiplayer = (currentUser = null) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [joinNotification, setJoinNotification] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [kickNotification, setKickNotification] = useState(null);
  const currentRoomRef = useRef(null);
  const supabaseChannelRef = useRef(null);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    if (currentRoom) {
      const roomState = {
        roomCode: currentRoom,
        isHost: isHost,
        timestamp: Date.now()
      };
      localStorage.setItem('currentRoomState', JSON.stringify(roomState));
    } else {
      localStorage.removeItem('currentRoomState');
    }
  }, [currentRoom, isHost]);

  useEffect(() => {
    const savedRoomState = localStorage.getItem('currentRoomState');
    if (savedRoomState) {
      try {
        const roomState = JSON.parse(savedRoomState);
        if (Date.now() - roomState.timestamp < 5 * 60 * 1000) {
          setCurrentRoom(roomState.roomCode);
          setIsHost(roomState.isHost);

          const savedUserInfo = localStorage.getItem('currentUserInfo');
          if (savedUserInfo) {
            const userInfo = JSON.parse(savedUserInfo);
            localStorage.setItem('pendingReconnection', JSON.stringify({
              roomCode: roomState.roomCode,
              userInfo: userInfo,
              timestamp: Date.now()
            }));
          }
        } else {
          localStorage.removeItem('currentRoomState');
          localStorage.removeItem('currentUserInfo');
          localStorage.removeItem('pendingReconnection');
        }
      } catch (error) {
        console.warn('⚠️ Error restaurando estado de sala:', error);
        localStorage.removeItem('currentRoomState');
        localStorage.removeItem('currentUserInfo');
        localStorage.removeItem('pendingReconnection');
      }
    }
  }, []);

  useEffect(() => {
    // Use environment variable if available, otherwise determine based on hostname
    let serverUrl = import.meta.env.VITE_SERVER_URL;

    if (!serverUrl) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development - connect to server on port 3001
        serverUrl = 'http://localhost:3001';
        console.log('🏠 Local development - connecting to:', serverUrl);
        console.log('💡 Asegúrate de que el servidor esté corriendo con: npm run server');
      } else {
        // Production - require VITE_SERVER_URL to be set
        console.error('❌ ERROR CRÍTICO: VITE_SERVER_URL no está configurada para producción');
        console.error('🌐 Hostname actual:', window.location.hostname);
        console.error('💡 SOLUCIÓN: Configura VITE_SERVER_URL en Vercel con la URL de tu servidor backend');
        console.log('🔧 Ejemplo: https://tu-servidor.onrender.com');
        console.log('📋 PASOS PARA CONFIGURAR:');
        console.log('   1. Despliega tu servidor backend (Railway, Render, etc.)');
        console.log('   2. Copia la URL del servidor desplegado');
        console.log('   3. Ve a Vercel > Tu proyecto > Settings > Environment Variables');
        console.log('   4. Agrega: VITE_SERVER_URL = https://tu-servidor-desplegado.com');
        console.log('   5. Redeploy el proyecto en Vercel');

        setError('🚫 SERVIDOR NO CONFIGURADO: Multiplayer no disponible. Configura VITE_SERVER_URL en Vercel para habilitar conexiones globales.');
        // Don't return - allow local room creation even without server
      }
    } else {
      console.log('🔧 Using VITE_SERVER_URL from env:', serverUrl);
      console.log('🌐 Intentando conectar a servidor remoto...');
    }

    console.log('✅ Final server URL:', serverUrl);

    // Health check before attempting Socket.IO connection
    const performHealthCheck = async () => {
      try {
        console.log('🏥 Verificando estado del servidor...');
        const healthResponse = await fetch(`${serverUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Timeout after 5 seconds
          signal: AbortSignal.timeout(5000)
        });

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('✅ Servidor responde correctamente:', healthData);
          console.log('📊 Conexiones activas:', healthData.connections);
          console.log('🏠 Salas activas:', healthData.rooms);
          return true;
        } else {
          console.error('❌ Servidor responde con error:', healthResponse.status, healthResponse.statusText);
          return false;
        }
      } catch (error) {
        console.error('❌ Error en health check:', error.message);
        if (error.name === 'TimeoutError') {
          console.error('⏰ Timeout: El servidor no responde en 5 segundos');
        } else if (error.message.includes('fetch')) {
          console.error('🌐 Error de red: No se puede conectar al servidor');
        }
        return false;
      }
    };

    // Only attempt Socket.IO connection if server is available
    const initializeConnection = async () => {
      const serverHealthy = await performHealthCheck();

      if (!serverHealthy) {
        console.error('🚫 Servidor no disponible, saltando conexión Socket.IO');
        setError('🚫 SERVIDOR NO DISPONIBLE: Verifica que el servidor esté ejecutándose y accesible.');
        return;
      }

      console.log('🎯 Servidor saludable, iniciando conexión Socket.IO...');

      const newSocket = io(serverUrl, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        timeout: 10000, // Increased for better global connections
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 20, // More attempts for global connections
        reconnectionDelay: 1000, // Stable delay
        reconnectionDelayMax: 5000, // Max delay
        randomizationFactor: 0.5,
        // Performance optimizations
        upgrade: true,
        rememberUpgrade: true,
        maxReconnectionAttempts: 20,
        // Better ping settings for global connections
        pingTimeout: 30000,
        pingInterval: 30000
      });

      newSocket.on('connect', () => {
        console.log('🔗 Socket conectado exitosamente - ID:', newSocket.id);
        setIsConnected(true);
        setError('');
        setIsReconnecting(false);

        // Send user info immediately after connection
        const sendUserInfo = (user) => {
          if (user && user.username) {
            console.log('👤 Enviando info de usuario:', user.username);
            newSocket.emit('userConnected', {
              username: user.username,
              avatar: user.avatar,
              ship: user.equippedShip
            });
          }
        };

        // Send user info if available
        if (currentUser) {
          sendUserInfo(currentUser);
        } else {
          // Try to get user info from localStorage
          const savedUserInfo = localStorage.getItem('currentUserInfo');
          if (savedUserInfo) {
            try {
              const userInfo = JSON.parse(savedUserInfo);
              newSocket.emit('userConnected', {
                username: userInfo.name,
                avatar: userInfo.avatar,
                ship: userInfo.ship
              });
            } catch (error) {
              console.warn('⚠️ Error obteniendo información del usuario desde localStorage:', error);
            }
          }
        }

        // Also send user info when currentUser becomes available (for login after connection)
        if (currentUser && !newSocket.userInfoSent) {
          sendUserInfo(currentUser);
          newSocket.userInfoSent = true;
        }

        // Test the connection immediately
        newSocket.emit('ping', { timestamp: Date.now(), test: 'connection_test' });

        // Handle pending reconnection
        const pendingReconnection = localStorage.getItem('pendingReconnection');
        if (pendingReconnection) {
          try {
            const reconnectionData = JSON.parse(pendingReconnection);
            if (Date.now() - reconnectionData.timestamp < 5 * 60 * 1000) {
              setTimeout(() => {
                if (newSocket.connected) {
                  newSocket.emit('requestRoomUpdate', { roomCode: reconnectionData.roomCode });
                }
              }, 500);
            } else {
              localStorage.removeItem('pendingReconnection');
              localStorage.removeItem('currentRoomState');
              localStorage.removeItem('currentUserInfo');
            }
          } catch (error) {
            console.warn('⚠️ Error procesando reconexión pendiente:', error);
            localStorage.removeItem('pendingReconnection');
            localStorage.removeItem('currentRoomState');
            localStorage.removeItem('currentUserInfo');
          }
        }

        // Load available rooms when connected
        setTimeout(() => {
          if (newSocket.connected) {
            getAvailableRooms();
            console.log('📊 Cargando salas disponibles...');
          }
        }, 1000);

        // Show connection success notification
        console.log('✅ Conexión exitosa al servidor multiplayer');
        console.log('🌐 Socket ID:', newSocket.id);
        console.log('🎮 Listo para multiplayer');
      });

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);

        if (reason === 'io server disconnect') {
          setError('Servidor desconectado');
        } else if (reason === 'transport close' || reason === 'ping timeout') {
          setIsReconnecting(true);
          setError('Reconectando...');
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('❌ Error de conexión:', err.message);
        console.error('🔍 Detalles del error:', {
          message: err.message,
          type: err.type,
          description: err.description,
          context: err.context
        });
        setIsConnected(false);

        // Provide better error messages based on the situation
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          console.error('🌐 ERROR EN PRODUCCIÓN: No se puede conectar al servidor remoto');
          console.error('💡 SOLUCIÓN: Verifica que VITE_SERVER_URL esté configurada correctamente en Vercel');
          console.error('🔧 URL intentada:', serverUrl);
          setError('🚫 ERROR DE CONEXIÓN: Servidor remoto no disponible. Verifica configuración de VITE_SERVER_URL en Vercel.');
        } else {
          console.error('🏠 ERROR EN LOCAL: No se puede conectar al servidor local');
          console.error('💡 SOLUCIÓN: Asegúrate de que el servidor esté corriendo con: npm run server');
          console.error('🔧 URL intentada:', serverUrl);
          setError(`🚫 ERROR DE CONEXIÓN: Servidor local no disponible en ${serverUrl}. Ejecuta: npm run server`);
        }
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconexión exitosa después de ${attemptNumber} intentos`);
        setIsConnected(true);
        setError('');
        setIsReconnecting(false);

        // Solicitar actualización de la sala actual después de reconectar
        if (currentRoomRef.current) {
          console.log('📡 Solicitando actualización de sala después de reconexión...');
          setTimeout(() => {
            if (newSocket.connected) {
              newSocket.emit('requestRoomUpdate', { roomCode: currentRoomRef.current });
              console.log('✅ Solicitud de actualización enviada');
            }
          }, 1000);
        }
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        setIsReconnecting(true);
      });

      newSocket.on('reconnect_failed', () => {
        setIsReconnecting(false);
        setError('No se pudo reconectar al servidor');
      });

      // Handle pong response for connection testing
      newSocket.on('pong', (data) => {
        // Connection test response - no logging needed
      });

      // Handle connection info response
      newSocket.on('connectionInfo', (data) => {
        // Connection info received - no logging needed for production
      });

      newSocket.on('roomCreated', (data) => {
        setCurrentRoom(data.roomCode);
        const playersArray = Array.isArray(data.players) ? data.players : [];

        // Ensure all players have required properties
        const processedPlayers = playersArray.map(player => ({
          id: player.id,
          name: player.name || 'Jugador desconocido',
          avatar: player.avatar || '👤',
          ship: player.ship || 'ship1',
          equippedPet: player.equippedPet || null,
          petLevels: player.petLevels || {},
          inGame: player.inGame || false
        }));

        setRoomPlayers(processedPlayers);
        setIsHost(true);
        setError('');

        // Save user info for reconnection
        if (currentUser) {
          localStorage.setItem('currentUserInfo', JSON.stringify({
            name: currentUser.username,
            avatar: currentUser.avatar,
            ship: currentUser.equippedShip
          }));
        }

        // Clear any pending reconnection data
        localStorage.removeItem('pendingReconnection');
      });

      newSocket.on('roomJoined', (data) => {
        setCurrentRoom(data.roomCode);
        const playersArray = Array.isArray(data.players) ? data.players : [];

        // Ensure all players have required properties
        const processedPlayers = playersArray.map(player => ({
          id: player.id,
          name: player.name || 'Jugador desconocido',
          avatar: player.avatar || '👤',
          ship: player.ship || 'ship1',
          equippedPet: player.equippedPet || null,
          petLevels: player.petLevels || {},
          inGame: player.inGame || false
        }));

        // Only update roomPlayers if we don't have players already (to avoid conflicts with playerJoined)
        setRoomPlayers(prevPlayers => {
          if (prevPlayers.length === 0) {
            return processedPlayers;
          } else {
            return prevPlayers;
          }
        });
        setIsHost(data.isHost);
        setError('');

        // Save user info for reconnection
        if (currentUser) {
          localStorage.setItem('currentUserInfo', JSON.stringify({
            name: currentUser.username,
            avatar: currentUser.avatar,
            ship: currentUser.equippedShip
          }));
        }

        // Clear any pending reconnection data
        localStorage.removeItem('pendingReconnection');
      });

      newSocket.on('playerJoined', (data) => {
        const eventTime = Date.now();
        const playersArray = Array.isArray(data.players) ? data.players : [];

        console.log('🎯 EVENTO playerJoined RECIBIDO:', {
          newPlayer: data.newPlayer,
          totalPlayers: playersArray.length,
          socketId: newSocket.id
        });

        // Update players list first
        setRoomPlayers(playersArray);
        console.log('✅ Lista de jugadores actualizada:', playersArray.map(p => p.name));

        // Mostrar notificación de jugador que se unió (solo si no es el propio usuario)
        if (data.newPlayer?.id !== newSocket.id) {
          console.log('🔔 Mostrando notificación para nuevo jugador:', data.newPlayer?.name);
          const notificationData = {
            playerName: data.newPlayer?.name || 'Jugador',
            avatar: data.newPlayer?.avatar || '🎉',
            timestamp: eventTime,
            isLeaving: false,
            reason: 'join'
          };
          setJoinNotification(notificationData);
          console.log('✅ Notificación de unión enviada');
        } else {
          console.log('🚫 No mostrar notificación (soy yo mismo)');
        }
      });

      newSocket.on('playerLeft', (data) => {
        const playersArray = Array.isArray(data.players) ? data.players : [];

        // Check if the leaving player is the current user
        const isCurrentUserLeaving = data.leftPlayerId === newSocket.id;

        if (isCurrentUserLeaving) {
          // Current user is leaving - only clear if not already cleared
          if (currentRoomRef.current) {
            setCurrentRoom(null);
            setRoomPlayers([]);
            setIsHost(false);
            setError('');
          }
          // Don't show notification when current user leaves
        } else {
          // Other player left - update player list only if we're still in a room
          if (currentRoomRef.current) {
            // Always use server-provided list for consistency
            setRoomPlayers(prevPlayers => {
              return playersArray;
            });

            if (data.newHost) {
              setIsHost(data.newHost === newSocket.id);
            }

            // Mostrar notificación de jugador que salió
            const notificationData = {
              playerName: data.leftPlayerName,
              avatar: data.reason === 'kick' ? '🚫' : data.reason === 'ban' ? '🚫' : '👋',
              timestamp: Date.now(),
              isLeaving: true,
              reason: data.reason || 'leave'
            };

            // Small delay to ensure state update is processed
            setTimeout(() => {
              setJoinNotification(notificationData);
            }, 100);
          }
        }
      });


      newSocket.on('gameStarted', (data) => {
        const playersArray = Array.isArray(data.players) ? data.players : [];
        setRoomPlayers(playersArray);
        // Trigger game start for all players
        if (playersArray.length > 0) {
        }
      });

      newSocket.on('playerMoved', (data) => {
        // This will be handled by App.jsx
        console.log('🎯 Jugador se movió:', data.playerId, 'a', data.x, data.y);
      });

      newSocket.on('playerShoot', (bulletData) => {
        // This will be handled by App.jsx
        console.log('🔫 Jugador disparó:', bulletData.playerId);
      });

      newSocket.on('powerupTaken', (data) => {
        // This will be handled by the game state to remove powerup for all players
        console.log('⚡ Power-up tomado por otro jugador:', data.powerupId, 'por', data.playerId);
      });

      newSocket.on('coinTaken', (data) => {
        // This will be handled by the game state to remove coin for all players
        console.log('🪙 Moneda tomada por otro jugador:', data.coinId, 'por', data.playerId);
      });

      newSocket.on('joinError', (message) => {
        setError(message);
        setCurrentRoom(null);
        setRoomPlayers([]);
        setIsHost(false);
      });

      newSocket.on('gameError', (message) => {
        setError(message);
      });

      newSocket.on('playerKicked', (data) => {
        console.log('🚫 Jugador fue expulsado:', data);
        // For kicked players, show comprehensive kick screen
        setKickNotification({
          message: data.reason || 'Has sido expulsado de la partida',
          hostName: data.hostName || 'Anfitrión',
          timestamp: Date.now(),
          isBan: true, // Use ban screen UI for comprehensive kick experience
          banData: {
            reason: data.reason || 'Expulsado de la sala por el anfitrión',
            bannedBy: data.hostName || 'Anfitrión',
            banEnd: null, // No end time for kicks
            isPermanent: false, // Kicks are not permanent bans
            banStart: new Date().toISOString(),
            isKickOnly: true // Flag to distinguish kicks from actual bans
          }
        });
        // Clear room data immediately
        setCurrentRoom(null);
        setRoomPlayers([]);
        setIsHost(false);
        setError('');
      });

      newSocket.on('userBanned', (banData) => {
        console.log('🚫 Usuario baneado detectado:', banData);
        setKickNotification({
          message: banData.reason || 'Has sido baneado del juego',
          hostName: banData.bannedBy || 'Administrador',
          timestamp: Date.now(),
          isBan: true,
          banData: banData
        });
        // Clear room data immediately
        setCurrentRoom(null);
        setRoomPlayers([]);
        setIsHost(false);
        setError('');
      });

      newSocket.on('playerKickedNotification', (data) => {
        console.log('🚫 Notificación de jugador expulsado:', data);

        // Show notification to all players in the room about the kick
        const notificationData = {
          playerName: data.kickedPlayerName,
          avatar: '🚫',
          timestamp: data.timestamp,
          isLeaving: true,
          reason: data.isBan ? 'ban' : 'kick',
          kickedBy: data.kickedBy
        };
        setJoinNotification(notificationData);

        // Immediately remove the kicked player from the local list for instant UI update
        setRoomPlayers(prevPlayers => prevPlayers.filter(p => p.name !== data.kickedPlayerName));
      });

      // Handle room updates after reconnection
      newSocket.on('roomUpdated', (data) => {

        setCurrentRoom(data.roomCode);
        const playersArray = Array.isArray(data.players) ? data.players : [];

        // Ensure all players have required properties
        const processedPlayers = playersArray.map(player => ({
          id: player.id,
          name: player.name || 'Jugador desconocido',
          avatar: player.avatar || '👤',
          ship: player.ship || 'ship1',
          equippedPet: player.equippedPet || null,
          petLevels: player.petLevels || {},
          inGame: player.inGame || false
        }));

        setRoomPlayers(processedPlayers);
        setIsHost(data.isHost);

        // Clear pending reconnection data since we successfully reconnected
        localStorage.removeItem('pendingReconnection');

        // Ensure current user is in the player list
        const currentUserInList = processedPlayers.find(player => player.id === newSocket.id);
        if (!currentUserInList && processedPlayers.length > 0) {
          // Request room update again to ensure we have the latest data
          setTimeout(() => {
            if (newSocket.connected) {
              newSocket.emit('requestRoomUpdate', { roomCode: data.roomCode });
            }
          }, 1000);
        }

      });


      setSocket(newSocket);

      return () => {
        if (newSocket.connected) {
          newSocket.disconnect();
        }
        newSocket.off();

        // Cleanup Supabase subscriptions
        if (supabaseChannelRef.current) {
          supabaseChannelRef.current.unsubscribe();
          supabaseChannelRef.current = null;
        }
      };
    };

    // Initialize connection
    initializeConnection();
  }, [currentUser]);

  // Supabase real-time subscriptions for room changes - DISABLED to avoid conflicts with socket events
  // The socket events handle player updates more reliably and in real-time
  useEffect(() => {
    if (!currentRoom) {
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.unsubscribe();
        supabaseChannelRef.current = null;
      }
      return;
    }

    // Configure Supabase subscriptions for room changes

    // DISABLED: Supabase player updates to avoid conflicts with socket events
    // The socket events (playerJoined, playerLeft) handle player list updates more reliably
    
    const playerChannel = realtimeMultiplayerService.subscribeToPlayers(currentRoom, (payload) => {

      if (payload.eventType === 'INSERT') {
        // Player joined
        setRoomPlayers(prev => {
          const newPlayers = [...prev];
          const existingIndex = newPlayers.findIndex(p => p.id === payload.new.player_id);
          if (existingIndex === -1) {
            newPlayers.push({
              id: payload.new.player_id,
              name: payload.new.player_name,
              avatar: payload.new.player_avatar,
              ship: payload.new.player_ship,
              equippedPet: payload.new.equippedPet || null,
              petLevels: payload.new.petLevels || {},
              inGame: false
            });
          }
          return newPlayers;
        });
      } else if (payload.eventType === 'DELETE') {
        // Player left
        setRoomPlayers(prev => prev.filter(p => p.id !== payload.old.player_id));
      }
    });

    supabaseChannelRef.current = playerChannel;
  
    return () => {
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.unsubscribe();
        supabaseChannelRef.current = null;
      }
    };
  }, [currentRoom]);

  // Send user info when currentUser becomes available
  useEffect(() => {
    if (currentUser && socket && socket.connected && !socket.userInfoSent) {
      socket.emit('userConnected', {
        username: currentUser.username,
        avatar: currentUser.avatar,
        ship: currentUser.equippedShip
      });
      socket.userInfoSent = true;
    }
  }, [currentUser, socket]);

  const connect = useCallback(() => {
    if (socket && !socket.connected) {
      setError('Conectando...');
      socket.connect();
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket && socket.connected) {
      socket.disconnect();
      setCurrentRoom(null);
      setRoomPlayers([]);
      setIsHost(false);
    }
  }, [socket]);

  const createRoom = useCallback((playerData) => {
    if (socket && socket.connected) {
      socket.emit('createRoom', playerData);
      setError('');
    } else {
      // Fallback: create room locally when no server connection
      if (currentUser) {
        const localRoomCode = 'LOCAL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const localPlayer = {
          id: 'local-user-' + Date.now(),
          name: currentUser.username,
          avatar: currentUser.avatar || '👨‍🚀',
          ship: currentUser.equippedShip || 'ship1',
          equippedPet: null,
          petLevels: {},
          inGame: false
        };

        console.log('🏠 CREANDO SALA LOCAL - Estado inicial:', {
          currentRoom: null,
          roomPlayers: [],
          isHost: false
        });

        setCurrentRoom(localRoomCode);
        setRoomPlayers([localPlayer]);
        setIsHost(true);
        setError('Modo Local - Sala creada exitosamente');

        console.log('✅ SALA LOCAL CREADA:', localRoomCode);
        console.log('👤 Jugador local:', localPlayer.name);
        console.log('📊 Estado final:', {
          currentRoom: localRoomCode,
          roomPlayers: [localPlayer],
          isHost: true
        });

        // Mostrar notificación de que la sala local fue creada
        setTimeout(() => {
          console.log('🎉 Sala local lista para usar');
        }, 500);
      } else {
        setError('No se puede crear sala: usuario no disponible');
      }
    }
  }, [socket, connect, currentUser]);

  const joinRoom = useCallback((roomCode, playerData) => {
    if (socket && socket.connected) {
      socket.emit('joinRoom', { roomCode: roomCode.toUpperCase(), playerData });
      setError('');
    } else {
      setError('No se puede unir a salas multiplayer sin conexión al servidor. Configura VITE_SERVER_URL en Vercel.');
    }
  }, [socket, connect]);

  const leaveRoom = useCallback(() => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('leaveRoom');

      setCurrentRoom(null);
      setRoomPlayers([]);
      setIsHost(false);
      setError('');
      setKickNotification(null);

      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.unsubscribe();
        supabaseChannelRef.current = null;
      }
    } else {
      // Also clear local room state
      setCurrentRoom(null);
      setRoomPlayers([]);
      setIsHost(false);
      setError('');
      setKickNotification(null);
    }
  }, [socket, currentRoom]);

  // Fallback mechanism to ensure player list is updated
  useEffect(() => {
    if (!currentRoom && roomPlayers.length > 0) {
      setRoomPlayers([]);
    }
  }, [currentRoom, roomPlayers.length]);


  const startGame = useCallback(() => {
    if (socket && socket.connected && currentRoom && isHost) {
      socket.emit('startGame');
    }
  }, [socket, currentRoom, isHost]);

  const sendPlayerMove = useCallback((position) => {
    if (socket && socket.connected && currentRoom) {
      // Send movement updates more frequently for real-time synchronization
      const now = Date.now();
      if (!sendPlayerMove.lastSent || now - sendPlayerMove.lastSent > 16) { // ~60 FPS for ultra-smooth movement
        socket.emit('playerMove', {
          ...position,
          timestamp: now,
          roomCode: currentRoom,
          // Add client-side prediction data for smoother experience
          predictedX: position.x,
          predictedY: position.y
        });
        sendPlayerMove.lastSent = now;
      }
    }
  }, [socket, currentRoom]);

  const sendPlayerShoot = useCallback((bulletData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('playerShoot', {
        ...bulletData,
        timestamp: Date.now(),
        roomCode: currentRoom
      });
    }
  }, [socket, currentRoom]);


  const forceReconnect = useCallback(() => {
    if (socket) {
      const wasInRoom = currentRoomRef.current;
      socket.disconnect();
      setTimeout(() => {
        socket.connect();
        // If we were in a room, request an update after reconnecting
        if (wasInRoom) {
          setTimeout(() => {
            if (socket.connected) {
              socket.emit('requestRoomUpdate', { roomCode: wasInRoom });
            }
          }, 2000);
        }
      }, 1000);
    }
  }, [socket]);

  const sendEnemyDestroyed = useCallback((enemyData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('enemyDestroyed', enemyData);
    }
  }, [socket, currentRoom]);

  const sendLevelCompleted = useCallback((levelData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('levelCompleted', levelData);
    }
  }, [socket, currentRoom]);

  const sendEnemyShoot = useCallback((bulletData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('enemyShoot', bulletData);
    }
  }, [socket, currentRoom]);

  const sendPowerupTaken = useCallback((powerupData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('powerupTaken', powerupData);
    }
  }, [socket, currentRoom]);

  const sendCoinTaken = useCallback((coinData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('coinTaken', coinData);
    }
  }, [socket, currentRoom]);

  const sendEnemyUpdate = useCallback((enemyData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('enemyUpdate', enemyData);
    }
  }, [socket, currentRoom]);

  const sendGameStateUpdate = useCallback((gameStateData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('gameStateUpdate', gameStateData);
    }
  }, [socket, currentRoom]);

  const sendPlayerDeath = useCallback((deathData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('playerDeath', deathData);
    }
  }, [socket, currentRoom]);

  const sendPlayerRespawn = useCallback((respawnData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('playerRespawn', respawnData);
    }
  }, [socket, currentRoom]);

  const sendScoreUpdate = useCallback((scoreData) => {
    if (socket && socket.connected && currentRoom) {
      socket.emit('scoreUpdate', scoreData);
    }
  }, [socket, currentRoom]);

  // Get available rooms from Supabase
  const getAvailableRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const rooms = data.map(room => ({
        code: room.room_code,
        hostId: room.host_player_id,
        hostName: room.host_name,
        playerCount: room.player_count,
        maxPlayers: room.max_players,
        gameStarted: room.game_started,
        createdAt: room.created_at
      }));

      setAvailableRooms(rooms);
      return rooms;
    } catch (error) {
      console.error('❌ Error obteniendo salas disponibles:', error);
      return [];
    }
  }, []);

  const clearJoinNotification = useCallback(() => {
    setJoinNotification(null);
  }, []);
  const clearKickNotification = useCallback(() => setKickNotification(null), []);

  // Test connection function for debugging
  const testConnection = useCallback(() => {
    if (socket) {
      if (socket.connected) {
        socket.emit('ping', { timestamp: Date.now() });
      } else {
        socket.connect();
      }
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    currentRoom,
    roomPlayers,
    isHost,
    error,
    joinNotification,
    kickNotification,
    isReconnecting,
    availableRooms,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    sendPlayerMove,
    sendPlayerShoot,
    sendEnemyDestroyed,
    sendLevelCompleted,
    sendEnemyShoot,
    sendPowerupTaken,
    sendCoinTaken,
    sendEnemyUpdate,
    sendGameStateUpdate,
    sendPlayerDeath,
    sendPlayerRespawn,
    sendScoreUpdate,
    clearJoinNotification,
    clearKickNotification,
    forceReconnect,
    getAvailableRooms,
    testConnection
  };
};
