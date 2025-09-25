import { useState, useEffect, useCallback, useRef } from 'react';
import { userService } from '../../lib/supabase';

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 800;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 40;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;

export const useGameState = (keysRef, lastShootTimeRef, user, sendPlayerMove, sendPlayerShoot, sendEnemyUpdate, sendGameStateUpdate, sendEnemyDestroyed, sendLevelCompleted, sendEnemyShoot, sendPowerupTaken, sendCoinTaken, sendPlayerDeath, sendPlayerRespawn, sendScoreUpdate) => {
  // Seeded random function for synchronization
  const seededRandom = useCallback((seed) => {
    let hash = 0;
    const str = seed.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
  }, []);

  const [gameState, setGameState] = useState({
    score: 0,
    coins: 0,
    level: 1,
    gameRunning: false,
    gamePaused: false,
    currentScreen: 'start',
    highScores: [],
    isMultiplayer: false
  });
  const [players, setPlayers] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [powerups, setPowerups] = useState([]);
  const [coins, setCoins] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const [gameSeed, setGameSeed] = useState(null);
  const [sharedGameSeed, setSharedGameSeed] = useState(null);

  const animationFrameId = useRef();
  const networkFunctionsRef = useRef({ sendPlayerMove, sendPlayerShoot, sendEnemyUpdate, sendGameStateUpdate });
  const lastEnemyShootTimeRef = useRef(0);
  const enemySpeedMultiplierRef = useRef(1);
  const lastHealthRegenTimeRef = useRef({});
  const lastAutoShootTimeRef = useRef({});
  const lastMagnetEffectTimeRef = useRef(0);
  const currentLevelPattern = useRef(0);
  const enemyHorizontalDirection = useRef(1);
  const lastEnemyUpdateTimeRef = useRef(0);
  const lastGameStateUpdateTimeRef = useRef(0);
  const levelCompletionInProgressRef = useRef(false);
  const enemiesDestroyedThisGameRef = useRef(0);
  const enemiesDestroyedThisLevelRef = useRef(0);

  const stateRef = useRef();
  useEffect(() => {
    stateRef.current = { gameState, players, enemies, bullets, powerups, coins, explosions, user };
  }, [gameState, players, enemies, bullets, powerups, coins, explosions, user]);

  useEffect(() => {
    networkFunctionsRef.current = { sendPlayerMove, sendPlayerShoot, sendEnemyUpdate, sendGameStateUpdate };
  }, [sendPlayerMove, sendPlayerShoot, sendEnemyUpdate, sendGameStateUpdate]);

  const checkCollision = useCallback((r1, r2) => {
    const r1Width = Math.abs(r1.width);
    const r1Height = Math.abs(r1.height);
    const r2Width = Math.abs(r2.width);
    const r2Height = Math.abs(r2.height);
    
    return r1.x < r2.x + r2Width &&
           r1.x + r1Width > r2.x &&
           r1.y < r2.y + r2Height &&
           r1.y + r1Height > r2.y;
  }, []);

  const endGame = useCallback(async () => {
    setGameState(prev => {
      if (!prev.gameRunning) return prev;

      const currentPlayers = stateRef.current.players;
      const totalScore = currentPlayers.reduce((acc, p) => acc + (p.score || 0), 0);

      if (stateRef.current.user) {
        const localUserPlayer = currentPlayers.find(p => p.isLocal && p.id === stateRef.current.user.username);
        if (localUserPlayer) {
          // Calculate coins using formula: puntos ganados * 2 / 1.5
          const totalScoreAsCoins = Math.floor(totalScore * 2 / 1.5);
          stateRef.current.user.coins = (stateRef.current.user.coins || 0) + totalScoreAsCoins;

          console.log(`💰 ¡${totalScoreAsCoins} monedas agregadas a tu cuenta por el puntaje total!`);
          console.log(`📊 Cálculo: ${totalScore} puntos × 2 ÷ 1.5 = ${totalScoreAsCoins} monedas`);
        }
      }

      const isMultiplayerGame = prev.isMultiplayer;
      const newScore = {
        score: totalScore,
        level: prev.level,
        date: new Date().toLocaleDateString(),
        playerName: isMultiplayerGame ? currentPlayers.map(p => p.name).join(', ') : currentPlayers[0]?.name || 'Player',
        players: isMultiplayerGame ? currentPlayers.map(p => p.name).join(', ') : currentPlayers[0]?.name,
        roomCode: isMultiplayerGame ? stateRef.current.currentRoom || 'N/A' : null,
        isMultiplayer: isMultiplayerGame
      };

      const highScores = JSON.parse(localStorage.getItem('spaceInvadersHighScores') || '[]');
      const updatedHighScores = [...highScores, newScore].sort((a, b) => b.score - a.score).slice(0, 10);
      localStorage.setItem('spaceInvadersHighScores', JSON.stringify(updatedHighScores));

      // Save game progress to Supabase for all users (per account)
      if (stateRef.current.user) {
        const gameProgress = {
          currentLevel: prev.level,
          highScore: Math.max(stateRef.current.user.gameProgress?.highScore || 0, totalScore),
          totalGamesPlayed: (stateRef.current.user.gameProgress?.totalGamesPlayed || 0) + 1,
          totalEnemiesDestroyed: (stateRef.current.user.gameProgress?.totalEnemiesDestroyed || 0) + enemiesDestroyedThisGameRef.current,
          totalCoinsEarned: (stateRef.current.user.gameProgress?.totalCoinsEarned || 0) + Math.floor(totalScore * 2 / 1.5)
        };

        // Save game progress to Supabase
        userService.saveGameProgress(stateRef.current.user.username, gameProgress)
          .then(() => console.log('✅ Progreso de juego guardado para usuario:', stateRef.current.user.username))
          .catch(error => console.error('❌ Error guardando progreso:', error));
      }

      return {
        ...prev,
        gameRunning: false,
        gamePaused: false,
        currentScreen: 'gameOver',
        highScores: updatedHighScores,
        score: 0,
        coins: 0,
        level: 1
      };
    });
    cancelAnimationFrame(animationFrameId.current);
    lastHealthRegenTimeRef.current = {};
    lastAutoShootTimeRef.current = {};
    lastMagnetEffectTimeRef.current = 0;
    lastEnemyUpdateTimeRef.current = 0;
    lastGameStateUpdateTimeRef.current = 0;
  }, []);

  const getEnemyFormation = useCallback((level) => {
    const formations = [
      'line', 'v-formation', 'diamond', 'circle', 'spiral', 
      'wave', 'cross', 'star', 'heart', 'arrow'
    ];
    return formations[level % formations.length];
  }, []);

  const generateFormationPositions = useCallback((formation, rows, cols, level) => {
    const positions = [];
    const centerX = CANVAS_WIDTH / 2;
    const centerY = 150;
    const spacing = 55;
    
    switch (formation) {
      case 'line':
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            positions.push({
              x: centerX - (cols * spacing) / 2 + c * spacing,
              y: centerY + r * spacing,
              type: r === 0 ? 'scout' : r === rows - 1 ? 'cruiser' : 'fighter'
            });
          }
        }
        break;
        
      case 'v-formation':
        for (let r = 0; r < rows; r++) {
          const rowCols = Math.max(1, cols - r);
          for (let c = 0; c < rowCols; c++) {
            positions.push({
              x: centerX - (rowCols * spacing) / 2 + c * spacing,
              y: centerY + r * spacing,
              type: r === 0 ? 'scout' : 'fighter'
            });
          }
        }
        break;
        
      case 'diamond':
        const midRow = Math.floor(rows / 2);
        for (let r = 0; r < rows; r++) {
          const rowWidth = r <= midRow ? r + 1 : rows - r;
          for (let c = 0; c < rowWidth; c++) {
            positions.push({
              x: centerX - (rowWidth * spacing) / 2 + c * spacing,
              y: centerY + r * spacing,
              type: r === 0 || r === rows - 1 ? 'scout' : 'fighter'
            });
          }
        }
        break;
        
      case 'circle':
        const radius = Math.min(cols, rows) * spacing / 2;
        const totalEnemies = rows * cols;
        for (let i = 0; i < totalEnemies; i++) {
          const angle = (i / totalEnemies) * Math.PI * 2;
          positions.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            type: i % 3 === 0 ? 'scout' : 'fighter'
          });
        }
        break;
        
      case 'spiral':
        let spiralRadius = 15;
        let angle = 0;
        for (let i = 0; i < rows * cols; i++) {
          positions.push({
            x: centerX + Math.cos(angle) * spiralRadius,
            y: centerY + Math.sin(angle) * spiralRadius,
            type: i % 4 === 0 ? 'cruiser' : 'fighter'
          });
          angle += 0.4;
          spiralRadius += 2.5;
        }
        break;
        
      case 'heart':
        for (let i = 0; i < rows * cols; i++) {
          const t = (i / (rows * cols)) * Math.PI * 2;
          const heartX = 16 * Math.pow(Math.sin(t), 3);
          const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
          positions.push({
            x: centerX + heartX * 2.5,
            y: centerY + heartY * 2.5,
            type: 'fighter'
          });
        }
        break;
        
      default:
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            positions.push({
              x: centerX - (cols * spacing) / 2 + c * spacing,
              y: centerY + r * spacing,
              type: 'fighter'
            });
          }
        }
    }
    
    return positions;
  }, []);

  const spawnEnemies = useCallback((level, providedEnemies = null, providedSeed = null) => {
    console.log(`🎮 Generando enemigos para nivel: ${level}`);

    // If enemies are provided (from server for multiplayer), use them directly
    if (providedEnemies && providedEnemies.length > 0) {
      console.log(`🎯 Usando enemigos proporcionados por el servidor: ${providedEnemies.length} enemigos`);
      setEnemies(providedEnemies);

      // Set the level pattern for enemy movement using shared seed
      if (providedSeed !== null) {
        currentLevelPattern.current = Math.floor(seededRandom(providedSeed + level * 1000) * 6);
        enemyHorizontalDirection.current = 1;
        console.log(`🎲 Usando seed compartido para patrón de movimiento: ${providedSeed}`);
      }
      return;
    }

    // For single player, generate enemies locally
    const newEnemies = [];
    const isBossLevel = level % 10 === 0;
    // More gradual speed increase: 0.05 instead of 0.1 per level
    enemySpeedMultiplierRef.current = 1 + (level - 1) * 0.05;

    if (isBossLevel) {
      const bossTypes = ['mothership', 'destroyer', 'battleship'];
      const bossType = bossTypes[Math.floor(level / 10) % bossTypes.length];

      newEnemies.push({
        id: `boss-${Date.now()}`,
        x: CANVAS_WIDTH / 2 - 60,
        y: 50,
        width: 120,
        height: 80,
        type: bossType,
        health: 100 + level * 10, // Reduced from 15 to 10 for more gradual scaling
        maxHealth: 100 + level * 10,
        speedX: 2 + level * 0.05, // Reduced speed scaling
        speedY: 0.5,
        isBoss: true,
        animationFrame: 0
      });
    } else {
      const baseRows = 3;
      const baseCols = 8;
      const maxRows = 6;
      const maxCols = 12;

      const rows = Math.min(baseRows + Math.floor(level / 4), maxRows);
      const cols = Math.min(baseCols + Math.floor(level / 3), maxCols);

      const formation = getEnemyFormation(level);
      const positions = generateFormationPositions(formation, rows, cols, level);

      // Use seeded random for synchronization (single player)
      currentLevelPattern.current = Math.floor(seededRandom(level * 1000) * 6);
      enemyHorizontalDirection.current = 1;

      positions.forEach((pos, index) => {
        const enemyTypes = ['scout', 'fighter', 'cruiser', 'destroyer', 'battleship'];
        let type = pos.type;

        if (level > 5 && seededRandom(level * 100 + index) < 0.3) {
          type = enemyTypes[Math.min(4, Math.floor(level / 5))];
        }

        let health = { scout: 1, fighter: 2, cruiser: 3, destroyer: 4, battleship: 5, mothership: 8 }[type] || 2;
        // Progressive difficulty scaling: +1 health every 5 levels instead of every 3
        health += Math.floor((level - 1) / 5);
        health = Math.max(1, health);

        newEnemies.push({
          id: `${level}-${index}`,
          x: pos.x,
          y: pos.y,
          initialX: pos.x,
          initialY: pos.y,
          width: type === 'battleship' ? ENEMY_WIDTH * 1.5 : ENEMY_WIDTH,
          height: type === 'battleship' ? ENEMY_HEIGHT * 1.5 : ENEMY_HEIGHT,
          type,
          health,
          maxHealth: health,
          moveOffset: 0,
          speedX: { scout: 4, fighter: 3, cruiser: 2.5, destroyer: 2, battleship: 1.5, mothership: 1 }[type] || 3,
          speedY: { scout: 2, fighter: 1.5, cruiser: 1.2, destroyer: 1, battleship: 0.8, mothership: 0.5 }[type] || 1.5,
          animationFrame: 0
        });
      });
    }
    console.log(`🎯 Generados ${newEnemies.length} enemigos para nivel ${level}`);
    setEnemies(newEnemies);
  }, [getEnemyFormation, generateFormationPositions]);

  const runGameLoop = useCallback(() => {
    let lastTime = performance.now();
    const gameLoop = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      let currentGameState = { ...stateRef.current.gameState };
      let currentPlayers = stateRef.current.players.map(p => ({ ...p }));
      let currentEnemies = stateRef.current.enemies.map(e => ({ ...e }));
      let currentBullets = stateRef.current.bullets.map(b => ({ ...b }));
      let currentPowerups = [...stateRef.current.powerups];
      let currentCoins = [...stateRef.current.coins];
      let currentExplosions = [...stateRef.current.explosions];
      const user = stateRef.current.user;

      if (!currentGameState.gameRunning || currentGameState.gamePaused) {
        cancelAnimationFrame(animationFrameId.current);
        return;
      }

      const now = Date.now();
      const keys = keysRef.current;
      const net = networkFunctionsRef.current;

      const bulletsToRemove = new Set();
      const enemiesToUpdate = new Map();
      const powerupsTaken = new Set();
      const coinsTaken = new Set();
      const explosionsToAdd = [];
      let scoreChange = 0;
      // enemiesDestroyedThisGame is now tracked in enemiesDestroyedThisGameRef

      // 1. Player Movement and Shooting
      currentPlayers = currentPlayers.map(player => {
        if (player.lives <= 0) return player;

        const controls = player.controls;
        if (!controls) return player;

        // Velocidad mejorada con upgrades
        const baseSpeed = 450; // Aumentado de 400 a 450
        const mobilityLevel = player.upgrades?.mobility || 1;
        const mobilityMultiplier = 1 + (mobilityLevel - 1) * 0.1;
        const adminSpeedBoost = player.isAdmin && player.settings?.superSpeed ? 2 : 1;
        const finalSpeed = baseSpeed * mobilityMultiplier * adminSpeedBoost;

        let targetX = player.x;
        let targetY = player.y;
        if (player.isLocal) {
          if (keys[controls.left]) targetX -= finalSpeed * deltaTime;
          if (keys[controls.right]) targetX += finalSpeed * deltaTime;
          targetX = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, targetX));

          // Add vertical movement for better gameplay
          if (keys[controls.up]) targetY -= finalSpeed * deltaTime * 0.7;
          if (keys[controls.down]) targetY += finalSpeed * deltaTime * 0.7;
          targetY = Math.max(PLAYER_HEIGHT / 2, Math.min(CANVAS_HEIGHT - PLAYER_HEIGHT / 2, targetY));

          if (Math.abs(player.x - targetX) > 0.1 || Math.abs(player.y - targetY) > 0.1) {
            player.x = targetX;
            player.y = targetY;
            if (player.isMultiplayer) net.sendPlayerMove?.({ playerId: player.id, x: targetX, y: targetY });
          }

          // Power-up activation with number keys 1-5
          const powerupKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];
          const powerupTypes = ['rapidFire', 'shield', 'speedBoost', 'laserBeam', 'multiShot'];

          powerupKeys.forEach((key, index) => {
            if (keys[key]) {
              const powerupType = powerupTypes[index];
              if (player.powerupInventory && player.powerupInventory[powerupType] > 0) {
                // Use power-up
                player.powerupInventory = { ...player.powerupInventory };
                player.powerupInventory[powerupType]--;

                // Activate power-up effect
                switch (powerupType) {
                  case 'rapidFire':
                    player.activePowerups = { ...player.activePowerups, rapidFire: now + 10000 };
                    break;
                  case 'shield':
                    player.activePowerups = { ...player.activePowerups, shield: now + 15000 };
                    break;
                  case 'speedBoost':
                    player.activePowerups = { ...player.activePowerups, speedBoost: now + 8000 };
                    break;
                  case 'laserBeam':
                    player.activePowerups = { ...player.activePowerups, laserBeam: now + 5000 };
                    break;
                  case 'multiShot':
                    player.activePowerups = { ...player.activePowerups, multiShot: now + 8000 };
                    break;
                }
                console.log(`⚡ Power-up ${powerupType} activado. Restantes: ${player.powerupInventory[powerupType]}`);
              }
            }
          });

          const isRapidFirePowerupActive = player.activePowerups?.rapidFire > now;
          
          // Sistema de disparo automático mejorado
          let baseShootDelay = 200; // Reducido de 250 a 200
          const fireRateLevel = player.upgrades?.fireRate || 1;
          const fireRateMultiplier = 1 - (fireRateLevel - 1) * 0.02;
          baseShootDelay *= fireRateMultiplier;
          
          if (player.isAdmin && player.settings?.customFireRate) {
            baseShootDelay = Math.max(10, 1000 / player.settings.customFireRate);
          } else if ((player.isAdmin && player.settings?.rapidFire) || isRapidFirePowerupActive) {
            baseShootDelay *= 0.25;
          }
          
          const shootDelay = Math.max(40, baseShootDelay);
          const isAutoShootActive = player.equippedPet === 'autoShooterPet' && player.isLocal;
          const autoShootDelay = 250; // Reducido de 300 a 250

          const canShootManual = keys[controls.shoot];
          const canShootAuto = isAutoShootActive && (now - (lastAutoShootTimeRef.current[player.id] || 0) > autoShootDelay);

          // DISPARO AUTOMÁTICO CONTINUO para todos los jugadores
          const shouldAutoShoot = player.isLocal && (now - (lastShootTimeRef.current[player.id] || 0) > shootDelay);

          // Efectos especiales de disparo
          const hasMultiShot = player.activePowerups?.multiShot > now;
          const hasLaserBeam = player.activePowerups?.laserBeam > now;
          
          if (shouldAutoShoot || canShootManual || canShootAuto) {
            // Daño con mejoras
            const baseDamage = 1;
            const adminCustomDamage = player.isAdmin && player.settings?.customBulletDamage ? player.settings.customBulletDamage : 1;
            const damageLevel = player.upgrades?.damage || 1;
            const damageMultiplier = 1 + (damageLevel - 1) * 0.15;
            const finalDamage = Math.floor(baseDamage * damageMultiplier * adminCustomDamage);
            
            if (hasMultiShot) {
              // Disparo múltiple en 5 direcciones
              for (let i = -2; i <= 2; i++) {
                const angle = i * 0.3; // 0.3 radianes entre cada disparo
                const newBullet = {
                  id: `${player.id}-${now}-${i}`,
                  x: player.x + PLAYER_WIDTH / 2 - 3,
                  y: player.y - PLAYER_HEIGHT / 2,
                  width: 6,
                  height: 15,
                  speed: 600,
                  angle: angle,
                  isEnemy: false,
                  playerId: player.id,
                  damage: finalDamage,
                  hitsRemaining: (player.equippedUpgrade === 'bulletPierce' && player.isLocal) ? 3 : 1
                };
                currentBullets.push(newBullet);
                if (player.isMultiplayer) net.sendPlayerShoot?.(newBullet);
              }
            } else if (hasLaserBeam) {
              // Láser continuo
              const newBullet = {
                id: `${player.id}-laser-${now}`,
                x: player.x + PLAYER_WIDTH / 2 - 8,
                y: player.y - PLAYER_HEIGHT / 2,
                width: 16,
                height: 400,
                speed: 0, // El láser no se mueve
                isEnemy: false,
                playerId: player.id,
                damage: finalDamage * 2,
                isLaser: true,
                hitsRemaining: 999
              };
              currentBullets.push(newBullet);
              if (player.isMultiplayer) net.sendPlayerShoot?.(newBullet);
            } else {
              const newBullet = {
                id: `${player.id}-${now}`,
                x: player.x + PLAYER_WIDTH / 2 - 3,
                y: player.y - PLAYER_HEIGHT / 2,
                width: 6,
                height: 15,
                speed: 600,
                isEnemy: false,
                playerId: player.id,
                damage: finalDamage,
                hitsRemaining: (player.equippedUpgrade === 'bulletPierce' && player.isLocal) ? 3 : 1
              };
              currentBullets.push(newBullet);
              if (player.isMultiplayer) net.sendPlayerShoot?.(newBullet);
            }
            lastShootTimeRef.current[player.id] = now;
            if (canShootAuto) lastAutoShootTimeRef.current[player.id] = now;
          }

          // Regeneración de vida
          const isHealthRegenActive = player.equippedUpgrade === 'healthRegen' && player.isLocal;
          const regenDelay = 35000; // Reducido de 40s a 35s
          if (isHealthRegenActive && player.lives < 3 && (now - (lastHealthRegenTimeRef.current[player.id] || 0) > regenDelay)) {
            player.lives = Math.min(3, player.lives + 1);
            lastHealthRegenTimeRef.current[player.id] = now;
          }
          
          // Efectos de mascotas mejoradas (funcionan para todos los jugadores en multiplayer)
          if ((player.isLocal || player.isMultiplayer) && player.equippedPet) {
            const petLevel = player.petLevels?.[player.equippedPet] || 1;
            const petCooldownReduction = 1 - (petLevel - 1) * 0.02; // 2% reducción por nivel
            
            switch(player.equippedPet) {
              case 'healerPet':
                const healDelay = 45000 * petCooldownReduction;
                if (player.lives < 3 && (now - (lastHealthRegenTimeRef.current[`pet_${player.id}`] || 0) > healDelay)) {
                  player.lives = Math.min(3, player.lives + 1);
                  lastHealthRegenTimeRef.current[`pet_${player.id}`] = now;
                }
                break;
              case 'shieldPet':
                const shieldDelay = 30000 * petCooldownReduction;
                if (!player.activePowerups?.shield && (now - (lastAutoShootTimeRef.current[`shield_${player.id}`] || 0) > shieldDelay)) {
                  player.activePowerups = { ...player.activePowerups, shield: now + 10000 };
                  lastAutoShootTimeRef.current[`shield_${player.id}`] = now;
                }
                break;
              case 'speedPet':
                const speedDelay = 25000 * petCooldownReduction;
                if (!player.activePowerups?.speedBoost && (now - (lastAutoShootTimeRef.current[`speed_${player.id}`] || 0) > speedDelay)) {
                  player.activePowerups = { ...player.activePowerups, speedBoost: now + 8000 };
                  lastAutoShootTimeRef.current[`speed_${player.id}`] = now;
                }
                break;
              case 'bombPet':
                const bombDelay = 20000 * petCooldownReduction;
                if ((now - (lastAutoShootTimeRef.current[`bomb_${player.id}`] || 0) > bombDelay)) {
                  // Crear mini bomba con efecto de área
                  currentBullets.push({
                    id: `pet-bomb-${player.id}-${now}`,
                    x: player.x + PLAYER_WIDTH / 2 - 5,
                    y: player.y - 10,
                    width: 10,
                    height: 10,
                    speed: 400,
                    isEnemy: false,
                    playerId: player.id,
                    damage: 3,
                    isPetBomb: true,
                    explosionRadius: 50
                  });
                  lastAutoShootTimeRef.current[`bomb_${player.id}`] = now;
                }
                break;
              case 'laserPet':
                const laserDelay = 15000 * petCooldownReduction;
                if ((now - (lastAutoShootTimeRef.current[`laser_${player.id}`] || 0) > laserDelay)) {
                  // Crear láser de pet
                  currentBullets.push({
                    id: `pet-laser-${player.id}-${now}`,
                    x: player.x + PLAYER_WIDTH / 2 - 2,
                    y: player.y - PLAYER_HEIGHT / 2,
                    width: 4,
                    height: 300,
                    speed: 0,
                    isEnemy: false,
                    playerId: player.id,
                    damage: 2,
                    isLaser: true,
                    hitsRemaining: 50
                  });
                  lastAutoShootTimeRef.current[`laser_${player.id}`] = now;
                }
                break;
              case 'teleportPet':
                const teleportDelay = 30000 * petCooldownReduction;
                if ((now - (lastAutoShootTimeRef.current[`teleport_${player.id}`] || 0) > teleportDelay)) {
                  // Teleportar a una posición segura
                  const safeX = Math.random() * (CANVAS_WIDTH - PLAYER_WIDTH) + PLAYER_WIDTH / 2;
                  player.x = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, safeX));
                  lastAutoShootTimeRef.current[`teleport_${player.id}`] = now;
                }
                break;
              case 'freezePet':
                const freezeDelay = 25000 * petCooldownReduction;
                if ((now - (lastAutoShootTimeRef.current[`freeze_${player.id}`] || 0) > freezeDelay)) {
                  // Congelar enemigos cercanos
                  currentEnemies.forEach(enemy => {
                    const distance = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
                    if (distance < 100) {
                      enemy.frozen = true;
                      enemy.frozenUntil = now + 3000; // 3 segundos
                    }
                  });
                  lastAutoShootTimeRef.current[`freeze_${player.id}`] = now;
                }
                break;
              case 'poisonPet':
                const poisonDelay = 18000 * petCooldownReduction;
                if ((now - (lastAutoShootTimeRef.current[`poison_${player.id}`] || 0) > poisonDelay)) {
                  // Crear nube de veneno
                  currentBullets.push({
                    id: `pet-poison-${player.id}-${now}`,
                    x: player.x + PLAYER_WIDTH / 2 - 15,
                    y: player.y - 15,
                    width: 30,
                    height: 30,
                    speed: 200,
                    isEnemy: false,
                    playerId: player.id,
                    damage: 1,
                    isPoisonCloud: true,
                    duration: 5000,
                    createdAt: now
                  });
                  lastAutoShootTimeRef.current[`poison_${player.id}`] = now;
                }
                break;
              case 'explosionPet':
                const explosionDelay = 22000 * petCooldownReduction;
                if ((now - (lastAutoShootTimeRef.current[`explosion_${player.id}`] || 0) > explosionDelay)) {
                  // Crear explosión que daña a múltiples enemigos
                  const explosionX = player.x + PLAYER_WIDTH / 2;
                  const explosionY = player.y - PLAYER_HEIGHT / 2;

                  currentEnemies.forEach(enemy => {
                    const distance = Math.sqrt((enemy.x - explosionX) ** 2 + (enemy.y - explosionY) ** 2);
                    if (distance < 80) {
                      const damage = Math.max(1, Math.floor(5 * (1 - distance / 80)));
                      if (!enemiesToUpdate.has(enemy.id)) {
                        enemiesToUpdate.set(enemy.id, { health: enemy.health - damage });
                      } else {
                        const currentHealth = enemiesToUpdate.get(enemy.id).health;
                        enemiesToUpdate.set(enemy.id, { health: currentHealth - damage });
                      }
                    }
                  });

                  explosionsToAdd.push({
                    id: `pet-explosion-${player.id}-${now}`,
                    x: explosionX,
                    y: explosionY,
                    size: 60,
                    time: 0,
                    duration: 600
                  });

                  lastAutoShootTimeRef.current[`explosion_${player.id}`] = now;
                }
                break;
              case 'dronePet':
                const droneDelay = 12000 * petCooldownReduction;
                if ((now - (lastAutoShootTimeRef.current[`drone_${player.id}`] || 0) > droneDelay)) {
                  // Crear disparos de dron en múltiples direcciones
                  for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2 / 3) + (now * 0.001);
                    currentBullets.push({
                      id: `pet-drone-${player.id}-${now}-${i}`,
                      x: player.x + PLAYER_WIDTH / 2 - 2,
                      y: player.y - PLAYER_HEIGHT / 2,
                      width: 4,
                      height: 8,
                      speed: 500,
                      angle: angle,
                      isEnemy: false,
                      playerId: player.id,
                      damage: 2,
                      isDroneShot: true
                    });
                  }
                  lastAutoShootTimeRef.current[`drone_${player.id}`] = now;
                }
                break;
            }
          }
        }
        return player;
      });

      // 2. Entity Position Updates (para single player y multiplayer)
      if (true) { // Always run entity updates for both single and multiplayer
        currentBullets = currentBullets.map(bullet => {
          if (bullet.isLaser) {
            // Los láseres no se mueven
            return bullet;
          } else if (bullet.angle !== undefined) {
            // Balas con ángulo (multishot)
            return {
              ...bullet,
              x: bullet.x + Math.sin(bullet.angle) * bullet.speed * deltaTime,
              y: bullet.y - Math.cos(bullet.angle) * bullet.speed * deltaTime
            };
          } else {
            // Balas normales
            return {
              ...bullet,
              y: bullet.y + (bullet.isEnemy ? bullet.speed : -bullet.speed) * deltaTime
            };
          }
        }).filter(b => {
          if (b.isLaser) return true; // Los láseres siempre permanecen
          return b.y > -20 && b.y < CANVAS_HEIGHT + 20 && b.x > -20 && b.x < CANVAS_WIDTH + 20;
        });

        // Sistema de imán optimizado
        currentPowerups = currentPowerups.map(powerup => {
          const magnetPlayer = currentPlayers.find(pl => pl.isLocal && pl.equippedPet === 'magnetPet' && pl.lives > 0);
          if (magnetPlayer) {
            const distanceX = magnetPlayer.x + PLAYER_WIDTH / 2 - (powerup.x + powerup.width / 2);
            const distanceY = magnetPlayer.y + PLAYER_HEIGHT / 2 - (powerup.y + powerup.height / 2);
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            const magnetRadius = 220;
            const magnetSpeed = 8;

            if (distance < magnetRadius && distance > 0) {
              const pullStrength = Math.max(0.2, 1 - (distance / magnetRadius));
              powerup.x += (distanceX / distance) * magnetSpeed * deltaTime * pullStrength;
              powerup.y += (distanceY / distance) * magnetSpeed * deltaTime * pullStrength;
            }
          }
          return { ...powerup, y: powerup.y + powerup.speed * deltaTime };
        }).filter(p => p.y < CANVAS_HEIGHT);

        currentCoins = currentCoins.map(coin => {
          const magnetPlayer = currentPlayers.find(pl => pl.isLocal && pl.equippedPet === 'magnetPet' && pl.lives > 0);
          if (magnetPlayer) {
            const distanceX = magnetPlayer.x + PLAYER_WIDTH / 2 - (coin.x + coin.width / 2);
            const distanceY = magnetPlayer.y + PLAYER_HEIGHT / 2 - (coin.y + coin.height / 2);
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            const magnetRadius = 200;
            const magnetSpeed = 10;

            if (distance < magnetRadius && distance > 0) {
              const pullStrength = Math.max(0.3, 1 - (distance / magnetRadius));
              coin.x += (distanceX / distance) * magnetSpeed * deltaTime * pullStrength;
              coin.y += (distanceY / distance) * magnetSpeed * deltaTime * pullStrength;
            }
          }
          return { ...coin, y: coin.y + coin.speed * deltaTime };
        }).filter(c => c.y < CANVAS_HEIGHT);

        // Actualizar explosiones con animación real
        currentExplosions = currentExplosions.map(exp => ({
          ...exp,
          time: exp.time + deltaTime * 1000
        })).filter(exp => exp.time < exp.duration);

        // 3. Enemy Movement mejorado con sincronización perfecta
        if (currentEnemies.length > 0) {
          const time = now * 0.001;
          const level = currentGameState.level || 1;
          const waveAmplitude = 70 + level * 6;
          const waveFrequency = 0.5 + level * 0.03;
          const actualEnemySpeed = enemySpeedMultiplierRef.current;

          // Use shared seed for multiplayer synchronization
          const useSharedSeed = currentGameState.isMultiplayer && sharedGameSeed !== null;

          currentEnemies = currentEnemies.map(enemy => {
            enemy.animationFrame = (enemy.animationFrame || 0) + deltaTime * 10;

            // Check if enemy is frozen
            if (enemy.frozen && enemy.frozenUntil > now) {
              // Frozen enemies don't move
              return enemy;
            } else if (enemy.frozen) {
              // Remove frozen status when time is up
              delete enemy.frozen;
              delete enemy.frozenUntil;
            }

            let enemyNewX = isFinite(enemy.x) ? enemy.x : enemy.initialX || 0;
            let enemyNewY = isFinite(enemy.y) ? enemy.y : enemy.initialY || 0;

            if (enemy.isBoss) {
              enemyNewX += enemy.speedX * deltaTime * 60;
              enemyNewY += enemy.speedY * deltaTime * 60;
              if (enemyNewX <= 0 || enemyNewX + enemy.width >= CANVAS_WIDTH) enemy.speedX *= -1;
              if (enemyNewY > CANVAS_HEIGHT / 2) enemy.speedY = 0;

              // Use seeded random for boss movement in multiplayer
              const seed = useSharedSeed ? sharedGameSeed : time;
              const bossPattern = Math.sin(seed * 0.4) * 40;
              if (isFinite(bossPattern)) {
                enemyNewY += bossPattern * deltaTime;
              }
            } else {
              const patternIndex = currentLevelPattern.current;

              switch (patternIndex) {
                case 0: // Ondas horizontales
                  const seed0 = useSharedSeed ? sharedGameSeed + enemy.id : time;
                  const waveX = Math.sin(seed0 * waveFrequency + (enemy.id?.length || 0) * 0.1) * waveAmplitude;
                  const waveY = Math.sin(seed0 * 0.25) * 15;
                  if (isFinite(waveX) && isFinite(waveY)) {
                    enemyNewX = (enemy.initialX || 0) + waveX;
                    enemyNewY = (enemy.initialY || 0) + waveY;
                  }
                  break;
                case 1: // Ondas verticales
                  const seed1 = useSharedSeed ? sharedGameSeed + enemy.id : time;
                  const vertWaveX = Math.sin(seed1 * 0.3) * 25;
                  const vertWaveY = Math.sin(seed1 * waveFrequency * 1.1 + (enemy.id?.length || 0) * 0.2) * waveAmplitude * 0.5;
                  if (isFinite(vertWaveX) && isFinite(vertWaveY)) {
                    enemyNewX = (enemy.initialX || 0) + vertWaveX;
                    enemyNewY = (enemy.initialY || 0) + vertWaveY;
                  }
                  break;
                case 2: // Movimiento circular
                  const seed2 = useSharedSeed ? sharedGameSeed + enemy.id : time;
                  const radius = 35 + level * 2;
                  const circleX = Math.cos(seed2 * waveFrequency * 0.7 + (enemy.id?.length || 0) * 0.1) * radius;
                  const circleY = Math.sin(seed2 * waveFrequency * 0.7 + (enemy.id?.length || 0) * 0.1) * radius * 0.4;
                  if (isFinite(circleX) && isFinite(circleY)) {
                    enemyNewX = (enemy.initialX || 0) + circleX;
                    enemyNewY = (enemy.initialY || 0) + circleY;
                  }
                  break;
                case 3: // Descenso en espiral
                  const seed3 = useSharedSeed ? sharedGameSeed + enemy.id : time;
                  const spiralX = Math.sin(seed3 * waveFrequency * 1.3 + (enemy.id?.length || 0) * 0.3) * waveAmplitude;
                  const spiralY = (seed3 * actualEnemySpeed * 12) % (CANVAS_HEIGHT * 0.4);
                  if (isFinite(spiralX) && isFinite(spiralY)) {
                    enemyNewX = (enemy.initialX || 0) + spiralX;
                    enemyNewY = (enemy.initialY || 0) + spiralY;
                  }
                  break;
                case 4: // Formación en grupo
                  const groupSpeed = actualEnemySpeed * 80;
                  enemy.moveOffset = (enemy.moveOffset || 0) + enemyHorizontalDirection.current * groupSpeed * deltaTime;
                  if (enemy.moveOffset > CANVAS_WIDTH * 0.2 || enemy.moveOffset < -CANVAS_WIDTH * 0.2) {
                    enemyHorizontalDirection.current *= -1;
                  }
                  const seed4 = useSharedSeed ? sharedGameSeed + enemy.id : time;
                  const groupY = Math.sin(seed4 * 0.4) * 12;
                  if (isFinite(enemy.moveOffset) && isFinite(groupY)) {
                    enemyNewX = (enemy.initialX || 0) + enemy.moveOffset;
                    enemyNewY = (enemy.initialY || 0) + groupY;
                  }
                  break;
                case 5: // Zigzag avanzado
                  const seed5 = useSharedSeed ? sharedGameSeed + enemy.id : time;
                  const zigzagSpeed = actualEnemySpeed * 60;
                  const zigzagPattern = Math.sin(seed5 * 1.8 + (enemy.id?.length || 0) * 0.4) * zigzagSpeed * deltaTime;
                  const zigzagY = Math.abs(Math.sin(seed5 * 0.6)) * 20;
                  if (isFinite(zigzagPattern) && isFinite(zigzagY)) {
                    enemyNewX = (enemy.initialX || 0) + zigzagPattern;
                    enemyNewY = (enemy.initialY || 0) + zigzagY;
                  }
                  break;
                default:
                  const seedDefault = useSharedSeed ? sharedGameSeed + enemy.id : time;
                  const defaultX = Math.sin(seedDefault * waveFrequency + (enemy.initialY || 0) * 0.1) * waveAmplitude * 0.6;
                  const defaultY = Math.cos(seedDefault * 0.25) * 8;
                  if (isFinite(defaultX) && isFinite(defaultY)) {
                    enemyNewX = (enemy.initialX || 0) + defaultX;
                    enemyNewY = (enemy.initialY || 0) + defaultY;
                  }
                  break;
              }
            }

            // Validar coordenadas finales
            if (isFinite(enemyNewX) && isFinite(enemyNewY)) {
              enemyNewX = Math.max(0, Math.min(CANVAS_WIDTH - (enemy.width || ENEMY_WIDTH), enemyNewX));
              enemyNewY = Math.max(0, Math.min(CANVAS_HEIGHT, enemyNewY));
            } else {
              enemyNewX = enemy.initialX || 0;
              enemyNewY = enemy.initialY || 0;
            }

            return {
              ...enemy,
              x: enemyNewX,
              y: enemyNewY
            };
          });
        }

        // 4. Spawns optimizados (reducidos para evitar lag)
        const levelMultiplier = 1 + currentGameState.level * 0.03;
        const powerupChance = 0.0008 * levelMultiplier; // Reducido
        const coinChance = 0.0012 * levelMultiplier; // Reducido
        const specialPowerupChance = 0.0001 * currentGameState.level; // Reducido

        // 4.5. Multiplayer synchronization - Enhanced real-time updates
        if (currentGameState.isMultiplayer) {
          const net = networkFunctionsRef.current;

          // Send enemy updates every 30ms for ultra-smooth synchronization
          if (now - lastEnemyUpdateTimeRef.current > 30) {
            currentEnemies.forEach(enemy => {
              if (enemy.health > 0) {
                net.sendEnemyUpdate?.({
                  enemyId: enemy.id,
                  x: enemy.x,
                  y: enemy.y,
                  health: enemy.health,
                  type: enemy.type,
                  isBoss: enemy.isBoss
                });
              }
            });
            lastEnemyUpdateTimeRef.current = now;
          }

          // Send game state updates every 100ms for better responsiveness
          if (now - lastGameStateUpdateTimeRef.current > 100) {
            net.sendGameStateUpdate?.({
              level: currentGameState.level,
              score: currentGameState.score,
              enemiesRemaining: currentEnemies.filter(e => e.health > 0).length
            });
            lastGameStateUpdateTimeRef.current = now;
          }
        }

        // Use shared seed for powerup spawning in multiplayer
        const powerupSeed = currentGameState.isMultiplayer && sharedGameSeed !== null
          ? sharedGameSeed + Math.floor(now / 1000) * 1000
          : now + currentGameState.level;

        if (seededRandom(powerupSeed) < powerupChance) {
          const types = ['rapidFire', 'shield', 'tripleShot', 'speedBoost', 'laserBeam', 'multiShot'];
          const enemyBulletSpeed = 250 + currentGameState.level * 10;
          currentPowerups.push({
            id: `p-${powerupSeed}`,
            x: seededRandom(powerupSeed + 1) * (CANVAS_WIDTH - 30),
            y: -20,
            width: 30,
            height: 30,
            type: types[Math.floor(seededRandom(powerupSeed + 2) * types.length)],
            speed: enemyBulletSpeed
          });
        }

        if (seededRandom(powerupSeed + 10) < specialPowerupChance) {
          const specialTypes = ['galacticBomb', 'laser', 'invincibility', 'megaBomb', 'timeFreeze'];
          const enemyBulletSpeed = 250 + currentGameState.level * 10;
          currentPowerups.push({
            id: `p-special-${powerupSeed}`,
            x: seededRandom(powerupSeed + 11) * (CANVAS_WIDTH - 40),
            y: -20,
            width: 40,
            height: 40,
            type: specialTypes[Math.floor(seededRandom(powerupSeed + 12) * specialTypes.length)],
            speed: enemyBulletSpeed
          });
        }

        // Use shared seed for coin spawning in multiplayer
        const coinSeed = currentGameState.isMultiplayer && sharedGameSeed !== null
          ? sharedGameSeed + Math.floor(now / 1000) * 1000 + 20
          : now + currentGameState.level + 20;

        if (seededRandom(coinSeed) < coinChance) {
          const coinValue = 10 + Math.floor(seededRandom(coinSeed + 1) * currentGameState.level * 2);
          const enemyBulletSpeed = 250 + currentGameState.level * 10;
          currentCoins.push({
            id: `c-${coinSeed}`,
            x: seededRandom(coinSeed + 2) * (CANVAS_WIDTH - 20),
            y: -20,
            width: 20,
            height: 20,
            value: coinValue,
            speed: enemyBulletSpeed
          });
        }

        // 5. Enemy Shooting sincronizado perfectamente para multiplayer
        const baseEnemyShootDelay = Math.max(1500, 3000 - currentGameState.level * 80);
        const difficultyMultiplier = 1 + (currentGameState.level - 1) * 0.03;
        const enemyShootDelay = baseEnemyShootDelay / difficultyMultiplier;

        if (now - lastEnemyShootTimeRef.current > enemyShootDelay) {
          if (currentEnemies.length > 0) {
            // Use shared seed for perfect synchronization in multiplayer
            const seed = currentGameState.isMultiplayer && sharedGameSeed !== null
              ? sharedGameSeed + Math.floor(now / enemyShootDelay) * enemyShootDelay + currentGameState.level
              : Math.floor(now / enemyShootDelay) * enemyShootDelay + currentGameState.level;

            const shootingEnemies = currentEnemies.filter(e =>
              seededRandom(seed + parseInt(e.id || 0)) < 0.15 + currentGameState.level * 0.005
            );

            shootingEnemies.forEach(enemy => {
              const bulletSpeed = 250 + currentGameState.level * 10;
              const enemyBullet = {
                id: `e-${seed}-${enemy.id}`,
                x: enemy.x + enemy.width / 2 - 3,
                y: enemy.y + enemy.height,
                width: 6,
                height: 15,
                speed: bulletSpeed,
                isEnemy: true,
                damage: 1
              };
              currentBullets.push(enemyBullet);

              // Enviar disparos de enemigos en multiplayer
              if (currentGameState.isMultiplayer) {
                net.sendEnemyShoot?.(enemyBullet);
              }
            });
          }
          lastEnemyShootTimeRef.current = now;
        }

        // 6. Collisions
        currentPlayers = currentPlayers.map(player => {
          if (player.lives <= 0) return player;

          let playerLivesLost = 0;
          const hasShield = player.activePowerups?.shield > now;
          const isNoClipActive = player.isAdmin && player.settings?.noclip;
          const hasInvincibility = player.activePowerups?.invincibility > now;

          currentBullets.forEach(bullet => {
            if (bullet.isEnemy && !bulletsToRemove.has(bullet.id) && checkCollision(bullet, player)) {
              bulletsToRemove.add(bullet.id);
              if (!isNoClipActive && !hasInvincibility) {
                if (!hasShield) {
                  playerLivesLost += bullet.damage || 1;
                } else {
                  player.activePowerups = { ...player.activePowerups, shield: 0 };
                }
              }
            }
          });

          currentEnemies.forEach(enemy => {
            if (!enemiesToUpdate.has(enemy.id) && checkCollision(enemy, player)) {
              enemiesToUpdate.set(enemy.id, { health: 0 });
              explosionsToAdd.push({ 
                id: `exp-${now}`, 
                x: enemy.x + enemy.width / 2, 
                y: enemy.y + enemy.height / 2, 
                size: enemy.isBoss ? 100 : 50, 
                time: 0, 
                duration: 800 
              });
              if (enemy.isBoss) {
                scoreChange += 1000 + (enemiesDestroyedThisLevelRef.current * 1000);
              } else {
                scoreChange += 100;
                enemiesDestroyedThisLevelRef.current += 1;
              }
              if (!isNoClipActive && !hasInvincibility) {
                if (!hasShield) {
                  playerLivesLost = player.lives;
                } else {
                  player.activePowerups = { ...player.activePowerups, shield: 0 };
                }
              }
            }
          });

          // Power-up collection
          currentPowerups.forEach(p => {
            if (!powerupsTaken.has(p.id) && checkCollision(player, p)) {
              powerupsTaken.add(p.id);

              // Send immediate power-up collection notification in multiplayer
              if (currentGameState.isMultiplayer) {
                const net = networkFunctionsRef.current;
                net.sendPowerupTaken?.({
                  powerupId: p.id,
                  powerupType: p.type,
                  playerId: player.id,
                  playerName: player.name,
                  timestamp: now
                });
              }

              // Add power-up to inventory instead of activating immediately
              if (player.isLocal) {
                player.powerupInventory = { ...player.powerupInventory };
                player.powerupInventory[p.type] = (player.powerupInventory[p.type] || 0) + 1;
                console.log(`🎁 Power-up ${p.type} agregado al inventario. Total: ${player.powerupInventory[p.type]}`);
              } else {
                // For non-local players, activate immediately (for multiplayer compatibility)
                switch (p.type) {
                  case 'galacticBomb':
                    currentEnemies.forEach(enemy => {
                      if (!enemiesToUpdate.has(enemy.id) || enemiesToUpdate.get(enemy.id).health > 0) {
                        enemiesToUpdate.set(enemy.id, { health: 0 });
                        explosionsToAdd.push({
                          id: `exp-${now}-${enemy.id}`,
                          x: enemy.x + enemy.width / 2,
                          y: enemy.y + enemy.height / 2,
                          size: enemy.isBoss ? 100 : 50,
                          time: 0,
                          duration: 800
                        });
                        if (enemy.isBoss) {
                          scoreChange += 1000 + (enemiesDestroyedThisLevelRef.current * 1000);
                        } else {
                          scoreChange += 100;
                          enemiesDestroyedThisLevelRef.current += 1;
                        }
                      }
                    });
                    explosionsToAdd.push({
                      id: `exp-galactic-${now}`,
                      x: CANVAS_WIDTH / 2,
                      y: CANVAS_HEIGHT / 2,
                      size: 400,
                      time: 0,
                      duration: 1000
                    });
                    break;
                  case 'invincibility':
                    player.activePowerups = { ...player.activePowerups, invincibility: now + 8000 };
                    break;
                  case 'timeFreeze':
                    enemySpeedMultiplierRef.current *= 0.1;
                    setTimeout(() => {
                      enemySpeedMultiplierRef.current /= 0.1;
                    }, 5000);
                    break;
                  case 'laserBeam':
                    player.activePowerups = { ...player.activePowerups, laserBeam: now + 5000 };
                    break;
                  case 'multiShot':
                    player.activePowerups = { ...player.activePowerups, multiShot: now + 8000 };
                    break;
                  default:
                    const duration = p.type === 'shield' ? 15000 : 10000;
                    player.activePowerups = { ...player.activePowerups, [p.type]: now + duration };
                    break;
                }
              }
            }
          });

          currentCoins.forEach(c => {
            if (!coinsTaken.has(c.id) && checkCollision(player, c)) {
              coinsTaken.add(c.id);
              const coinValue = (player.equippedUpgrade === 'doubleCoins' && player.isLocal) ? c.value * 2 : c.value;
              player.coinsEarnedThisGame = (player.coinsEarnedThisGame || 0) + coinValue;
              player.score = (player.score || 0) + coinValue;

              // Send immediate coin collection notification in multiplayer
              if (currentGameState.isMultiplayer) {
                const net = networkFunctionsRef.current;
                net.sendCoinTaken?.({
                  coinId: c.id,
                  coinValue: coinValue,
                  playerId: player.id,
                  playerName: player.name,
                  timestamp: now
                });
              }
            }
          });

          if (playerLivesLost > 0 && !isNoClipActive && !hasInvincibility) {
            const newLives = Math.max(0, player.lives - playerLivesLost);
            if (newLives === 0 && player.lives > 0) {
              // Player just died - show elimination effect
              explosionsToAdd.push({
                id: `exp-player-${now}`,
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y + PLAYER_HEIGHT / 2,
                size: 60,
                time: 0,
                duration: 600
              });
              // In multiplayer, send death notification to all players
              if (currentGameState.isMultiplayer && player.isLocal) {
                console.log(`💀 Player ${player.name} has been eliminated!`);
                sendPlayerDeath?.({
                  playerId: player.id,
                  playerName: player.name,
                  x: player.x + PLAYER_WIDTH / 2,
                  y: player.y + PLAYER_HEIGHT / 2,
                  lives: newLives,
                  timestamp: now
                });
              }
            } else if (newLives > 0 && player.lives > newLives) {
              // Player lost a life but still has lives left - no teleportation
              console.log(`💔 Player ${player.name} lost a life! Lives remaining: ${newLives}`);

              // In multiplayer, send life lost notification (no position change)
              if (currentGameState.isMultiplayer && player.isLocal) {
                console.log(`💔 Player ${player.name} lost a life, ${newLives} lives remaining`);
              }

              return {
                ...player,
                lives: newLives
              };
            }
            return { ...player, lives: newLives };
          }
          return { ...player, lives: Math.max(0, player.lives - playerLivesLost) };

        // Bullet-Enemy collisions
        // Bullet collision code commented out for debugging
        });         
        currentBullets = currentBullets.filter(bullet => {
          if (bullet.isEnemy || bulletsToRemove.has(bullet.id)) return true;

          let bulletWasConsumed = false;
          const enemiesForBulletCheck = currentEnemies.filter(e => !enemiesToUpdate.has(e.id) || enemiesToUpdate.get(e.id).health > 0);

          // Handle poison cloud effects
          if (bullet.isPoisonCloud) {
            enemiesForBulletCheck.forEach(enemy => {
              if (checkCollision(bullet, enemy)) {
                let enemyCurrentHealth = enemiesToUpdate.has(enemy.id) ? enemiesToUpdate.get(enemy.id).health : enemy.health;
                let damage = bullet.damage || 1;
                let newEnemyHealth = enemyCurrentHealth - damage;
                enemiesToUpdate.set(enemy.id, { health: newEnemyHealth });

                if (newEnemyHealth <= 0) {
                  explosionsToAdd.push({
                    id: `exp-${now}-${enemy.id}`,
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    size: enemy.isBoss ? 100 : 50,
                    time: 0,
                    duration: 800
                  });
                  if (enemy.isBoss) {
                    scoreChange += 1000 + (enemiesDestroyedThisLevelRef.current * 1000);
                  } else {
                    scoreChange += 100;
                    enemiesDestroyedThisLevelRef.current += 1;
                  }
                }
              }
            });

            // Poison clouds have limited duration
            if (bullet.duration && now - (bullet.createdAt || now) > bullet.duration) {
              bulletWasConsumed = true;
            }
            return !bulletWasConsumed;
          }

          // Handle pet bomb explosions
          if (bullet.isPetBomb && bullet.y >= CANVAS_HEIGHT - 50) {
            // Bomb explodes on impact with ground
            const explosionX = bullet.x + bullet.width / 2;
            const explosionY = bullet.y + bullet.height;
            
            enemiesForBulletCheck.forEach(enemy => {
              const distance = Math.sqrt((enemy.x - explosionX) ** 2 + (enemy.y - explosionY) ** 2);
              if (distance < (bullet.explosionRadius || 30)) {
                let enemyCurrentHealth = enemiesToUpdate.has(enemy.id) ? enemiesToUpdate.get(enemy.id).health : enemy.health;
                let damage = bullet.damage || 1;
                let newEnemyHealth = enemyCurrentHealth - damage;
                enemiesToUpdate.set(enemy.id, { health: newEnemyHealth });

                if (newEnemyHealth <= 0) {
                  explosionsToAdd.push({
                    id: `exp-${now}-${enemy.id}`,
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    size: enemy.isBoss ? 100 : 50,
                    time: 0,
                    duration: 800
                  });
                  if (enemy.isBoss) {
                    scoreChange += 1000 + (enemiesDestroyedThisLevelRef.current * 1000);
                  } else {
                    scoreChange += 100;
                    enemiesDestroyedThisLevelRef.current += 1;
                  }
                }
              }
            });

            explosionsToAdd.push({
              id: `bomb-exp-${now}`,
              x: explosionX,
              y: explosionY,
              size: 40,
              time: 0,
              duration: 500
            });

            bulletWasConsumed = true;
            return false;
          }

          for (let i = 0; i < enemiesForBulletCheck.length; i++) {
            let enemy = enemiesForBulletCheck[i];
            if (checkCollision(bullet, enemy)) {
              let enemyCurrentHealth = enemiesToUpdate.has(enemy.id) ? enemiesToUpdate.get(enemy.id).health : enemy.health;
              let damage = bullet.damage || 1;
              let newEnemyHealth = enemyCurrentHealth - damage;
              enemiesToUpdate.set(enemy.id, { health: newEnemyHealth });

              if (newEnemyHealth <= 0) {
                console.log(`💥 ¡Enemigo ${enemy.id} derrotado! Salud: ${enemyCurrentHealth} -> ${newEnemyHealth}`);
                explosionsToAdd.push({
                  id: `exp-${now}-${enemy.id}`,
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height / 2,
                  size: enemy.isBoss ? 100 : 50,
                  time: 0,
                  duration: 800
                });
                if (enemy.isBoss) {
                  scoreChange += 1000 + (enemiesDestroyedThisLevelRef.current * 1000);
                } else {
                  scoreChange += 100;
                  enemiesDestroyedThisLevelRef.current += 1;
                }
                enemiesDestroyedThisGameRef.current += 1;

                // Send immediate enemy destruction notification in multiplayer
                if (currentGameState.isMultiplayer) {
                  const net = networkFunctionsRef.current;
                  net.sendEnemyDestroyed?.({
                    enemyId: enemy.id,
                    enemyX: enemy.x + enemy.width / 2,
                    enemyY: enemy.y + enemy.height / 2,
                    enemyType: enemy.type,
                    isBoss: enemy.isBoss,
                    playerId: player.id,
                    playerName: player.name,
                    score: enemy.isBoss ? (1000 + enemiesDestroyedThisLevelRef.current * 1000) : 100,
                    timestamp: now
                  });
                }
              }

              bullet.hitsRemaining = (bullet.hitsRemaining || 1) - 1;
              if (bullet.hitsRemaining <= 0) {
                bulletWasConsumed = true;
                break;
              }
            }
          }
          return !bulletWasConsumed;
        });
        
      }

      // Actualizar estados
      setPlayers(currentPlayers);
      setEnemies(prevEnemies => {
        const updatedEnemies = prevEnemies.map(enemy => {
          if (enemiesToUpdate.has(enemy.id)) {
            return { ...enemy, health: enemiesToUpdate.get(enemy.id).health };
          }
          return enemy;
        }).filter(enemy => enemy.health > 0);

        const defeatedCount = prevEnemies.length - updatedEnemies.length;
        if (defeatedCount > 0) {
          console.log(`⚔️ ${defeatedCount} enemigos derrotados en este frame. Restantes: ${updatedEnemies.length}`);
        }

        return updatedEnemies;
      });
      setBullets(currentBullets.filter(bu => !bulletsToRemove.has(bu.id)));
      setPowerups(currentPowerups.filter(po => !powerupsTaken.has(po.id)));
      setCoins(currentCoins.filter(co => !coinsTaken.has(co.id)));
      setExplosions(prevExplosions => prevExplosions.filter(exp => exp.time < exp.duration).concat(explosionsToAdd));

      if (scoreChange > 0) {
        setGameState(g => {
          const newScore = g.score + scoreChange;
          // Send score update in multiplayer
          if (g.isMultiplayer) {
            const localPlayer = currentPlayers.find(p => p.isLocal);
            if (localPlayer) {
              sendScoreUpdate?.({
                playerId: localPlayer.id,
                playerName: localPlayer.name,
                score: newScore,
                scoreChange: scoreChange,
                timestamp: now
              });
            }
          }
          return { ...g, score: newScore };
        });
      }

   
      if (currentEnemies.length === 0 && !levelCompletionInProgressRef.current) {
        console.log(`🏁 ¡Todos los enemigos derrotados! Nivel actual: ${currentGameState.level}, preparando siguiente nivel...`);
        levelCompletionInProgressRef.current = true;
        setLevelUpAnimation(true);
        // Limpiar balas enemigas al pasar de nivel para evitar bugs
        setBullets(prev => prev.filter(b => !b.isEnemy));
        // Limpiar power-ups y monedas para evitar acumulación
        setPowerups([]);
        setCoins([]);
        setTimeout(() => {
          const currentLevel = currentGameState.level;
          const newLevel = Math.min(currentLevel + 1, 100); // Ensure level doesn't exceed 100 and increment by 1
          console.log(`🎯 Progreso de nivel: ${currentLevel} -> ${newLevel} (incrementado exactamente en 1)`);
          console.log(`📊 Estado del juego antes del cambio de nivel:`, currentGameState);

          // Add level completion bonus
          const levelBonus = 50;
          setGameState(prev => {
            const newScore = prev.score + levelBonus;
            console.log(`🎉 ¡Bonificación de nivel completado! +${levelBonus} puntos`);
            return { ...prev, score: newScore };
          });

          // Reset enemies defeated counter for new level
          enemiesDestroyedThisLevelRef.current = 0;

          spawnEnemies(newLevel); // Spawn enemies for the new level
          setGameState(prev => {
            const newState = { ...prev, level: newLevel };
            console.log(`📊 Estado del juego después del cambio de nivel:`, newState);
            return newState;
          });
          setLevelUpAnimation(false);
          levelCompletionInProgressRef.current = false;
        }, 2000);
      }
      

      // Verificar fin de juego
      if (currentPlayers.length > 0 && currentPlayers.every(p => p.lives <= 0)) {
        if (currentGameState.isMultiplayer) {
          // En multiplayer, no terminar el juego, mostrar pantalla de retorno a sala
          setGameState(prev => ({
            ...prev,
            currentScreen: 'multiplayerGameOver'
          }));
        } else {
          endGame();
        }
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, endGame, spawnEnemies]);

  useEffect(() => {
    console.log('🎮 GAMESTATE: useEffect activado - gameRunning:', gameState.gameRunning, 'gamePaused:', gameState.gamePaused);
    if (gameState.gameRunning && !gameState.gamePaused) {
      console.log('🎮 GAMESTATE: Iniciando bucle de juego');
      runGameLoop();
    } else {
      console.log('🎮 GAMESTATE: Cancelando bucle de juego');
      cancelAnimationFrame(animationFrameId.current);
    }
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [gameState.gameRunning, gameState.gamePaused, runGameLoop]);

  const startGame = useCallback((initialPlayers, initialEnemies, initialLevel, sharedSeed = null) => {
    console.log('🎮 GAMESTATE: startGame llamado con jugadores:', initialPlayers?.length || 0, 'enemigos:', initialEnemies?.length || 0, 'seed:', sharedSeed);

    // Set shared seed for perfect synchronization
    if (sharedSeed !== null) {
      setSharedGameSeed(sharedSeed);
      console.log('🎲 Shared game seed set:', sharedSeed);
    }

    const playersArray = Array.isArray(initialPlayers) ? initialPlayers : user ? [{
      id: user.username || 'local-player',
      name: user.username || 'Player',
      avatar: user.avatar || '👨‍🚀',
      ship: user.equippedShip || 'ship1',
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      isLocal: true,
      isMultiplayer: false,
      controls: { left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Space' }
    }] : [];

    lastAutoShootTimeRef.current = {};
    lastHealthRegenTimeRef.current = {};
    lastMagnetEffectTimeRef.current = 0;
    enemiesDestroyedThisGameRef.current = 0;
    enemiesDestroyedThisLevelRef.current = 0;
    enemiesDestroyedThisLevelRef.current = 0;

    setPlayers(playersArray.map(p => ({
      ...p,
      lives: p.isAdmin && p.settings?.noclip ? Infinity : 3,
      score: 0,
      coinsEarnedThisGame: 0,
      activePowerups: {},
      powerupInventory: p.isLocal ? (user?.powerupInventory || {}) : {},
      upgrades: {
        fireRate: 1,
        damage: 1,
        mobility: 1
      },
      isAdmin: p.isLocal && user?.isAdmin,
      settings: p.isLocal ? (user?.settings || {}) : {},
      equippedUpgrade: p.isLocal ? user?.equippedUpgrade : null,
      equippedPet: p.equippedPet || null,
      petLevels: p.petLevels || {}
    })));

    // Set coin amounts based on user type
    let startingCoins = 0;
    if (user) {
      if (user.isSpecialAdmin) {
        startingCoins = Infinity; // Special admin gets infinite coins
      } else if (user.isAdmin) {
        startingCoins = Infinity; // Regular admin gets infinite coins
      } else {
        startingCoins = 0; // Normal users start with 0 coins
      }
    }

    const gameLevel = initialLevel || 1;
    const isMultiplayerGame = playersArray.some(p => p.isMultiplayer);

    setGameState(prev => ({
      ...prev,
      gameRunning: true,
      gamePaused: false,
      score: 0,
      coins: startingCoins,
      level: gameLevel,
      currentScreen: 'game',
      isMultiplayer: isMultiplayerGame
    }));

    // Handle enemies for both single player and multiplayer
    if (initialEnemies && initialEnemies.length > 0) {
      // For multiplayer, enemies are provided by server with shared seed
      console.log('🎯 Using server-provided enemies for perfect synchronization');
      spawnEnemies(gameLevel, initialEnemies, sharedSeed);
    } else {
      // For single player, spawn enemies locally
      spawnEnemies(gameLevel);
    }

    setBullets([]);
    setPowerups([]);
    setCoins([]);
    setExplosions([]);
    lastEnemyShootTimeRef.current = Date.now();
    enemySpeedMultiplierRef.current = 1;
    setLevelUpAnimation(false);
    console.log('🎮 GAMESTATE: startGame completado exitosamente, retornando true');
    return true;
  }, [spawnEnemies, user, seededRandom]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePaused: !prev.gamePaused,
      currentScreen: !prev.gamePaused ? 'pause' : 'game'
    }));
  }, []);

  const backToMenu = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameRunning: false,
      gamePaused: false,
      currentScreen: 'start',
      isMultiplayer: false
    }));
    cancelAnimationFrame(animationFrameId.current);
    setPlayers([]);
    setEnemies([]);
    setBullets([]);
    setPowerups([]);
    setCoins([]);
    setExplosions([]);
    lastAutoShootTimeRef.current = {};
    lastHealthRegenTimeRef.current = {};
    lastMagnetEffectTimeRef.current = 0;
    lastEnemyUpdateTimeRef.current = 0;
    lastGameStateUpdateTimeRef.current = 0;
    enemiesDestroyedThisGameRef.current = 0;
  }, []);

  useEffect(() => {
    try {
      const savedScores = localStorage.getItem('spaceInvadersHighScores');
      if (savedScores) setGameState(prev => ({ ...prev, highScores: JSON.parse(savedScores) }));
    } catch (e) { console.error("Error cargando puntuaciones", e); }
  }, []);

  return {
    gameState,
    players,
    enemies,
    bullets,
    powerups,
    coins,
    explosions,
    levelUpAnimation,
    gameSeed,
    sharedGameSeed,
    setPlayers,
    startGame,
    pauseGame,
    backToMenu,
    setBullets,
    setEnemies
  };
};