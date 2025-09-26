// START OF FILE App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import StartScreen from './components/StartScreen';
import LocalMultiplayerSetup from './components/LocalMultiplayerSetup';
import MultiplayerScreen from './components/MultiplayerScreen';
import GameCanvas from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import PauseScreen from './components/PauseScreen';
import ReconnectScreen from './components/ReconnectScreen';
import AdminPanel from './components/AdminPanel';
import ShopScreen from './components/ShopScreen';
import HighScoresScreen from './components/HighScoresScreen';
import ControlsScreen from './components/ControlsScreen';
import UserCustomizationScreen from './components/UserCustomizationScreen';
import PlayerNotification from './components/PlayerNotification';
import ExpulsionScreen from './components/ExpulsionScreen';
import { useGameState } from './components/hooks/useGameState';
import { useMultiplayer } from './components/hooks/useMultiplayer';
import { userService } from './lib/supabase';

const SpectatorOverlay = () => (
  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 font-orbitron animate-fade-in">
    <h2 className="text-5xl font-bold text-red-500 animate-pulse">HAS SIDO ELIMINADO</h2>
    <p className="text-xl text-gray-300 mt-4 animate-pulse-slow">Observando al resto del equipo...</p>
  </div>
);

const LevelUpOverlay = () => (
  <div className="absolute inset-0 bg-blue-900/50 flex flex-col items-center justify-center z-30 font-orbitron animate-slide-in">
    <h1 className="text-7xl font-bold text-teal-400 animate-glow animate-pulse">¡NIVEL SUPERADO!</h1>
    <p className="text-2xl text-white mt-4 animate-pulse-slow">Preparando la siguiente oleada...</p>
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showUserCustomization, setShowUserCustomization] = useState(false);
  const [expulsionData, setExpulsionData] = useState(null);

  const keysRef = useRef({});
  const lastShootTimeRef = useRef({});

  const {
    socket, isConnected, currentRoom, roomPlayers, isHost, error: multiplayerError, joinNotification, kickNotification, isReconnecting,
    connect, disconnect, createRoom, joinRoom, leaveRoom,
    startGame: startMultiplayerGame, sendPlayerMove, sendPlayerShoot, sendEnemyDestroyed, sendLevelCompleted, sendEnemyShoot, sendPowerupTaken, sendCoinTaken,
    sendEnemyUpdate, sendGameStateUpdate, sendPlayerDeath, sendPlayerRespawn, sendScoreUpdate,
    clearJoinNotification, clearKickNotification, forceReconnect
  } = useMultiplayer(currentUser);

  const {
    gameState, players, enemies, bullets, powerups, coins, explosions, levelUpAnimation, gameSeed,
    startGame, pauseGame, backToMenu, setPlayers, setBullets
  } = useGameState(keysRef, lastShootTimeRef, currentUser, sendPlayerMove, sendPlayerShoot, sendEnemyDestroyed, sendLevelCompleted, sendEnemyShoot, sendPowerupTaken, sendCoinTaken, sendEnemyUpdate, sendGameStateUpdate, sendPlayerDeath, sendPlayerRespawn, sendScoreUpdate);

  const handleStartGame = useCallback((playerConfigs) => {
    const validPlayerConfigs = Array.isArray(playerConfigs) ? playerConfigs : [];
    console.log('handleStartGame configuraciones de jugador:', validPlayerConfigs);
    if (startGame(validPlayerConfigs)) {
      setCurrentScreen('game');
    }
  }, [startGame]);

  const handlePause = useCallback(() => {
    if (gameState.gameRunning) {
      pauseGame();
    }
  }, [gameState.gameRunning, pauseGame]);

  const handleBackToMenu = useCallback(() => {
    if (currentRoom) leaveRoom();
    backToMenu();
    setCurrentScreen('start');
  }, [currentRoom, leaveRoom, backToMenu]);

  const initialControls = {
    p1: { left: 'KeyA', right: 'KeyD', shoot: 'Space' },
    p2: { left: 'KeyF', right: 'KeyH', shoot: 'Enter' },
    p3: { left: 'KeyJ', right: 'KeyL', shoot: 'NumpadEnter' },
    p4: { left: 'ArrowLeft', right: 'ArrowRight', shoot: 'NumpadAdd' }
  };
  const [controls, setControls] = useState(initialControls);

  const [shopData, setShopData] = useState({
    coins: 0,
    items: {
      ship1: { owned: true, equipped: true }, ship2: { owned: false }, ship3: { owned: false },
      ship4: { owned: false }, ship5: { owned: false }, ship6: { owned: false },
      ship7: { owned: false }, ship8: { owned: false }, ship9: { owned: false },
      ship10: { owned: false }, ship11: { owned: false }, ship12: { owned: false },
      ship13: { owned: false }, ship14: { owned: false }, ship15: { owned: false },
      ship16: { owned: false }, admin1: { owned: false }, admin2: { owned: false },
      heartShip: { owned: false },
      doubleCoins: { owned: false, equipped: false },
      healthRegen: { owned: false, equipped: false },
      bulletPierce: { owned: false, equipped: false },
      autoShooterPet: { owned: false, equipped: false },
      magnetPet: { owned: false, equipped: false },
    }
  });

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('spaceInvadersData');
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.shopData) setShopData(data.shopData);
        if (data.controls && typeof data.controls === 'object') {
          setControls(prevControls => {
            const newControls = { ...initialControls };
            for (const pKey in newControls) {
              if (data.controls[pKey]) {
                newControls[pKey] = { ...newControls[pKey], ...data.controls[pKey] };
              }
            }
            return newControls;
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      localStorage.removeItem('spaceInvadersData');
      setShopData({
        coins: 0,
        items: {
          ship1: { owned: true, equipped: true }, ship2: { owned: false }, ship3: { owned: false },
          ship4: { owned: false }, ship5: { owned: false }, ship6: { owned: false },
          ship7: { owned: false }, ship8: { owned: false }, ship9: { owned: false },
          ship10: { owned: false }, ship11: { owned: false }, ship12: { owned: false },
          ship13: { owned: false }, ship14: { owned: false }, ship15: { owned: false },
          ship16: { owned: false }, admin1: { owned: false }, admin2: { owned: false },
          heartShip: { owned: false },
          doubleCoins: { owned: false, equipped: false },
          healthRegen: { owned: false, equipped: false },
          bulletPierce: { owned: false, equipped: false },
          autoShooterPet: { owned: false, equipped: false },
          magnetPet: { owned: false, equipped: false },
          healerPet: { owned: false, equipped: false },
          shieldPet: { owned: false, equipped: false },
          speedPet: { owned: false, equipped: false },
          bombPet: { owned: false, equipped: false },
          laserPet: { owned: false, equipped: false },
          teleportPet: { owned: false, equipped: false },
          freezePet: { owned: false, equipped: false },
          poisonPet: { owned: false, equipped: false },
          explosionPet: { owned: false, equipped: false },
          dronePet: { owned: false, equipped: false }
        }
      });
      setControls(initialControls);
    }
  }, []);

  // Reset all users' progress on app start (one-time reset)
  useEffect(() => {
    const resetProgress = async () => {
      try {
        await userService.resetAllUsersProgress();
        console.log('✅ All users progress reset');
      } catch (error) {
        console.error('❌ Error resetting progress:', error);
      }
    };

    // Reset all users' progress and set appropriate coin amounts
    resetProgress();
  }, []);

  // Database schema checking removed due to import issues
  // If you need to check database schema, run the SQL commands manually in Supabase dashboard

  useEffect(() => {
    if (currentUser) {
      setShopData(prev => {
        const newItemsState = { ...prev.items };
        Object.keys(newItemsState).forEach(itemId => {
          if (itemId.startsWith('ship')) {
            newItemsState[itemId] = { ...newItemsState[itemId], owned: (currentUser.unlockedShips || []).includes(itemId) || (itemId === 'ship1'), equipped: itemId === currentUser.equippedShip };
          } else if (['doubleCoins', 'healthRegen', 'bulletPierce'].includes(itemId)) {
            newItemsState[itemId] = { ...newItemsState[itemId], owned: (currentUser.unlockedUpgrades || []).includes(itemId), equipped: itemId === currentUser.equippedUpgrade };
          } else if (itemId.endsWith('Pet')) {
            // Handle all pet types including new ones
            newItemsState[itemId] = { ...newItemsState[itemId], owned: (currentUser.unlockedPets || []).includes(itemId), equipped: itemId === currentUser.equippedPet };
          }
        });
        newItemsState.ship1 = { ...newItemsState.ship1, owned: true };
        return { ...prev, coins: currentUser.coins, items: newItemsState };
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      // Save user data to Supabase
      const saveUserToSupabase = async () => {
        try {
          await userService.updateUser(currentUser.username, {
            coins: currentUser.coins,
            equipped_ship: currentUser.equippedShip,
            equipped_upgrade: currentUser.equippedUpgrade,
            equipped_pet: currentUser.equippedPet,
            unlocked_ships: currentUser.unlockedShips,
            unlocked_upgrades: currentUser.unlockedUpgrades,
            unlocked_pets: currentUser.unlockedPets,
            pet_levels: currentUser.petLevels,
            settings: currentUser.settings,
            avatar: currentUser.avatar
          });
          console.log('✅ Usuario guardado en Supabase');
        } catch (error) {
          console.error('❌ Error guardando usuario en Supabase:', error);
        }
      };

      saveUserToSupabase();

      // Keep localStorage for backwards compatibility and controls
      const userKey = `user_${currentUser.username}`;
      const userDataToSave = {
        ...currentUser,
        petLevels: currentUser.petLevels || {},
        unlockedShips: currentUser.unlockedShips || [],
        unlockedUpgrades: currentUser.unlockedUpgrades || [],
        unlockedPets: currentUser.unlockedPets || [],
        shopPurchases: {
          unlockedShips: currentUser.unlockedShips || [],
          unlockedUpgrades: currentUser.unlockedUpgrades || [],
          unlockedPets: currentUser.unlockedPets || [],
          petLevels: currentUser.petLevels || {},
          coins: currentUser.coins || 0
        }
      };

      localStorage.setItem(userKey, JSON.stringify(userDataToSave));

      // Also save global data for backwards compatibility
      localStorage.setItem('spaceInvadersData', JSON.stringify({
        user: userDataToSave,
        controls: controls,
        shopData: { coins: currentUser.coins }
      }));
    }
  }, [currentUser, controls]);

  useEffect(() => { if (currentUser && !isConnected) connect(); }, [currentUser, isConnected, connect]);



  // Handle expulsion screen navigation
  useEffect(() => {
    if (kickNotification && currentScreen === 'multiplayer') {
      console.log('🚫 Navegando a pantalla de expulsión:', kickNotification);
      setExpulsionData({
        reason: kickNotification.message,
        hostName: kickNotification.hostName,
        isBan: kickNotification.isBan,
        banData: kickNotification.banData
      });
      setCurrentScreen('expulsion');
    }
  }, [kickNotification, currentScreen]);


  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data) => {
      console.log('Jugador se unió al juego:', data);
      // Show notification for player joining during game
      if (gameState.gameRunning) {
        setNotification({
          type: 'join',
          playerName: data.newPlayer?.name || 'Jugador',
          message: `${data.newPlayer?.name || 'Jugador'} se unió a la partida`
        });
      }
    };

    const handlePlayerLeft = (data) => {
      console.log('Jugador salió del juego:', data);

      // If we're in a game and a player left, remove their ship from the game
      if (gameState.gameRunning && data.leftPlayerId) {
        // Add explosion effect for the leaving player
        const leavingPlayer = players.find(p => p.id === data.leftPlayerId);
        if (leavingPlayer) {
          // Add explosion effect using the game state
          const explosionEffect = {
            id: `leave-explosion-${Date.now()}`,
            x: leavingPlayer.x + leavingPlayer.width / 2,
            y: leavingPlayer.y + leavingPlayer.height / 2,
            size: 80,
            time: 0,
            duration: 1000
          };
          setExplosions(prev => [...prev, explosionEffect]);
        }

        // Remove the player after a short delay to show the explosion
        setTimeout(() => {
          setPlayers(prev => prev.filter(p => p.id !== data.leftPlayerId));
        }, 200);

        console.log(`🚫 Jugador ${data.leftPlayerName} eliminado del juego (salió de la sala)`);

        // Show a more prominent notification for player leaving during game
        setNotification({
          type: 'player_left_game',
          playerName: data.leftPlayerName,
          message: data.reason === 'kick'
            ? `${data.leftPlayerName} fue expulsado por el anfitrión`
            : `${data.leftPlayerName} se salió de la partida`,
          reason: data.reason || 'leave'
        });
      }
    };

    const handleGameStarted = (data) => {
      console.log('🎮 CLIENTE: ¡Evento gameStarted recibido!');
      console.log('🎮 CLIENTE: gameStarted data.players:', data.players);
      console.log('🎮 CLIENTE: gameStarted data.startTime:', data.startTime);
      const now = Date.now();
      const serverStartTime = data.startTime || now;
      const delay = Math.max(0, serverStartTime - now + 100); // Add 100ms buffer for synchronization

      console.log(`🎮 CLIENTE: Inicio de juego sincronizado - Hora del servidor: ${serverStartTime}, Hora del cliente: ${now}, Retraso: ${delay}ms`);

      setTimeout(() => {
        // Asegurar que cada jugador tenga sus propias mejoras
        const multiplayerPlayers = (Array.isArray(data.players) ? data.players : []).map((player, index) => {
          // Assign controls based on player index, but only for local player
          const isCurrentLocalUser = player.id === socket.id;
          const playerControls = isCurrentLocalUser ? controls.p1 : null;

          // All players get basic upgrades, but only local player gets personal upgrades
          const playerUpgrades = {
            equippedUpgrade: isCurrentLocalUser ? currentUser.equippedUpgrade : null,
            equippedPet: isCurrentLocalUser ? currentUser.equippedPet : null,
            unlockedShips: isCurrentLocalUser ? (currentUser.unlockedShips || []) : ['ship1'],
            unlockedUpgrades: isCurrentLocalUser ? (currentUser.unlockedUpgrades || []) : [],
            unlockedPets: isCurrentLocalUser ? (currentUser.unlockedPets || []) : [],
            coins: isCurrentLocalUser ? (currentUser.coins || 0) : 0,
            petLevels: isCurrentLocalUser ? (currentUser.petLevels || {}) : {},
            upgrades: isCurrentLocalUser ? {
              fireRate: (currentUser.unlockedUpgrades || []).includes('fireRate') ? (currentUser.petLevels?.fireRate || 1) : 1,
              damage: (currentUser.unlockedUpgrades || []).includes('damage') ? (currentUser.petLevels?.damage || 1) : 1,
              mobility: (currentUser.unlockedUpgrades || []).includes('mobility') ? (currentUser.petLevels?.mobility || 1) : 1
            } : {
              fireRate: 1,
              damage: 1,
              mobility: 1
            }
          };

          return {
            id: player.id,
            name: player.name,
            ship: player.ship || 'ship1', // Ensure ship has a default value
            avatar: player.avatar,
            x: 100 + (1400 - 200) / (data.players.length + 1) * (index + 1),
            y: 700,
            width: 60, height: 40,
            color: ['#0077FF', '#FF0000', '#00FF00', '#FFFF00'][index] || '#FFFFFF',
            isLocal: isCurrentLocalUser,
            isMultiplayer: true,
            controls: playerControls,
            isAdmin: isCurrentLocalUser && currentUser.isAdmin,
            settings: isCurrentLocalUser ? (currentUser.settings || {}) : {},
            lives: (isCurrentLocalUser && currentUser.isAdmin && currentUser.settings?.noclip) ? Infinity : 3,
            score: 0,
            coinsEarnedThisGame: 0,
            activePowerups: {},
            powerupInventory: isCurrentLocalUser ? (currentUser.powerupInventory || {}) : {},
            upgrades: {
              fireRate: 1,
              damage: 1,
              mobility: 1
            },
            ...playerUpgrades
          };
        });
        console.log('🎮 Iniciando juego multijugador con jugadores:', multiplayerPlayers);
        // Debug ship data
        multiplayerPlayers.forEach((player, index) => {
          console.log(`Jugador ${index + 1} (${player.name}): nave = ${player.ship}`);
        });

        // Apply level-based advantages to players
        const enhancedPlayers = multiplayerPlayers.map(player => {
          const playerLevel = player.petLevels ? Math.max(...Object.values(player.petLevels)) : 1;
          const levelMultiplier = 1 + (playerLevel - 1) * 0.1; // 10% bonus per level

          return {
            ...player,
            // Enhanced stats based on level
            maxHealth: 3 + Math.floor((playerLevel - 1) / 2), // +1 health every 2 levels
            damageMultiplier: levelMultiplier,
            speedMultiplier: levelMultiplier,
            fireRateMultiplier: levelMultiplier,
            // Visual indicator of level
            level: playerLevel,
            levelColor: playerLevel >= 5 ? '#FFD700' : playerLevel >= 3 ? '#FF6B35' : '#4CAF50'
          };
        });

        console.log('🎮 CLIENTE: Jugadores con ventajas por nivel:', enhancedPlayers.map(p => `${p.name}(Lv.${p.level})`));

        // Start multiplayer game synchronized with server-provided enemies and shared seed
        console.log('🎮 CLIENTE: Llamando startGame con jugadores mejorados:', enhancedPlayers.length, 'enemigos:', data.enemies?.length || 0, 'seed:', data.sharedGameSeed);
        const gameStarted = startGame(enhancedPlayers, data.enemies, data.level || 1, data.sharedGameSeed);
        console.log('🎮 CLIENTE: startGame retornó:', gameStarted);
        if (gameStarted) {
          console.log('🎮 CLIENTE: Estableciendo pantalla a juego');
          setCurrentScreen('game');
        } else {
          console.log('🎮 CLIENTE: Falló al iniciar juego');
        }
      }, delay);
    };

    const handlePlayerMoved = (data) => {
      setPlayers(prev => prev.map(p => {
        if (p.id === data.playerId) {
          // Smooth interpolation for better synchronization
          const lerpFactor = 0.3; // Adjust for smoothness vs responsiveness
          const newX = p.x + (data.x - p.x) * lerpFactor;
          const newY = p.y + (data.y - p.y) * lerpFactor;
          return { ...p, x: newX, y: newY };
        }
        return p;
      }));
    };

    const handlePlayerShoot = (bulletData) => {
      setBullets(prev => [...prev, bulletData]);
    };

    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('gameStarted', handleGameStarted);
    socket.on('playerMoved', handlePlayerMoved);
    socket.on('playerShoot', handlePlayerShoot);

    socket.on('enemyDestroyed', (data) => {
      console.log('💥 Enemigo destruido:', data);
      // Remove enemy from local state
      setEnemies(prev => prev.filter(e => e.id !== data.enemyId));
      // Add explosion effect
      setExplosions(prev => [...prev, {
        id: `explosion-${Date.now()}`,
        x: data.enemyX || 0,
        y: data.enemyY || 0,
        size: 50,
        time: 0,
        duration: 800
      }]);
      // Update score if this player destroyed the enemy
      if (data.playerId === socket.id) {
        setGameState(prev => ({ ...prev, score: (prev.score || 0) + (data.score || 150) }));
      }
    });

    socket.on('levelCompleted', (data) => {
      console.log('🎯 Nivel completado:', data);
      setEnemies(data.enemies || []);
      setGameState(prev => ({ ...prev, level: data.newLevel }));
      setLevelUpAnimation(true);
      setTimeout(() => setLevelUpAnimation(false), 2000);
    });

    socket.on('enemyShoot', (bulletData) => {
      console.log('🚀 Enemigo disparó:', bulletData);
      setBullets(prev => [...prev, bulletData]);
    });

    socket.on('powerupTaken', (data) => {
      console.log('⚡ Power-up tomado:', data);
      setPowerups(prev => prev.filter(p => p.id !== data.powerupId));
    });

    socket.on('coinTaken', (data) => {
      console.log('🪙 Moneda tomada:', data);
      setCoins(prev => prev.filter(c => c.id !== data.coinId));
    });

    socket.on('enemyUpdate', (data) => {
      console.log('🔄 Actualización de enemigo:', data);
      // Update enemy position/health for synchronization
      setEnemies(prev => prev.map(enemy =>
        enemy.id === data.enemyId
          ? { ...enemy, x: data.x, y: data.y, health: data.health }
          : enemy
      ));
    });

    socket.on('gameStateUpdate', (data) => {
      console.log('🎮 Actualización de estado del juego:', data);
      // Update game state for synchronization
      setGameState(prev => ({
        ...prev,
        level: data.level || prev.level,
        score: data.score || prev.score
      }));
    });

    socket.on('playerDeath', (data) => {
      console.log('💀 Jugador murió:', data);
      // Update player lives and show death effect
      setPlayers(prev => prev.map(player =>
        player.id === data.playerId
          ? { ...player, lives: data.lives || 0 }
          : player
      ));

      // Add death explosion effect
      setExplosions(prev => [...prev, {
        id: `death-exp-${Date.now()}`,
        x: data.x || 0,
        y: data.y || 0,
        size: 60,
        time: 0,
        duration: 600
      }]);

      // Show notification for player death
      setNotification({
        type: 'player_death',
        playerName: data.playerName,
        message: `${data.playerName} ha sido eliminado!`
      });
    });

    socket.on('playerRespawn', (data) => {
      console.log('🔄 Jugador reapareció:', data);
      // Update player position and lives
      setPlayers(prev => prev.map(player =>
        player.id === data.playerId
          ? {
              ...player,
              x: data.x || player.x,
              y: data.y || player.y,
              lives: data.lives || player.lives
            }
          : player
      ));

      // Show notification for player respawn
      setNotification({
        type: 'player_respawn',
        playerName: data.playerName,
        message: `${data.playerName} ha reaparecido!`
      });
    });

    socket.on('scoreUpdate', (data) => {
      console.log('📊 Actualización de puntuación:', data);
      // Update player score
      setPlayers(prev => prev.map(player =>
        player.id === data.playerId
          ? { ...player, score: data.score || player.score }
          : player
      ));
    });

    socket.on('enemyDestroyed', (data) => {
      console.log('💥 Enemigo destruido por otro jugador:', data);
      // Remove enemy from local state
      setEnemies(prev => prev.filter(e => e.id !== data.enemyId));
      // Add explosion effect
      setExplosions(prev => [...prev, {
        id: `remote-exp-${Date.now()}`,
        x: data.enemyX || 0,
        y: data.enemyY || 0,
        size: data.isBoss ? 100 : 50,
        time: 0,
        duration: 800
      }]);
      // Show notification for enemy destruction
      setNotification({
        type: 'enemy_destroyed',
        playerName: data.playerName,
        enemyType: data.enemyType,
        isBoss: data.isBoss,
        score: data.score,
        message: `${data.playerName} destruyó ${data.isBoss ? 'un jefe' : 'un enemigo'} ${data.enemyType}! +${data.score} puntos`
      });
    });

    socket.on('powerupTaken', (data) => {
      console.log('⚡ Power-up tomado por otro jugador:', data);
      // Remove power-up from local state
      setPowerups(prev => prev.filter(p => p.id !== data.powerupId));
      // Show notification for power-up collection
      setNotification({
        type: 'powerup_taken',
        playerName: data.playerName,
        powerupType: data.powerupType,
        message: `${data.playerName} tomó un power-up ${data.powerupType}!`
      });
    });

    return () => {
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('playerMoved');
      socket.off('playerShoot');
      socket.off('enemyDestroyed');
      socket.off('powerupTaken');
      socket.off('coinTaken');
      socket.off('enemyUpdate');
      socket.off('gameStateUpdate');
      socket.off('playerDeath');
      socket.off('playerRespawn');
      socket.off('scoreUpdate');
      socket.off('levelCompleted');
      socket.off('enemyShoot');
    };
  }, [socket, startGame, controls, currentUser, setPlayers, setBullets, setNotification]);

  const handleLogin = async (userData) => {
    // Check for special admin credentials
    const isSpecialAdmin = userData.username === 'Made' && userData.password === 'Made1130';

    const savedData = JSON.parse(localStorage.getItem('spaceInvadersData') || '{}');
    const savedUser = savedData.user || {};

    // Load user-specific data from localStorage
    const userKey = `user_${userData.username}`;
    const userSpecificData = JSON.parse(localStorage.getItem(userKey) || '{}');

    // Send login info to server for logging
    const loginData = {
      username: userData.username,
      isAdmin: userData.isAdmin || isSpecialAdmin,
      isSpecialAdmin: isSpecialAdmin,
      timestamp: new Date().toISOString(),
      ip: window.location.hostname
    };

    // Send to server via fetch for logging
    fetch('http://localhost:3000/api/login-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    }).catch(() => {}); // Ignore errors, just for logging

    // Load game progress from Supabase
    let gameProgress = {};
    try {
      const progressData = await userService.loadGameProgress(userData.username);
      if (progressData) {
        gameProgress = {
          currentLevel: progressData.current_level ?? progressData.currentLevel ?? 1,
          highScore: progressData.high_score ?? progressData.highScore ?? 0,
          totalGamesPlayed: progressData.total_games_played ?? progressData.totalGamesPlayed ?? 0,
          totalEnemiesDestroyed: progressData.total_enemies_destroyed ?? progressData.totalEnemiesDestroyed ?? 0,
          totalCoinsEarned: progressData.total_coins_earned ?? progressData.totalCoinsEarned ?? 0,
          lastPlayed: progressData.last_played ?? progressData.lastPlayed
        };
        console.log('✅ Progreso de juego cargado:', gameProgress);
      } else {
        // Fallback if no progress data
        gameProgress = {
          currentLevel: 1,
          highScore: 0,
          totalGamesPlayed: 0,
          totalEnemiesDestroyed: 0,
          totalCoinsEarned: 0,
          lastPlayed: null
        };
        console.log('ℹ️ No se encontró progreso de juego, usando valores por defecto');
      }
    } catch (error) {
      console.error('❌ Error cargando progreso de juego:', error);
      // Use default values on error
      gameProgress = {
        currentLevel: 1,
        highScore: 0,
        totalGamesPlayed: 0,
        totalEnemiesDestroyed: 0,
        totalCoinsEarned: 0,
        lastPlayed: null
      };
    }

    let mergedUser = {
      ...savedUser,
      ...userData,
      isAdmin: userData.isAdmin || isSpecialAdmin,
      isSpecialAdmin: isSpecialAdmin,
      petLevels: userSpecificData.petLevels || savedUser.petLevels || userData.petLevels || {},
      unlockedShips: userSpecificData.unlockedShips || savedUser.unlockedShips || userData.unlockedShips || [],
      unlockedUpgrades: userSpecificData.unlockedUpgrades || savedUser.unlockedUpgrades || userData.unlockedUpgrades || [], 
      unlockedPets: userSpecificData.unlockedPets || savedUser.unlockedPets || userData.unlockedPets || [],
      coins: userSpecificData.coins || savedUser.coins || userData.coins || 100000,
      // Add game progress
      gameProgress: gameProgress
    };

    if (!mergedUser.isAdmin) {
      const adminShips = ['admin1', 'admin2'];
      const adminUpgrades = ['doubleCoins', 'healthRegen', 'bulletPierce'];
      const adminPets = ['autoShooterPet', 'magnetPet'];

      mergedUser.unlockedShips = (mergedUser.unlockedShips || []).filter(id => !adminShips.includes(id));
      if (!mergedUser.unlockedShips.includes('ship1')) mergedUser.unlockedShips.push('ship1');
      if (!mergedUser.equippedShip || adminShips.includes(mergedUser.equippedShip)) mergedUser.equippedShip = 'ship1';
      mergedUser.unlockedUpgrades = (mergedUser.unlockedUpgrades || []).filter(id => !adminUpgrades.includes(id));
      if (adminUpgrades.includes(mergedUser.equippedUpgrade)) mergedUser.equippedUpgrade = null;
      mergedUser.unlockedPets = (mergedUser.unlockedPets || []).filter(id => !adminPets.includes(id));
      if (adminPets.includes(mergedUser.equippedPet)) mergedUser.equippedPet = null;
      if (mergedUser.avatar === '👑') mergedUser.avatar = '👨‍🚀';
      // Normal users get 100k coins minimum
      mergedUser.coins = Math.max(mergedUser.coins || 0, 100000);
      mergedUser.settings = {};
    } else {
      
      if (isSpecialAdmin) {
        mergedUser.unlockedShips = Array.from(new Set([...(mergedUser.unlockedShips || []), 'ship1', 'ship2', 'ship3', 'ship4', 'ship5', 'ship6', 'ship7', 'ship8', 'ship9', 'ship10', 'ship11', 'ship12', 'ship13', 'ship14', 'ship15', 'ship16', 'admin1', 'admin2']));
        mergedUser.equippedShip = mergedUser.equippedShip || 'admin1';
        mergedUser.unlockedUpgrades = Array.from(new Set([...(mergedUser.unlockedUpgrades || []), 'doubleCoins', 'healthRegen', 'bulletPierce']));
        mergedUser.equippedUpgrade = mergedUser.equippedUpgrade || 'doubleCoins';
        mergedUser.unlockedPets = Array.from(new Set([...(mergedUser.unlockedPets || []), 'autoShooterPet', 'magnetPet']));
        mergedUser.equippedPet = mergedUser.equippedPet || 'autoShooterPet';
        mergedUser.coins = 999999;
        mergedUser.avatar = '💖'; 
        mergedUser.settings = savedUser.settings || { noclip: false, superSpeed: false, rapidFire: false };
      } else {
        // Regular admin privileges
        mergedUser.unlockedShips = Array.from(new Set([...(mergedUser.unlockedShips || []), 'ship1', 'ship2', 'ship3', 'ship4', 'ship5', 'ship6', 'ship7', 'ship8', 'ship9', 'ship10', 'ship11', 'ship12', 'ship13', 'ship14', 'ship15', 'ship16', 'admin1', 'admin2']));
        mergedUser.equippedShip = mergedUser.equippedShip || 'admin1';
        mergedUser.unlockedUpgrades = Array.from(new Set([...(mergedUser.unlockedUpgrades || []), 'doubleCoins', 'healthRegen', 'bulletPierce']));
        mergedUser.equippedUpgrade = mergedUser.equippedUpgrade || 'doubleCoins';
        mergedUser.unlockedPets = Array.from(new Set([...(mergedUser.unlockedPets || []), 'autoShooterPet', 'magnetPet']));
        mergedUser.equippedPet = mergedUser.equippedPet || 'autoShooterPet';
        mergedUser.coins = 999999;
        mergedUser.avatar = '👑';
        mergedUser.settings = savedUser.settings || { noclip: false, superSpeed: false, rapidFire: false };
      }
    }
    // Regular users get 100k coins (outside the if-else block)
    mergedUser.coins = Math.max(mergedUser.coins || 0, 100000);
    

    setCurrentUser({
      ...mergedUser,
      controls: savedData.controls ?? initialControls,
    });
    setCurrentScreen('start');
  };

  const handleLogout = () => { if (isConnected) disconnect(); setCurrentUser(null); setCurrentScreen('login'); };
  const handleUpdateControls = useCallback((newControls) => { setControls(newControls); }, []);

  const handleUpdateAdminSettings = useCallback((settings) => setCurrentUser(prev => ({ ...prev, settings })), []);

  const handleBuyItem = useCallback(async (itemId, price, itemType) => {
    if (!currentUser) return;

    const itemIsAdminOnly = ['admin1', 'admin2'].includes(itemId);

    if (currentUser.isAdmin) {
      setCurrentUser(prev => {
        let updatedUser = { ...prev };
        if (itemType === 'ship') updatedUser.unlockedShips = Array.from(new Set([...(prev.unlockedShips || []), itemId]));
        if (itemType === 'upgrade') updatedUser.unlockedUpgrades = Array.from(new Set([...(prev.unlockedUpgrades || []), itemId]));
        if (itemType === 'pet') {
          updatedUser.unlockedPets = Array.from(new Set([...(prev.unlockedPets || []), itemId]));
          // Initialize pet level if it doesn't exist
          if (!updatedUser.petLevels) updatedUser.petLevels = {};
          if (!updatedUser.petLevels[itemId]) updatedUser.petLevels[itemId] = 1;
        }
        return updatedUser;
      });
      setShopData(prev => ({ ...prev, items: { ...prev.items, [itemId]: { owned: true, equipped: false } } }));
    } else if (!itemIsAdminOnly && (currentUser.coins || 0) >= price && !shopData.items[itemId]?.owned) {
      const newCoins = (currentUser.coins || 0) - price;
      let updatedUser = {
        ...currentUser,
        coins: newCoins,
      };

      if (itemType === 'ship') updatedUser.unlockedShips = Array.from(new Set([...(currentUser.unlockedShips || []), itemId]));
      if (itemType === 'upgrade') updatedUser.unlockedUpgrades = Array.from(new Set([...(currentUser.unlockedUpgrades || []), itemId]));
      if (itemType === 'pet') {
        updatedUser.unlockedPets = Array.from(new Set([...(currentUser.unlockedPets || []), itemId]));
        // Initialize pet level if it doesn't exist
        if (!updatedUser.petLevels) updatedUser.petLevels = {};
        if (!updatedUser.petLevels[itemId]) updatedUser.petLevels[itemId] = 1;
      }

      // Save to Supabase
      try {
        await userService.updateUser(currentUser.username, {
          coins: newCoins,
          unlocked_ships: updatedUser.unlockedShips,
          unlocked_upgrades: updatedUser.unlockedUpgrades,
          unlocked_pets: updatedUser.unlockedPets,
          pet_levels: updatedUser.petLevels
        });
        console.log('✅ Compra guardada en Supabase');
      } catch (error) {
        console.error('❌ Error guardando compra en Supabase:', error);
      }

      setCurrentUser(updatedUser);
      setShopData(prev => ({ ...prev, coins: newCoins, items: { ...prev.items, [itemId]: { owned: true, equipped: false } } }));
    } else if (!itemIsAdminOnly && (currentUser.coins || 0) < price) {
      alert("No tienes suficientes monedas para comprar este artículo.");
    }
  }, [currentUser, shopData.items]);

  const handleEquipItem = useCallback(async (itemId, itemType) => {
    if (!currentUser) return;

    let isOwned = false;
    if (itemType === 'ship') isOwned = (currentUser.unlockedShips || []).includes(itemId);
    if (itemType === 'upgrade') isOwned = (currentUser.unlockedUpgrades || []).includes(itemId);
    if (itemType === 'pet') isOwned = (currentUser.unlockedPets || []).includes(itemId);

    if (!isOwned && !currentUser.isAdmin) {
      alert("Debes poseer este ítem para equiparlo.");
      return;
    }

    const updatedUser = { ...currentUser };
    if (itemType === 'ship') updatedUser.equippedShip = itemId;
    if (itemType === 'upgrade') updatedUser.equippedUpgrade = itemId;
    if (itemType === 'pet') updatedUser.equippedPet = itemId;

    // Save equipment change to Supabase
    try {
      await userService.updateUser(currentUser.username, {
        equipped_ship: updatedUser.equippedShip,
        equipped_upgrade: updatedUser.equippedUpgrade,
        equipped_pet: updatedUser.equippedPet
      });
      console.log('✅ Equipo guardado en Supabase');
    } catch (error) {
      console.error('❌ Error guardando equipo en Supabase:', error);
    }

    setCurrentUser(updatedUser);

    setShopData(prev => {
      const newItemsState = { ...prev.items };
      for (const key in newItemsState) {
        if (newItemsState[key].equipped) {
          const currentItemType = key.startsWith('ship') ? 'ship' :
                                  (['doubleCoins', 'healthRegen', 'bulletPierce'].includes(key) ? 'upgrade' :
                                  (['autoShooterPet', 'magnetPet'].includes(key) ? 'pet' : null));
          if (currentItemType === itemType) {
            newItemsState[key] = { ...newItemsState[key], equipped: false };
          }
        }
      }
      newItemsState[itemId] = { ...newItemsState[itemId], equipped: true };
      return { ...prev, items: newItemsState };
    });
  }, [currentUser]);

  const handleStartSingle = useCallback(() => {
    const singlePlayer = [{
      id: currentUser.username,
      name: currentUser.username,
      x: 1400 / 2 - 30,
      y: 700,
      width: 60, height: 40,
      color: '#0077FF',
      ship: currentUser.equippedShip || 'ship1',
      isLocal: true,
      isMultiplayer: false,
      controls: controls.p1,
      isAdmin: currentUser.isAdmin,
      settings: currentUser.settings,
      equippedUpgrade: currentUser.equippedUpgrade,
      equippedPet: currentUser.equippedPet,
      avatar: currentUser.avatar,
      lives: currentUser.isAdmin && currentUser.settings?.noclip ? Infinity : 3,
      score: 0,
      coinsEarnedThisGame: 0,
      activePowerups: {},
      powerupInventory: currentUser.powerupInventory || {},
      upgrades: {
        fireRate: (currentUser.unlockedUpgrades || []).includes('fireRate') ? (currentUser.petLevels?.fireRate || 1) : 1,
        damage: (currentUser.unlockedUpgrades || []).includes('damage') ? (currentUser.petLevels?.damage || 1) : 1,
        mobility: (currentUser.unlockedUpgrades || []).includes('mobility') ? (currentUser.petLevels?.mobility || 1) : 1
      },
      unlockedShips: currentUser.unlockedShips || [],
      unlockedUpgrades: currentUser.unlockedUpgrades || [],
      unlockedPets: currentUser.unlockedPets || [],
      petLevels: currentUser.petLevels || {},
      coins: currentUser.coins || 0
    }];
    handleStartGame(singlePlayer);
  }, [currentUser, controls, handleStartGame]);

  const handleStartLocalMultiplayer = useCallback((playersConfig) => {
    const CANVAS_WIDTH = 1400;
    const localPlayersWithEquippedItems = (Array.isArray(playersConfig) ? playersConfig : []).map((p, index) => ({
      ...p,
      id: p.id || `local-player-${index}`,
      x: 100 + (CANVAS_WIDTH - 200) / (playersConfig.length + 1) * (index + 1),
      y: 700,
      width: 60, height: 40,
      ship: p.ship || (index === 0 ? currentUser.equippedShip : 'ship1'),
      equippedUpgrade: index === 0 ? currentUser.equippedUpgrade : null,
      equippedPet: index === 0 ? currentUser.equippedPet : null,
      avatar: index === 0 ? currentUser.avatar : p.avatar,
      isAdmin: index === 0 ? currentUser.isAdmin : false,
      settings: index === 0 ? (currentUser.settings || {}) : {},
      isLocal: true,
      isMultiplayer: false,
      lives: index === 0 && currentUser.isAdmin && currentUser.settings?.noclip ? Infinity : 3,
      score: 0,
      coinsEarnedThisGame: 0,
      activePowerups: {},
      powerupInventory: index === 0 ? (currentUser.powerupInventory || {}) : {},
      upgrades: index === 0 ? {
        fireRate: (currentUser.unlockedUpgrades || []).includes('fireRate') ? (currentUser.petLevels?.fireRate || 1) : 1,
        damage: (currentUser.unlockedUpgrades || []).includes('damage') ? (currentUser.petLevels?.damage || 1) : 1,
        mobility: (currentUser.unlockedUpgrades || []).includes('mobility') ? (currentUser.petLevels?.mobility || 1) : 1
      } : {
        fireRate: 1,
        damage: 1,
        mobility: 1
      },
      unlockedShips: index === 0 ? (currentUser.unlockedShips || []) : ['ship1'],
      unlockedUpgrades: index === 0 ? (currentUser.unlockedUpgrades || []) : [],
      unlockedPets: index === 0 ? (currentUser.unlockedPets || []) : [],
      petLevels: index === 0 ? (currentUser.petLevels || {}) : {},
      coins: index === 0 ? (currentUser.coins || 0) : 0
    }));
    handleStartGame(localPlayersWithEquippedItems);
  }, [currentUser, handleStartGame]);

  const handleNotificationClose = useCallback(() => setNotification(null), []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'KeyP' && gameState.gameRunning) {
        e.preventDefault();
        handlePause();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameRunning, handlePause]);

  const handleUpdateUser = useCallback(async (updatedUserData) => {
    const updatedUser = {
      ...currentUser,
      username: updatedUserData.username,
      avatar: updatedUserData.avatar,
    };

    // Save avatar change to Supabase
    try {
      await userService.updateUser(currentUser.username, {
        username: updatedUserData.username,
        avatar: updatedUserData.avatar
      });
      console.log('✅ Cambios de usuario guardados en Supabase');
    } catch (error) {
      console.error('❌ Error guardando cambios de usuario en Supabase:', error);
    }

    setCurrentUser(updatedUser);
    setShowUserCustomization(false);
  }, [currentUser]);

  if (currentUser === null) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === 'start') {
    return (
      <div className="animate-fade-in">
        <StartScreen
          user={currentUser}
          onStartSingle={handleStartSingle}
          onStartLocalMultiplayer={() => setCurrentScreen('localMultiplayer')}
          onStartMultiplayer={() => setCurrentScreen('multiplayer')}
          onShowShop={() => setCurrentScreen('shop')}
          onShowControls={() => setCurrentScreen('controls')}
          onShowHighScores={() => setCurrentScreen('highscores')}
          onShowAdminPanel={() => setShowAdminPanel(true)}
          onLogout={handleLogout}
          onCustomizeUser={() => setShowUserCustomization(true)}
          showAdminPanel={showAdminPanel}
        />
        {showAdminPanel && currentUser.isAdmin && (
          <AdminPanel user={currentUser} onUpdateSettings={handleUpdateAdminSettings} onClose={() => setShowAdminPanel(false)} />
        )}
      </div>
    );
  }

  if (showUserCustomization) {
    return <UserCustomizationScreen user={currentUser} onUpdateUser={handleUpdateUser} onBack={() => setShowUserCustomization(false)} />;
  }

  if (currentScreen === 'localMultiplayer') return <LocalMultiplayerSetup onBack={() => setCurrentScreen('start')} onStartGame={handleStartLocalMultiplayer} user={currentUser} controls={controls} />;

  if (currentScreen === 'multiplayer') {
    return (
      <>
        <MultiplayerScreen
          onBack={() => setCurrentScreen('start')}
          onCreateRoom={() => createRoom({ name: currentUser.username, avatar: currentUser.avatar, ship: currentUser.equippedShip, equippedPet: currentUser.equippedPet, petLevels: currentUser.petLevels, playerLevel: Math.max(...Object.values(currentUser.petLevels || {default: 1})) })}
          onJoinRoom={(code) => joinRoom(code, { name: currentUser.username, avatar: currentUser.avatar, ship: currentUser.equippedShip, equippedPet: currentUser.equippedPet, petLevels: currentUser.petLevels, playerLevel: Math.max(...Object.values(currentUser.petLevels || {default: 1})) })}
          isConnected={isConnected}
          currentRoom={currentRoom}
          roomPlayers={roomPlayers}
          isHost={isHost}
          error={multiplayerError}
          onStartGame={() => startMultiplayerGame()}
          onLeaveRoom={handleBackToMenu}
          currentUser={currentUser}
          socket={socket}
          isReconnecting={isReconnecting}
          onForceReconnect={forceReconnect}
          joinNotification={joinNotification}
          kickNotification={kickNotification}
          clearJoinNotification={clearJoinNotification}
          clearKickNotification={clearKickNotification}
        />
      </>
    );
  }

  if (currentScreen === 'shop') return <ShopScreen onBack={() => setCurrentScreen('start')} shopData={shopData} onBuyItem={handleBuyItem} onEquipItem={handleEquipItem} user={currentUser} />;
  if (currentScreen === 'highscores') return <HighScoresScreen onBack={() => setCurrentScreen('start')} highScores={gameState.highScores || []} />;
  if (currentScreen === 'controls') return <ControlsScreen onBack={() => setCurrentScreen('start')} controls={controls} onUpdateControls={handleUpdateControls} />;

  if (currentScreen === 'expulsion') {
    return (
      <ExpulsionScreen
        expulsionData={expulsionData}
        onBackToMenu={() => {
          setCurrentScreen('start');
          setExpulsionData(null);
          clearKickNotification();
        }}
        user={currentUser}
      />
    );
  }

  if (gameState.currentScreen === 'game' || gameState.currentScreen === 'pause') {
    const localPlayer = players.find(p => p.isLocal);
    const isSpectating = localPlayer && localPlayer.lives <= 0;

    return (
      <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden shadow-inset-2xl shadow-purple-900 animate-fade-in">
        {isSpectating && <SpectatorOverlay />}
        <GameHUD gameState={gameState} players={players} user={currentUser} onPause={handlePause} />
        <GameCanvas
          players={players}
          enemies={enemies}
          bullets={bullets}
          powerups={powerups}
          coins={coins}
          explosions={explosions}
          keysRef={keysRef}
          level={gameState.level}
          gameSeed={gameSeed}
        />
        {gameState.currentScreen === 'pause' && <PauseScreen onResume={handlePause} onSettings={() => setShowAdminPanel(true)} onMainMenu={handleBackToMenu} user={currentUser} gameState={gameState} />}
        {showAdminPanel && currentUser.isAdmin && (
          <AdminPanel user={currentUser} onUpdateSettings={handleUpdateAdminSettings} onClose={() => setShowAdminPanel(false)} />
        )}
        <PlayerNotification notification={notification} onClose={handleNotificationClose} />
        {levelUpAnimation && <LevelUpOverlay />}
        {isReconnecting && <ReconnectScreen onForceReconnect={forceReconnect} />}
      </div>
    );
  }

  if (gameState.currentScreen === 'multiplayerGameOver') {
    const totalScore = players.reduce((acc, p) => acc + (p.score || 0), 0);
    const totalCoinsEarned = players.reduce((acc, p) => acc + (p.coinsEarnedThisGame || 0), 0);
    const scoreBasedCoins = Math.floor(totalScore * 2 / 1.5);
    const totalCoinsAdded = scoreBasedCoins + totalCoinsEarned;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white font-orbitron p-8 animate-slide-in">
        <h1 className="text-6xl font-bold mb-8 text-red-400 animate-glow">PARTIDA TERMINADA</h1>
        <div className="text-center mb-8 bg-black/30 p-6 rounded-lg border border-red-700 shadow-xl shadow-red-900/40 max-w-2xl">
          <p className="text-2xl mb-2">Puntuación Final Total: <span className="text-yellow-400">{totalScore.toLocaleString()}</span></p>
          <p className="text-xl mb-2">Monedas de Puntuación: <span className="text-green-400">{scoreBasedCoins.toLocaleString()}</span> <span className="text-gray-400 text-sm">({totalScore} × 2 ÷ 1.5)</span></p>
          <p className="text-xl mb-2">Monedas Recolectadas: <span className="text-blue-400">{totalCoinsEarned.toLocaleString()}</span></p>
          <p className="text-2xl mb-4 font-bold">Total Monedas Ganadas: <span className="text-yellow-300">{totalCoinsAdded.toLocaleString()}</span></p>
          <p className="text-xl mb-6">Nivel Alcanzado: <span className="text-blue-400">{gameState.level}</span></p>
          <h3 className="text-lg font-bold mb-2">Puntuaciones Individuales:</h3>
          {players.map(p => <p key={p.id}>{p.name}: <span className="text-yellow-300">{(p.score || 0).toLocaleString()}</span></p>)}
        </div>
        <div className="space-y-4">
          <button
            onClick={() => {
              // Return to the same room
              setCurrentScreen('multiplayer');
              // Reset game state but keep room
              backToMenu();
            }}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl font-semibold transition-colors transform hover:scale-105 shadow-lg shadow-blue-900/40"
          >
            VOLVER A LA SALA
          </button>
          <button onClick={handleBackToMenu} className="bg-gray-600 hover:bg-gray-700 px-8 py-4 rounded-lg text-xl font-semibold transition-colors transform hover:scale-105 shadow-lg shadow-gray-900/40">SALIR AL MENÚ</button>
        </div>
      </div>
    );
  }

  if (gameState.currentScreen === 'gameOver') {
    const totalScore = players.reduce((acc, p) => acc + (p.score || 0), 0);
    const totalCoinsEarned = players.reduce((acc, p) => acc + (p.coinsEarnedThisGame || 0), 0);
    const scoreBasedCoins = Math.floor(totalScore * 2 / 1.5);
    const totalCoinsAdded = scoreBasedCoins + totalCoinsEarned;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white font-orbitron p-8 animate-slide-in">
        <h1 className="text-6xl font-bold mb-8 text-red-400 animate-glow">GAME OVER</h1>
        <div className="text-center mb-8 bg-black/30 p-6 rounded-lg border border-red-700 shadow-xl shadow-red-900/40 max-w-2xl">
          <p className="text-2xl mb-2">Puntuación Final Total: <span className="text-yellow-400">{totalScore.toLocaleString()}</span></p>
          <p className="text-xl mb-2">Monedas de Puntuación: <span className="text-green-400">{scoreBasedCoins.toLocaleString()}</span> <span className="text-gray-400 text-sm">({totalScore} × 2 ÷ 1.5)</span></p>
          <p className="text-xl mb-2">Monedas Recolectadas: <span className="text-blue-400">{totalCoinsEarned.toLocaleString()}</span></p>
          <p className="text-2xl mb-4 font-bold">Total Monedas Ganadas: <span className="text-yellow-300">{totalCoinsAdded.toLocaleString()}</span></p>
          <p className="text-xl mb-6">Nivel Alcanzado: <span className="text-blue-400">{gameState.level}</span></p>
          <h3 className="text-lg font-bold mb-2">Puntuaciones Individuales:</h3>
          {players.map(p => <p key={p.id}>{p.name}: <span className="text-yellow-300">{(p.score || 0).toLocaleString()}</span></p>)}
        </div>
        <div className="space-y-4">
          <button onClick={handleStartSingle} className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg text-xl font-semibold transition-colors transform hover:scale-105 shadow-lg shadow-green-900/40">JUGAR DE NUEVO</button>
          <button onClick={handleBackToMenu} className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl font-semibold transition-colors transform hover:scale-105 shadow-lg shadow-blue-900/40">MENÚ PRINCIPAL</button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
// END OF FILE App.jsx
