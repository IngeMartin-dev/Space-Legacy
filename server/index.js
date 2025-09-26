
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import cors from 'cors';
import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Performance optimizations for Express
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow Vercel deployments
    if (origin.includes('vercel.app') || origin.includes('now.sh')) {
      return callback(null, true);
    }

    // Allow all origins in production (fallback)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware for better performance (already imported above)
app.use(compression({
  level: 6, // Good balance between speed and compression
  threshold: 1024, // Only compress responses over 1KB
  filter: (req, res) => {
    // Don't compress event streams or already compressed responses
    if (req.headers['accept-encoding']?.includes('gzip')) {
      return compression.filter(req, res);
    }
    return false;
  }
}));

// Security and performance headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // Cache static assets for better performance
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
  next();
});

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabaseServer = null;
if (supabaseUrl && supabaseKey) {
  supabaseServer = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // Performance optimizations
    global: {
      headers: {
        'x-client-info': 'space-invaders-server'
      }
    },
    db: {
      schema: 'public'
    },
    // Disable real-time subscriptions for server-side operations
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });
  console.log('✅ Supabase server client initialized with performance optimizations');
} else {
  console.warn('⚠️ Supabase environment variables not found for server');
}

// Helper function to log to file
const logToFile = (message) => {
  const logFile = join(__dirname, 'server.log');
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
};

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Allow Vercel deployments
      if (origin.includes('vercel.app') || origin.includes('now.sh')) {
        return callback(null, true);
      }

      // Allow all origins in production (fallback)
      return callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  pingTimeout: 2000, // Further reduced for ultra-fast disconnect detection
  pingInterval: 800, // More frequent health checks for lower ping
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  connectTimeout: 5000, // Faster connection timeout
  maxHttpBufferSize: 512 * 1024, // Optimized buffer size (512KB)
  perMessageDeflate: {
    threshold: 1024, // Compress messages over 1KB
    level: 6 // Good compression level for performance
  },
  // Additional performance optimizations
  cookie: false, // Disable cookies for better performance
  serveClient: false, // Don't serve client library
  allowUpgrades: true, // Allow upgrades to WebSocket
  httpCompression: true // Enable HTTP compression
});

let gameRooms = new Map();
let connectedPlayersInfo = new Map();
let allConnectedUsers = new Map(); // Track all connected users globally

// Enhanced logging system
const logEvent = (type, data) => {
  const timestamp = new Date().toISOString();
  const message = `🎮 [${type}] ${data.message} | 🕐 ${timestamp}`;
  console.log(message);
  logToFile(message);
  if (data.details) {
    Object.entries(data.details).forEach(([key, value]) => {
      const detailMsg = `   ${key}: ${value}`;
      console.log(detailMsg);
      logToFile(detailMsg);
    });
  }
};

class GameRoom {
  constructor(code, hostId) {
    this.code = code;
    this.hostId = hostId;
    this.players = new Map();
    this.maxPlayers = 4;
    this.gameStarted = false;
    this.gameStartTime = null;
  }

  addPlayer(player) {
    if (this.players.size >= this.maxPlayers) return false;
    this.players.set(player.id, player);
    return true;
  }

  removePlayer(playerId) {
    const playerExists = this.players.has(playerId);
    if (!playerExists) return false;

    this.players.delete(playerId);
    if (playerId === this.hostId && this.players.size > 0) {
      this.hostId = this.players.keys().next().value;
      logEvent('HOST_CHANGE', {
        message: `Nuevo anfitrión asignado en sala ${this.code}`,
        details: { newHost: this.hostId, roomCode: this.code }
      });
    }
    return this.players.size === 0;
  }

  getPlayersArray() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      ship: p.ship,
      equippedPet: p.equippedPet,
      petLevels: p.petLevels,
      inGame: this.gameStarted
    }));
  }
}

class Player {
  constructor(id, name, avatar, ship, equippedPet = null, petLevels = {}) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.ship = ship || 'ship1';
    this.equippedPet = equippedPet;
    this.petLevels = petLevels;
  }
}

function generateRoomCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (gameRooms.has(code));
  return code;
}

function generateUniquePlayerName(socketId) {
  // Use a combination of timestamp and random string for uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `Jugador-${timestamp}-${random}`;
}

// Seeded random function for synchronization
function seededRandom(seed) {
  let hash = 0;
  const str = seed.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

// Generate hash for game state consistency verification
function generateGameStateHash(enemies, level, seed) {
  const stateString = JSON.stringify({
    enemyCount: enemies.length,
    level: level,
    seed: seed,
    firstEnemyPos: enemies[0] ? { x: enemies[0].x, y: enemies[0].y } : null,
    timestamp: Date.now()
  });

  let hash = 0;
  for (let i = 0; i < stateString.length; i++) {
    const char = stateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Generate enemies for a level with shared seed for perfect synchronization
function generateEnemiesForLevel(level, sharedSeed = null) {
  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 800;
  const ENEMY_WIDTH = 40;
  const ENEMY_HEIGHT = 40;

  // Use shared seed for perfect synchronization
  const seed = sharedSeed || Math.floor(Math.random() * 1000000);

  const formations = [
    'line', 'v-formation', 'diamond', 'circle', 'spiral',
    'wave', 'cross', 'star', 'heart', 'arrow'
  ];

  // Use seeded random for formation selection
  const formationIndex = Math.floor(seededRandom(seed + level) * formations.length);
  const formation = formations[formationIndex];

  const baseRows = 3;
  const baseCols = 8;
  const maxRows = 6;
  const maxCols = 12;

  const rows = Math.min(baseRows + Math.floor(level / 4), maxRows);
  const cols = Math.min(baseCols + Math.floor(level / 3), maxCols);

  const positions = generateFormationPositions(formation, rows, cols, level, seed);

  const enemies = [];
  positions.forEach((pos, index) => {
    const enemyTypes = ['scout', 'fighter', 'cruiser', 'destroyer', 'battleship'];
    let type = pos.type;

    // Use seeded random for enemy type selection
    if (level > 5 && seededRandom(seed + level * 100 + index) < 0.3) {
      const typeIndex = Math.floor(seededRandom(seed + level * 1000 + index) * 5);
      type = enemyTypes[Math.min(4, Math.floor(level / 5) + typeIndex)];
    }

    let health = { scout: 1, fighter: 2, cruiser: 3, destroyer: 4, battleship: 5, mothership: 8 }[type] || 2;
    health += Math.floor((level - 1) / 3);
    health = Math.max(1, health);

    enemies.push({
      id: `${level}-${index}-${seed}`, // Include seed in ID for uniqueness
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
      animationFrame: 0,
      sharedSeed: seed // Include seed for client-side synchronization
    });
  });

  console.log(`🎯 Generated ${enemies.length} enemies for level ${level} with seed ${seed}`);
  return enemies;
}

function generateFormationPositions(formation, rows, cols, level, seed = null) {
  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 800;
  const positions = [];
  const centerX = CANVAS_WIDTH / 2;
  const centerY = 150;
  const spacing = 55;

  // Use seeded random if seed is provided
  const randomFunc = seed !== null ? (s) => seededRandom(seed + s) : Math.random;

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
}

io.on('connection', (socket) => {
  console.log('🌐 === NUEVA CONEXIÓN ===');
  console.log('🌐 Socket ID:', socket.id);
  console.log('🌐 Dirección IP:', socket.handshake.address);
  console.log('🌐 User Agent:', socket.handshake.headers['user-agent']);
  console.log('🌐 URL de origen:', socket.handshake.headers.origin);
  console.log('🌐 Total de conexiones activas:', io.engine.clientsCount);
  console.log('🌐 =====================');

  logEvent('CONNECTION', {
    message: 'Jugador conectado',
    details: {
      socketId: socket.id,
      totalConnections: io.engine.clientsCount,
      timestamp: new Date().toLocaleString(),
      ip: socket.handshake.address,
      origin: socket.handshake.headers.origin
    }
  });
  
  // Add to global connected users
  allConnectedUsers.set(socket.id, {
    socketId: socket.id,
    connectedAt: new Date().toISOString(),
    isOnline: true,
    username: generateUniquePlayerName(socket.id), // Generate unique name immediately
    currentRoom: null
  });

  // Handle user info sent from client
  socket.on('userConnected', async (userData) => {
    console.log('👤 Información del usuario recibida:', userData);

    const existingUser = allConnectedUsers.get(socket.id);
    let newUsername = userData.username;

    // If no username provided and no existing user, generate one
    if (!newUsername && !existingUser) {
      newUsername = generateUniquePlayerName(socket.id);
    }
    // If no username provided but user exists, keep existing username
    else if (!newUsername && existingUser) {
      newUsername = existingUser.username;
    }

    // Check if user is banned BEFORE allowing connection
    if (supabaseServer && newUsername) {
      try {
        const { data: activeBan, error } = await supabaseServer
          .from('user_bans')
          .select('*')
          .eq('username', newUsername)
          .eq('is_active', true)
          .or(`ban_end.is.null,ban_end.gt.${new Date().toISOString()}`)
          .single();

        if (activeBan && !error) {
          console.log(`🚫 USUARIO BANEADO INTENTANDO CONECTAR: "${newUsername}" (ID: ${socket.id})`);
          console.log(`🚫 Razón del ban: ${activeBan.ban_reason}`);
          console.log(`🚫 Baneado por: ${activeBan.banned_by}`);
          console.log(`🚫 Tipo de ban: ${activeBan.is_permanent ? 'PERMANENTE' : 'TEMPORAL'}`);

          // Send ban information immediately upon connection
          socket.emit('userBanned', {
            reason: activeBan.ban_reason,
            bannedBy: activeBan.banned_by,
            banEnd: activeBan.ban_end,
            isPermanent: activeBan.is_permanent,
            banStart: activeBan.ban_start
          });

          // Disconnect the banned user
          setTimeout(() => {
            if (socket.connected) {
              socket.disconnect(true);
              console.log(`🚫 Usuario baneado desconectado: ${newUsername}`);
            }
          }, 1000);

          return;
        }
      } catch (error) {
        console.error('❌ Error checking ban status on connection:', error);
      }
    }

    // Update user info only if not banned
    allConnectedUsers.set(socket.id, {
      socketId: socket.id,
      connectedAt: existingUser?.connectedAt || new Date().toISOString(),
      isOnline: true,
      username: newUsername,
      avatar: userData.avatar || existingUser?.avatar || '👨‍🚀',
      ship: userData.ship || existingUser?.ship || 'ship1',
      currentRoom: existingUser?.currentRoom || null
    });

    console.log('👤 Información del usuario actualizada para socket:', socket.id, 'usuario:', newUsername);

    // If user is in a room, update the room player info as well
    const updatedUser = allConnectedUsers.get(socket.id);
    if (updatedUser.currentRoom) {
      const room = gameRooms.get(updatedUser.currentRoom);
      if (room && room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        player.name = newUsername;
        player.avatar = updatedUser.avatar;
        player.ship = updatedUser.ship;

        // Notify all players in the room about the update
        const playersList = room.getPlayersArray();
        io.to(updatedUser.currentRoom).emit('playerJoined', {
          players: playersList,
          newPlayer: null, // No new player, just update
          timestamp: Date.now()
        });
      }
    }
  });

  socket.on('createRoom', async (playerData) => {
    // Get the username from connected users or player data
    const connectedUser = allConnectedUsers.get(socket.id);
    const name = playerData?.name || connectedUser?.username || `Player-${socket.id.substring(0,4)}`;

    // Ensure user is in allConnectedUsers with correct info
    if (!connectedUser) {
      allConnectedUsers.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
        isOnline: true,
        username: name,
        avatar: playerData?.avatar || '👨‍🚀',
        ship: playerData?.ship || 'ship1',
        currentRoom: null
      });
    }
    const avatar = playerData?.avatar || '👨‍🚀';
    const ship = playerData?.ship || 'ship1';
    const equippedPet = playerData?.equippedPet || null;
    const petLevels = playerData?.petLevels || {};

    // Check if user is banned
    if (supabaseServer) {
      try {
        const { data: activeBan, error } = await supabaseServer
          .from('user_bans')
          .select('*')
          .eq('username', name)
          .eq('is_active', true)
          .or(`ban_end.is.null,ban_end.gt.${new Date().toISOString()}`)
          .single();

        if (activeBan && !error) {
          console.log(`🚫 USUARIO BANEADO INTENTANDO CREAR SALA: "${name}" (ID: ${socket.id})`);
          console.log(`🚫 Razón del ban: ${activeBan.ban_reason}`);
          console.log(`🚫 Baneado por: ${activeBan.banned_by}`);
          console.log(`🚫 Tipo de ban: ${activeBan.is_permanent ? 'PERMANENTE' : 'TEMPORAL'}`);
          socket.emit('userBanned', {
            reason: activeBan.ban_reason,
            bannedBy: activeBan.banned_by,
            banEnd: activeBan.ban_end,
            isPermanent: activeBan.is_permanent,
            banStart: activeBan.ban_start
          });
          return;
        }
      } catch (error) {
        console.error('❌ Error checking ban status:', error);
      }
    }

    // Log user login attempt
    logToFile(`👤 USUARIO CREANDO SALA:`);
    logToFile(`   👤 Nombre de usuario: ${name}`);
    logToFile(`   🔑 Contraseña: [OCULTA POR SEGURIDAD]`);
    logToFile(`   🕐 Marca de tiempo: ${new Date().toISOString()}`);
    logToFile(`   🌍 ID de socket: ${socket.id}`);
    console.log(`👤 USUARIO CREANDO SALA:`);
    console.log(`   👤 Nombre de usuario: ${name}`);
    console.log(`   🔑 Contraseña: [OCULTA POR SEGURIDAD]`);
    console.log(`   🕐 Marca de tiempo: ${new Date().toISOString()}`);
    console.log(`   🌍 ID de socket: ${socket.id}`);

    const roomCode = generateRoomCode();
    const player = new Player(socket.id, name, avatar, ship, equippedPet, petLevels);
    const room = new GameRoom(roomCode, socket.id);

    if (room.addPlayer(player)) {
      gameRooms.set(roomCode, room);
      connectedPlayersInfo.set(socket.id, { roomCode, name, avatar, ship });

      // Update global user info
      if (allConnectedUsers.has(socket.id)) {
        const existingUser = allConnectedUsers.get(socket.id);
        allConnectedUsers.set(socket.id, {
          ...existingUser,
          username: name, // Use the name from room creation/join
          currentRoom: roomCode
        });
      }

      socket.join(roomCode);

      logEvent('ROOM_CREATED', {
        message: `Sala creada exitosamente`,
        details: {
          roomCode: roomCode,
          hostName: name, // Real username
          hostId: socket.id
        }
      });

      // Save room to Supabase for persistence
      if (supabaseServer) {
        try {
          await supabaseServer
            .from('multiplayer_rooms')
            .upsert({
              room_code: roomCode,
              host_player_id: socket.id,
              host_name: name,
              status: 'waiting',
              player_count: 1,
              max_players: 4,
              game_started: false,
              created_at: new Date().toISOString(),
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'room_code'
            });

          // Also save the host player to room_players table
          await supabaseServer
            .from('room_players')
            .upsert({
              room_code: roomCode,
              player_id: socket.id,
              player_name: name,
              player_avatar: avatar,
              player_ship: ship,
              joined_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              is_online: true
            }, {
              onConflict: 'room_code,player_id'
            });

          console.log(`💾 Sala ${roomCode} y jugador anfitrión guardados en Supabase`);
        } catch (error) {
          console.error('❌ Error guardando sala en Supabase:', error);
        }
      }

      const playersList = room.getPlayersArray();
      logToFile(`🏠 Sala ${roomCode} creada con ${playersList.length} jugadores: ${JSON.stringify(playersList)}`);
      console.log(`🏠 Sala ${roomCode} creada - Jugadores conectados:`, playersList.map(p => p.name));
      console.log('📤 ENVIANDO roomCreated a cliente:', socket.id);
      console.log('📤 Datos enviados:', { roomCode, players: playersList, isHost: true });
      socket.emit('roomCreated', { roomCode, players: playersList, isHost: true });
    } else {
      socket.emit('joinError', 'No se pudo crear la sala.');
    }
  });

  socket.on('joinRoom', async (data) => {
    const room = gameRooms.get(data.roomCode);
    if (!room) {
      return socket.emit('joinError', 'Esa sala no existe.');
    }
    if (room.players.size >= room.maxPlayers) {
      return socket.emit('joinError', 'La sala está llena.');
    }
    // Allow joining even if game has started - spectators can join

    // Get the username from connected users or player data
    const connectedUser = allConnectedUsers.get(socket.id);
    const name = data.playerData?.name || connectedUser?.username || `Player-${socket.id.substring(0,4)}`;

    // Ensure user is in allConnectedUsers with correct info
    if (!connectedUser) {
      allConnectedUsers.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
        isOnline: true,
        username: name,
        avatar: data.playerData?.avatar || '👨‍🚀',
        ship: data.playerData?.ship || 'ship1',
        currentRoom: null
      });
    }
    const avatar = data.playerData?.avatar || '👨‍🚀';
    const ship = data.playerData?.ship || 'ship1';
    const equippedPet = data.playerData?.equippedPet || null;
    const petLevels = data.playerData?.petLevels || {};

    // Check if user is banned
    if (supabaseServer) {
      try {
        const { data: activeBan, error } = await supabaseServer
          .from('user_bans')
          .select('*')
          .eq('username', name)
          .eq('is_active', true)
          .or(`ban_end.is.null,ban_end.gt.${new Date().toISOString()}`)
          .single();

        if (activeBan && !error) {
          console.log(`🚫 USUARIO BANEADO INTENTANDO UNIRSE A SALA: "${name}" (ID: ${socket.id})`);
          console.log(`🚫 Razón del ban: ${activeBan.ban_reason}`);
          console.log(`🚫 Baneado por: ${activeBan.banned_by}`);
          console.log(`🚫 Tipo de ban: ${activeBan.is_permanent ? 'PERMANENTE' : 'TEMPORAL'}`);
          socket.emit('userBanned', {
            reason: activeBan.ban_reason,
            bannedBy: activeBan.banned_by,
            banEnd: activeBan.ban_end,
            isPermanent: activeBan.is_permanent,
            banStart: activeBan.ban_start
          });
          return;
        }
      } catch (error) {
        console.error('❌ Error checking ban status:', error);
      }
    }

    // Log user joining room
    logToFile(`👤 USUARIO UNIÉNDOSE A SALA:`);
    logToFile(`   👤 Nombre de usuario: ${name}`);
    logToFile(`   🏠 Código de sala: ${data.roomCode}`);
    logToFile(`   🕐 Marca de tiempo: ${new Date().toISOString()}`);
    logToFile(`   🌍 ID de socket: ${socket.id}`);
    console.log(`👤 USUARIO UNIÉNDOSE A SALA:`);
    console.log(`   👤 Nombre de usuario: ${name}`);
    console.log(`   🏠 Código de sala: ${data.roomCode}`);
    console.log(`   🕐 Marca de tiempo: ${new Date().toISOString()}`);
    console.log(`   🌍 ID de socket: ${socket.id}`);

    const player = new Player(socket.id, name, avatar, ship, equippedPet, petLevels);
    if (room.addPlayer(player)) {
      connectedPlayersInfo.set(socket.id, { roomCode: data.roomCode, name, avatar, ship });

      // Update global user info
      if (allConnectedUsers.has(socket.id)) {
        const existingUser = allConnectedUsers.get(socket.id);
        allConnectedUsers.set(socket.id, {
          ...existingUser,
          username: name, // Use the name from room join
          currentRoom: data.roomCode
        });
      }

      socket.join(data.roomCode);

      logEvent('ROOM_JOINED', {
        message: `Jugador se unió a sala`,
        details: {
          playerName: name, // Real username
          roomCode: data.roomCode,
          playersInRoom: room.players.size,
          playerId: socket.id
        }
      });

      // Update room in Supabase with new player count
      if (supabaseServer) {
        try {
          await supabaseServer
            .from('multiplayer_rooms')
            .update({
              player_count: room.players.size,
              last_updated: new Date().toISOString()
            })
            .eq('room_code', data.roomCode);

          // Save the new player to room_players table
          await supabaseServer
            .from('room_players')
            .upsert({
              room_code: data.roomCode,
              player_id: socket.id,
              player_name: name,
              player_avatar: avatar,
              player_ship: ship,
              joined_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              is_online: true
            }, {
              onConflict: 'room_code,player_id'
            });

          console.log(`💾 Jugador ${name} agregado a sala ${data.roomCode} en Supabase`);
        } catch (error) {
          console.error('❌ Error actualizando sala en Supabase:', error);
        }
      }

      // Notify all players immediately (instant update)
      const playersList = room.getPlayersArray();
      const eventTimestamp = Date.now();
      logToFile(`⚡ INSTANT BROADCAST: playerJoined - ${playersList.length} jugadores en sala ${data.roomCode} at ${new Date(eventTimestamp).toISOString()}`);
      logToFile(`⚡ Enviando lista de jugadores: ${JSON.stringify(playersList.map(p => ({ id: p.id, name: p.name })))}`);
      console.log(`⚡ INSTANT BROADCAST: playerJoined - ${playersList.length} jugadores en sala ${data.roomCode} at ${new Date(eventTimestamp).toISOString()}`);
      console.log(`⚡ Jugadores conectados:`, playersList.map(p => p.name));
      console.log('📤 ENVIANDO playerJoined a TODOS en sala:', data.roomCode);
      console.log('📤 Datos enviados:', {
        players: playersList,
        newPlayer: { id: player.id, name: player.name, avatar: player.avatar, ship: player.ship }
      });

      io.to(data.roomCode).emit('playerJoined', {
        players: playersList,
        newPlayer: { id: player.id, name: player.name, avatar: player.avatar, ship: player.ship },
        timestamp: eventTimestamp
      });

      console.log(`✅ SERVIDOR: Evento playerJoined enviado a sala ${data.roomCode}`);
      console.log(`👥 SERVIDOR: Enviando lista de ${playersList.length} jugadores`);
      console.log(`🆕 SERVIDOR: Nuevo jugador: ${player.name} (ID: ${player.id})`);
      console.log(`📡 SERVIDOR: Evento enviado a ${io.sockets.adapter.rooms.get(data.roomCode)?.size || 0} conexiones en sala`);
      logToFile(`✅ Evento playerJoined enviado a sala ${data.roomCode} at ${new Date(eventTimestamp).toISOString()}`);

      const joinedPlayersList = room.getPlayersArray();
      logToFile(`🚪 Jugador se unió a sala ${data.roomCode}, enviando ${joinedPlayersList.length} jugadores: ${JSON.stringify(joinedPlayersList)}`);
      console.log(`🚪 Jugador se unió a sala ${data.roomCode}, enviando ${joinedPlayersList.length} jugadores:`, joinedPlayersList);
      console.log('📤 ENVIANDO roomJoined al nuevo jugador:', socket.id);
      console.log('📤 Datos enviados:', {
        roomCode: data.roomCode,
        players: joinedPlayersList,
        isHost: socket.id === room.hostId
      });
      socket.emit('roomJoined', {
        roomCode: data.roomCode,
        players: joinedPlayersList,
        isHost: socket.id === room.hostId
      });
    } else {
      socket.emit('joinError', 'No se pudo unir a la sala.');
    }
  });


  socket.on('startGame', () => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    const room = gameRooms.get(playerInfo.roomCode);
    if (!room) return;

    if (socket.id !== room.hostId) {
      return socket.emit('gameError', 'Solo el anfitrión puede iniciar la partida.');
    }

    // Generate a shared random seed for perfect synchronization
    const sharedGameSeed = Math.floor(Math.random() * 1000000);
    room.sharedGameSeed = sharedGameSeed;

    console.log(`🎲 Shared game seed generated for room ${room.code}: ${sharedGameSeed}`);

    // Notify all players that game is starting with countdown
    io.to(playerInfo.roomCode).emit('gameStarting', {
      countdown: 3,
      startTime: Date.now() + 3000,
      sharedGameSeed: sharedGameSeed
    });

    // Mark game as started after countdown
    setTimeout(() => {
      room.gameStarted = true;
      room.gameStartTime = Date.now();

      logEvent('GAME_STARTED', {
        message: `Juego iniciado en sala`,
        details: {
          roomCode: room.code,
          players: room.players.size,
          sharedGameSeed: sharedGameSeed
        }
      });

      // Generate enemies for the level using the shared seed
      const level = 1; // Always start at level 1
      const enemies = generateEnemiesForLevel(level, sharedGameSeed);

      // Start game for ALL players in the room with shared seed
      // Ensure all players receive the exact same game state
      const gameStartData = {
        players: room.getPlayersArray(),
        enemies: enemies,
        level: level,
        startTime: Date.now(),
        sharedGameSeed: sharedGameSeed,
        serverTimestamp: Date.now(), // Add server timestamp for synchronization
        gameStateHash: generateGameStateHash(enemies, level, sharedGameSeed) // Add hash for consistency verification
      };
  
      io.to(playerInfo.roomCode).emit('gameStarted', gameStartData);
  
      // Store the game state for synchronization checks
      room.currentGameState = gameStartData;

      console.log(`🎮 Game started with perfect synchronization for room ${room.code}`);
      console.log(`🎯 Enemies generated: ${enemies.length} with seed ${sharedGameSeed}`);
    }, 3000);
  });

  socket.on('playerMove', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;
    
    socket.to(playerInfo.roomCode).emit('playerMoved', {
      playerId: socket.id,
      x: data.x,
      y: data.y,
      timestamp: Date.now()
    });
  });

  socket.on('playerShoot', (bulletData) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;
    
    const bullet = {
      ...bulletData,
      id: `${socket.id}-${Date.now()}`,
      playerId: socket.id,
      timestamp: Date.now()
    };
    
    io.to(playerInfo.roomCode).emit('playerShoot', bullet);
  });

  socket.on('chatMessage', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    const messagePayload = {
      username: playerInfo.name,
      text: data.text,
      timestamp: Date.now()
    };

    io.to(playerInfo.roomCode).emit('chatMessage', messagePayload);
  });

  socket.on('enemyDestroyed', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast enemy destruction to all players in the room
    const destructionData = {
      enemyId: data.enemyId,
      playerId: socket.id,
      score: data.score || 150,
      enemyX: data.enemyX,
      enemyY: data.enemyY
    };

    io.to(playerInfo.roomCode).emit('enemyDestroyed', destructionData);
  });

  socket.on('levelCompleted', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    const room = gameRooms.get(playerInfo.roomCode);
    if (!room) return;

    // Generate synchronized enemies for the new level using the room's shared seed
    const newLevel = data.newLevel || (room.currentLevel || 1) + 1;
    const synchronizedEnemies = generateEnemiesForLevel(newLevel, room.sharedGameSeed);

    // Broadcast level completion with synchronized enemy data to all players
    const levelData = {
      newLevel: newLevel,
      enemies: synchronizedEnemies,
      sharedGameSeed: room.sharedGameSeed,
      serverTimestamp: Date.now(),
      gameStateHash: generateGameStateHash(synchronizedEnemies, newLevel, room.sharedGameSeed)
    };

    // Update room's current level
    room.currentLevel = newLevel;
    room.currentGameState = {
      ...room.currentGameState,
      level: newLevel,
      enemies: synchronizedEnemies,
      gameStateHash: levelData.gameStateHash
    };

    io.to(playerInfo.roomCode).emit('levelCompleted', levelData);
    console.log(`🎯 Level ${newLevel} completed with perfect synchronization for room ${playerInfo.roomCode}`);
  });

  socket.on('enemyShoot', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast enemy bullet to all players in the room
    const bulletData = {
      ...data,
      timestamp: Date.now()
    };

    io.to(playerInfo.roomCode).emit('enemyShoot', bulletData);
  });

  socket.on('powerupTaken', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast powerup collection to all players in the room
    const powerupData = {
      powerupId: data.powerupId,
      playerId: socket.id
    };

    io.to(playerInfo.roomCode).emit('powerupTaken', powerupData);
  });

  socket.on('coinTaken', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast coin collection to all players in the room
    const coinData = {
      coinId: data.coinId,
      playerId: socket.id
    };

    io.to(playerInfo.roomCode).emit('coinTaken', coinData);
  });

  socket.on('enemyUpdate', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast enemy updates to all other players in the room
    socket.to(playerInfo.roomCode).emit('enemyUpdate', {
      ...data,
      playerId: socket.id
    });
  });

  socket.on('gameStateUpdate', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast game state updates to all other players in the room
    socket.to(playerInfo.roomCode).emit('gameStateUpdate', {
      ...data,
      playerId: socket.id
    });
  });

  socket.on('playerDeath', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast player death to all players in the room
    io.to(playerInfo.roomCode).emit('playerDeath', {
      ...data,
      playerId: socket.id,
      playerName: playerInfo.name
    });
  });

  socket.on('playerRespawn', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast player respawn to all players in the room
    io.to(playerInfo.roomCode).emit('playerRespawn', {
      ...data,
      playerId: socket.id,
      playerName: playerInfo.name
    });
  });

  socket.on('scoreUpdate', (data) => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) return;

    // Broadcast score updates to all other players in the room
    socket.to(playerInfo.roomCode).emit('scoreUpdate', {
      ...data,
      playerId: socket.id,
      playerName: playerInfo.name
    });
  });

  socket.on('kickPlayer', async (data) => {
    console.log('🚫 SERVIDOR: Recibida solicitud de kick:', data);
    console.log('🚫 SERVIDOR: Socket ID del solicitante:', socket.id);

    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (!playerInfo) {
      console.log('❌ SERVIDOR: No se encontró info del jugador solicitante');
      return;
    }

    const room = gameRooms.get(playerInfo.roomCode);
    if (!room) {
      console.log('❌ SERVIDOR: Sala no encontrada:', playerInfo.roomCode);
      return;
    }

    if (socket.id !== room.hostId) {
      console.log('❌ SERVIDOR: Usuario no es anfitrión. Host actual:', room.hostId, 'Solicitante:', socket.id);
      return;
    }

    console.log('✅ SERVIDOR: Validación de anfitrión exitosa');

    // Find the player to kick by username or socketId
    let playerToKickId = data.playerIdToKick;
    let playerToKickInfo = connectedPlayersInfo.get(playerToKickId);

    // If not found by socketId, try to find by username
    if (!playerToKickInfo) {
      for (const [socketId, info] of connectedPlayersInfo) {
        if (info.name === data.playerIdToKick) {
          playerToKickId = socketId;
          playerToKickInfo = info;
          break;
        }
      }
    }

    if (!playerToKickInfo || playerToKickId === socket.id) return;

    // Check if this is a ban request
    const isBan = data.banMinutes !== undefined;
    let banData = null;

    if (isBan && supabaseServer) {
      const banMinutes = data.banMinutes;
      const isPermanent = banMinutes === 'indefinido' || banMinutes === 'permanente' || banMinutes === 999999;

      const banEnd = isPermanent ? null : new Date(Date.now() + (banMinutes * 60 * 1000));

      try {
        // Insert ban into database
        const { data: banResult, error } = await supabaseServer
          .from('user_bans')
          .insert({
            username: playerToKickInfo.name,
            banned_by: playerInfo.name,
            ban_reason: data.reason || `Baneado por ${isPermanent ? 'tiempo indefinido' : banMinutes + ' minutos'}`,
            ban_duration_minutes: isPermanent ? null : banMinutes,
            ban_end: banEnd,
            is_permanent: isPermanent,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating ban:', error);
          socket.emit('banError', 'Error al crear el ban en la base de datos');
          return;
        }

        banData = banResult;
        console.log(`🚫 BAN CREADO: Usuario "${playerToKickInfo.name}" baneado por admin "${playerInfo.name}" por ${isPermanent ? 'tiempo indefinido' : banMinutes + ' minutos'}`);
        console.log(`🚫 Detalles del ban: ID=${banResult.id}, Usuario=${playerToKickInfo.name}, Admin=${playerInfo.name}`);
      } catch (error) {
        console.error('❌ Error en ban system:', error);
        socket.emit('banError', 'Error interno del sistema de bans');
        return;
      }
    }

    logEvent('PLAYER_KICKED', {
      message: `Jugador "${playerToKickInfo.name}" ${isBan ? 'baneado' : 'expulsado'} de sala por admin "${playerInfo.name}"`,
      details: {
        kickedPlayer: playerToKickInfo.name,
        hostName: playerInfo.name,
        roomCode: room.code,
        isBan: isBan,
        banDuration: isBan ? (data.banMinutes === 'indefinido' ? 'permanente' : data.banMinutes + ' minutos') : null
      }
    });

    // Send kick/ban notification to the kicked player
    io.to(playerToKickId).emit('playerKicked', {
      reason: data.reason || `Has sido ${isBan ? 'baneado' : 'expulsado'} de la sala ${room.code}`,
      hostName: playerInfo.name,
      isBan: isBan,
      banData: banData
    });

    // Send notification to all remaining players in the room about the kick/ban
    io.to(room.code).emit('playerKickedNotification', {
      kickedPlayerName: playerToKickInfo.name,
      kickedBy: playerInfo.name,
      reason: data.reason || `Expulsado de la sala`,
      isBan: isBan,
      timestamp: Date.now()
    });

    // Remove player from room and update all players immediately
    const roomIsEmpty = room.removePlayer(playerToKickId);
    connectedPlayersInfo.delete(playerToKickId);

    // Update global user info
    if (allConnectedUsers.has(playerToKickId)) {
      allConnectedUsers.set(playerToKickId, {
        ...allConnectedUsers.get(playerToKickId),
        currentRoom: null
      });
    }

    const playerSocket = io.sockets.sockets.get(playerToKickId);
    if (playerSocket) {
      playerSocket.leave(room.code);
    }

    if (roomIsEmpty) {
      gameRooms.delete(room.code);
      logEvent('ROOM_DELETED', {
        message: `Sala eliminada después de ${isBan ? 'ban' : 'expulsión'}`,
        details: { roomCode: room.code }
      });
    } else {
      // Notify remaining players immediately (instant update)
      const remainingPlayers = room.getPlayersArray();
      logToFile(`⚡ INSTANT BROADCAST: player${isBan ? 'Banned' : 'Kicked'} - ${remainingPlayers.length} jugadores restantes en sala ${room.code}`);
      console.log(`⚡ INSTANT BROADCAST: player${isBan ? 'Banned' : 'Kicked'} - ${remainingPlayers.length} jugadores restantes en sala ${room.code}`);

      io.to(room.code).emit('playerLeft', {
        leftPlayerName: playerToKickInfo.name,
        leftPlayerId: playerToKickId,
        players: remainingPlayers,
        newHost: room.hostId,
        reason: isBan ? 'ban' : 'kick',
        kickedBy: playerInfo.name
      });
    }
  });

  const handlePlayerLeave = async (socketId) => {
    const playerInfo = connectedPlayersInfo.get(socketId);

    // Remove from global users immediately when disconnecting
    allConnectedUsers.delete(socketId);
    
    if (!playerInfo) return;

    const roomCode = playerInfo.roomCode;
    const room = gameRooms.get(roomCode);
    const disconnectedPlayerName = playerInfo.name;

    logEvent('DISCONNECT', {
      message: 'Jugador desconectado',
      details: {
        playerName: disconnectedPlayerName, // Real username
        roomCode: roomCode,
        socketId: socketId,
        disconnectTime: new Date().toLocaleString()
      }
    });

    if (room) {
      const roomIsEmpty = room.removePlayer(socketId);

      if (roomIsEmpty) {
        gameRooms.delete(roomCode);
        logEvent('ROOM_DELETED', {
          message: `Sala eliminada`,
          details: { roomCode: roomCode }
        });
  
        // Delete room from Supabase when it's empty
        if (supabaseServer) {
          try {
            await supabaseServer
              .from('multiplayer_rooms')
              .delete()
              .eq('room_code', roomCode);
  
            await supabaseServer
              .from('room_players')
              .delete()
              .eq('room_code', roomCode);
  
            console.log(`🗑️ Sala ${roomCode} eliminada de Supabase (vacía)`);
          } catch (error) {
            console.error('❌ Error eliminando sala vacía de Supabase:', error);
          }
        }
      } else {
        // Update room player count in Supabase when a player leaves
        if (supabaseServer) {
          try {
            await supabaseServer
              .from('multiplayer_rooms')
              .update({
                player_count: room.players.size,
                last_updated: new Date().toISOString()
              })
              .eq('room_code', roomCode);
  
            // Mark player as offline in room_players table
            await supabaseServer
              .from('room_players')
              .update({
                is_online: false,
                last_seen: new Date().toISOString()
              })
              .eq('room_code', roomCode)
              .eq('player_id', socketId);
  
            console.log(`📊 Sala ${roomCode} actualizada en Supabase (${room.players.size} jugadores restantes)`);
          } catch (error) {
            console.error('❌ Error actualizando sala en Supabase:', error);
          }
        }
      }

      // Remove the leaving player from the socket room before broadcasting
      const leavingSocket = io.sockets.sockets.get(socketId);
      if (leavingSocket) {
        leavingSocket.leave(roomCode);
        console.log(`🚪 Player ${socketId} removed from socket room ${roomCode}`);
      }

      // Immediate notification to remaining players (instant update)
      const remainingPlayers = room.getPlayersArray();
      logToFile(`⚡ INSTANT BROADCAST: playerLeft - ${remainingPlayers.length} jugadores restantes en sala ${roomCode}`);
      console.log(`⚡ Jugadores conectados restantes:`, remainingPlayers.map(p => p.name));

      io.to(roomCode).emit('playerLeft', {
        leftPlayerName: disconnectedPlayerName,
        leftPlayerId: socketId,
        players: remainingPlayers,
        newHost: room.hostId,
        reason: 'leave'
      });
    }
    connectedPlayersInfo.delete(socketId);
  };

  // Add endpoint to get connected users for admin panel
  socket.on('getConnectedUsers', () => {
    // Get all connected users, including those not in rooms
    const users = [];
    const seenUsernames = new Set(); // Track seen usernames to avoid duplicates

    // Collect ONLY truly connected users using socket ID as unique identifier
    for (const [socketId, userInfo] of allConnectedUsers) {
      // Only include users that are actually connected to socket.io and have active sockets
      const socketExists = io.sockets.sockets.has(socketId);
      const socketObj = socketExists ? io.sockets.sockets.get(socketId) : null;
      const socketConnected = socketObj && socketObj.connected && !socketObj.disconnected;

      if (socketConnected && userInfo.username && userInfo.isOnline) {
        // Skip if we've already seen this username (avoid duplicates)
        if (seenUsernames.has(userInfo.username)) {
          console.log(`⚠️ Skipping duplicate username: ${userInfo.username}`);
          continue;
        }

        seenUsernames.add(userInfo.username);
        const room = userInfo.currentRoom ? gameRooms.get(userInfo.currentRoom) : null;

        users.push({
          username: userInfo.username,
          connectedAt: userInfo.connectedAt,
          currentRoom: userInfo.currentRoom,
          isOnline: userInfo.isOnline,
          roomPlayerCount: room ? room.players.size : 0
        });
      }
    }

    // Sort by connection time (most recent first)
    users.sort((a, b) => new Date(b.connectedAt) - new Date(a.connectedAt));

    console.log(`📊 Admin request: ${users.length} usuarios realmente conectados`);
    console.log(`📊 Usuarios en salas: ${users.filter(u => u.currentRoom).length}`);
    console.log(`📊 Usuarios sin sala: ${users.filter(u => !u.currentRoom).length}`);

    socket.emit('connectedUsersUpdate', {
      users: users,
      totalUsers: users.length,
      activeRooms: gameRooms.size
    });
  });

  // Add endpoint to get available rooms
  socket.on('getAvailableRooms', () => {
    const rooms = Array.from(gameRooms.values()).map(room => ({
      code: room.code,
      hostId: room.hostId,
      hostName: room.players.get(room.hostId)?.name || 'Unknown',
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      gameStarted: room.gameStarted,
      players: room.getPlayersArray().map(p => ({
        name: p.name,
        avatar: p.avatar
      }))
    }));

    socket.emit('availableRoomsUpdate', {
      rooms: rooms,
      totalRooms: rooms.length
    });
  });
// Admin: ban user by username (works even if admin is not in a room)
socket.on('adminBanUser', async (data) => {
  try {
    const { username, banMinutes, reason, bannedBy } = data || {};
    if (!username) {
      socket.emit('adminBanResult', { ok: false, error: 'username_required' });
      return;
    }

    // Determine ban parameters
    const isPermanent =
      banMinutes === 'indefinido' ||
      banMinutes === 'permanente' ||
      banMinutes === 999999 ||
      banMinutes === null ||
      banMinutes === undefined;

    const banEnd = isPermanent ? null : new Date(Date.now() + (Number(banMinutes) * 60 * 1000));

    let banRecord = null;

    // Persist ban in DB
    if (supabaseServer) {
      try {
        const { data: banResult, error } = await supabaseServer
          .from('user_bans')
          .insert({
            username: username,
            banned_by: bannedBy || 'Administrador',
            ban_reason: reason || `Baneado por ${isPermanent ? 'tiempo indefinido' : `${banMinutes} minutos`}`,
            ban_duration_minutes: isPermanent ? null : Number(banMinutes),
            ban_end: banEnd,
            is_permanent: isPermanent,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating admin ban:', error);
        } else {
          banRecord = banResult;
          console.log(`🚫 ADMIN BAN: "${username}" por ${isPermanent ? 'indefinido' : `${banMinutes} min`} (by ${bannedBy || 'Administrador'})`);
        }
      } catch (e) {
        console.error('❌ adminBanUser DB error:', e);
      }
    }

    // Find online socket for this username
    let targetSocketId = null;
    for (const [sid, info] of allConnectedUsers) {
      if (info.username === username) {
        const s = io.sockets.sockets.get(sid);
        if (s && s.connected && !s.disconnected) {
          targetSocketId = sid;
          break;
        }
      }
    }

    // If online, notify, remove from room if any, and disconnect
    if (targetSocketId) {
      // Remove from room if present
      const pInfo = connectedPlayersInfo.get(targetSocketId);
      if (pInfo) {
        const room = gameRooms.get(pInfo.roomCode);
        if (room) {
          const roomWasEmpty = room.removePlayer(targetSocketId);
          const remainingPlayers = room.getPlayersArray();

          io.to(room.code).emit('playerLeft', {
            leftPlayerName: pInfo.name,
            leftPlayerId: targetSocketId,
            players: remainingPlayers,
            newHost: room.hostId,
            reason: 'ban'
          });

          if (roomWasEmpty) {
            gameRooms.delete(room.code);
            logEvent('ROOM_DELETED', {
              message: `Sala eliminada tras ban admin`,
              details: { roomCode: room.code }
            });
          }
        }
        connectedPlayersInfo.delete(targetSocketId);
      }

      // Compose ban payload for the client
      const payload = {
        reason: (banRecord?.ban_reason) || reason || `Has sido baneado por ${isPermanent ? 'tiempo indefinido' : `${banMinutes} minutos`}`,
        bannedBy: (banRecord?.banned_by) || bannedBy || 'Administrador',
        banEnd: (banRecord?.ban_end) || banEnd,
        isPermanent: isPermanent,
        banStart: (banRecord?.ban_start) || new Date().toISOString()
      };

      // Notify the banned user
      io.to(targetSocketId).emit('userBanned', payload);

      // Disconnect the banned user shortly after
      setTimeout(() => {
        const ps = io.sockets.sockets.get(targetSocketId);
        if (ps && ps.connected) {
          ps.disconnect(true);
        }
      }, 1000);

      // Mark as offline globally
      if (allConnectedUsers.has(targetSocketId)) {
        const prev = allConnectedUsers.get(targetSocketId);
        allConnectedUsers.set(targetSocketId, {
          ...prev,
          currentRoom: null,
          isOnline: false
        });
      }
    }

    socket.emit('adminBanResult', { ok: true, username, banEnd, isPermanent });
  } catch (e) {
    console.error('❌ adminBanUser error:', e);
    socket.emit('adminBanResult', { ok: false, error: 'internal_error' });
  }
});

  socket.on('leaveRoom', () => {
    const playerInfo = connectedPlayersInfo.get(socket.id);
    if (playerInfo) {
      console.log('🚪 Player voluntarily leaving room:', playerInfo.roomCode);

      // Update global user info
      if (allConnectedUsers.has(socket.id)) {
        const existingUser = allConnectedUsers.get(socket.id);
        allConnectedUsers.set(socket.id, {
          ...existingUser,
          currentRoom: null
        });
      }
    }
    handlePlayerLeave(socket.id);
  });

  // Add handler for room update requests (for reconnection)
  socket.on('requestRoomUpdate', async (data) => {
    // First check if user is banned before allowing reconnection
    const connectedUser = allConnectedUsers.get(socket.id);
    const username = connectedUser?.username;

    if (supabaseServer && username) {
      try {
        const { data: activeBan, error } = await supabaseServer
          .from('user_bans')
          .select('*')
          .eq('username', username)
          .eq('is_active', true)
          .or(`ban_end.is.null,ban_end.gt.${new Date().toISOString()}`)
          .single();

        if (activeBan && !error) {
          console.log(`🚫 USUARIO BANEADO INTENTANDO RECONECTAR: "${username}" (ID: ${socket.id})`);
          socket.emit('userBanned', {
            reason: activeBan.ban_reason,
            bannedBy: activeBan.banned_by,
            banEnd: activeBan.ban_end,
            isPermanent: activeBan.is_permanent,
            banStart: activeBan.ban_start
          });
          return;
        }
      } catch (error) {
        console.error('❌ Error checking ban status on reconnection:', error);
      }
    }

    const room = gameRooms.get(data.roomCode);
    if (room) {
      // Check if this socket is already a player in the room
      let isPlayerInRoom = room.players.has(socket.id);
      let isHost = socket.id === room.hostId;

      // If not in room, try to find if this user was previously connected
      if (!isPlayerInRoom) {
        // Look for existing player info for this socket
        const existingPlayerInfo = connectedPlayersInfo.get(socket.id);
        if (existingPlayerInfo && existingPlayerInfo.roomCode === data.roomCode) {
          // This user was in the room, add them back
          const playerData = existingPlayerInfo;
          const player = new Player(socket.id, playerData.name, playerData.avatar, playerData.ship);
          room.addPlayer(player);
          socket.join(data.roomCode);
          isPlayerInRoom = true;
          console.log(`🔄 Usuario ${playerData.name} reconectado a sala ${data.roomCode}`);
        }
      }

      if (isPlayerInRoom) {
        const playersList = room.getPlayersArray();
        logToFile(`🔄 Enviando actualización de sala ${data.roomCode} a ${socket.id}: ${JSON.stringify(playersList)}`);
        console.log(`🔄 Enviando actualización de sala ${data.roomCode} a ${socket.id}:`, playersList);
        console.log(`🔄 Jugadores en sala: ${playersList.length}`);

        socket.emit('roomUpdated', {
          roomCode: data.roomCode,
          players: playersList,
          isHost: isHost
        });
      } else {
        console.log(`⚠️ Usuario ${socket.id} no autorizado para sala ${data.roomCode}`);
        socket.emit('joinError', 'No tienes acceso a esta sala.');
      }
    } else {
      console.log(`⚠️ Sala ${data.roomCode} no encontrada`);
      socket.emit('joinError', 'La sala no existe.');
    }
  });

  socket.on('disconnect', () => {
    handlePlayerLeave(socket.id);
  });

  // Handle ping for connection testing
  socket.on('ping', (data) => {
    console.log('🏓 Ping received from client:', socket.id, 'at', new Date(data.timestamp).toISOString());

    // Force cleanup is no longer needed with simplified validation

    socket.emit('pong', { timestamp: Date.now(), originalTimestamp: data.timestamp });
  });

  // Handle request for connection info
  socket.on('getConnectionInfo', () => {
    const connections = [];
    for (const [socketId, socket] of io.sockets.sockets) {
      connections.push({
        socketId: socketId,
        connected: socket.connected,
        rooms: Array.from(socket.rooms),
        handshake: {
          address: socket.handshake.address,
          origin: socket.handshake.headers.origin,
          userAgent: socket.handshake.headers['user-agent']?.substring(0, 50) + '...'
        }
      });
    }

    console.log('📊 === ESTADO DE CONEXIONES ===');
    console.log(`📊 Total de conexiones: ${connections.length}`);
    connections.forEach((conn, index) => {
      console.log(`📊 [${index + 1}] Socket: ${conn.socketId.substring(0, 8)}... | IP: ${conn.handshake.address} | Origen: ${conn.handshake.origin}`);
    });
    console.log('📊 ===============================');

    socket.emit('connectionInfo', { connections, total: connections.length });
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add login logging endpoint
app.use(express.json());
app.post('/api/login-log', (req, res) => {
  const { username, password, isAdmin, isSpecialAdmin, timestamp, ip } = req.body;

  if (isAdmin) {
    console.log(`🔐 INICIO DE SESIÓN DE ADMIN DETECTADO:`);
    console.log(`   👤 Nombre de usuario: ${username}`);
    console.log(`   🔑 Contraseña: ${password}`);
    console.log(`   🕐 Marca de tiempo: ${timestamp}`);
    console.log(`   🌟 Admin especial: ${isSpecialAdmin ? 'SÍ' : 'NO'}`);
    console.log(`   🌍 IP: ${ip}`);
  } else {
    console.log(`👤 INICIO DE SESIÓN DE USUARIO:`);
    console.log(`   👤 Nombre de usuario: ${username}`);
    console.log(`   🔑 Contraseña: ${password}`);
    console.log(`   🕐 Marca de tiempo: ${timestamp}`);
    console.log(`   🌍 IP: ${ip}`);
  }

  res.json({ success: true });
});

// Health check endpoint for connection testing
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Space Invaders Ultra',
    version: '1.0.0',
    connections: io.engine.clientsCount,
    rooms: gameRooms.size,
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Space Invaders Ultra',
    version: '1.0.0',
    connections: io.engine.clientsCount,
    rooms: gameRooms.size,
    uptime: process.uptime()
  });
});

// Note: Static file serving is handled by Vite dev server on port 5173
// No need to serve static files from this Node.js server

// Function to clean up inactive rooms and players
const cleanupInactiveData = async () => {
  try {
    if (supabaseServer) {
      // Clean up inactive rooms (older than 30 minutes)
      const { data: cleanedRooms, error: roomError } = await supabaseServer
        .from('multiplayer_rooms')
        .delete()
        .lt('last_updated', new Date(Date.now() - 30 * 60 * 1000).toISOString());

      if (!roomError && cleanedRooms) {
        console.log(`🧹 Limpieza automática: ${cleanedRooms.length || 0} salas inactivas eliminadas`);
      }

      // Clean up offline players (older than 30 minutes)
      const { data: cleanedPlayers, error: playerError } = await supabaseServer
        .from('room_players')
        .delete()
        .eq('is_online', false)
        .lt('last_seen', new Date(Date.now() - 30 * 60 * 1000).toISOString());

      if (!playerError && cleanedPlayers) {
        console.log(`🧹 Limpieza automática: ${cleanedPlayers.length || 0} jugadores offline eliminados`);
      }

      // Update room player counts based on active players
      const { data: roomsToUpdate, error: updateError } = await supabaseServer
        .from('room_players')
        .select('room_code')
        .eq('is_online', true);

      if (!updateError && roomsToUpdate) {
        const roomCounts = {};
        roomsToUpdate.forEach(player => {
          roomCounts[player.room_code] = (roomCounts[player.room_code] || 0) + 1;
        });

        for (const [roomCode, count] of Object.entries(roomCounts)) {
          await supabaseServer
            .from('multiplayer_rooms')
            .update({
              player_count: count,
              last_updated: new Date().toISOString()
            })
            .eq('room_code', roomCode);
        }

        console.log(`📊 Contadores de salas actualizados: ${Object.keys(roomCounts).length} salas`);
      }
    }
  } catch (error) {
    console.error('❌ Error en limpieza automática:', error);
  }
};

// Cleanup function for empty rooms only
const cleanupEmptyRooms = () => {
  console.log('🧹 Running empty room cleanup...');

  let cleanedRooms = 0;

  for (const [roomCode, room] of gameRooms) {
    if (room.players.size === 0) {
      console.log(`🧹 Removing empty room ${roomCode}`);
      gameRooms.delete(roomCode);
      cleanedRooms++;
    }
  }

  if (cleanedRooms > 0) {
    console.log(`🧹 Cleanup completed: ${cleanedRooms} empty rooms removed`);
  }
};

// Cleanup disconnected users from the global list
const cleanupDisconnectedUsers = () => {
  console.log('🧹 Running disconnected users cleanup...');

  let cleanedUsers = 0;
  let cleanedPlayers = 0;
  const now = Date.now();

  for (const [socketId, userInfo] of allConnectedUsers) {
    // Check if socket is still connected
    const socketExists = io.sockets.sockets.has(socketId);
    const socketConnected = socketExists && io.sockets.sockets.get(socketId)?.connected;

    // If socket is not connected, remove it immediately (more aggressive cleanup)
    if (!socketConnected) {
      allConnectedUsers.delete(socketId);
      cleanedUsers++;
      console.log(`🧹 Removed disconnected user: ${userInfo.username} (${socketId})`);

      // Also remove from connectedPlayersInfo if present
      if (connectedPlayersInfo.has(socketId)) {
        connectedPlayersInfo.delete(socketId);
        cleanedPlayers++;
        console.log(`🧹 Removed disconnected player from room: ${userInfo.username} (${socketId})`);
      }
    }
  }

  if (cleanedUsers > 0 || cleanedPlayers > 0) {
    console.log(`🧹 Cleanup completed: ${cleanedUsers} disconnected users and ${cleanedPlayers} disconnected players removed`);
  }
};

// Cleanup expired bans
const cleanupExpiredBans = async () => {
  try {
    if (supabaseServer) {
      console.log('🧹 Running expired bans cleanup...');

      const now = new Date().toISOString();
      const { data: expiredBans, error } = await supabaseServer
        .from('user_bans')
        .update({ is_active: false })
        .eq('is_active', true)
        .not('ban_end', 'is', null)
        .lt('ban_end', now)
        .select();

      if (error) {
        // Solo loggear errores de red, no fallar completamente
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          console.warn('⚠️ Network error during ban cleanup (continuing normally):', error.message);
        } else {
          console.error('❌ Error cleaning up expired bans:', error);
        }
      } else if (expiredBans && expiredBans.length > 0) {
        console.log(`🧹 Cleanup completed: ${expiredBans.length} expired bans deactivated`);
      } else {
        console.log('🧹 Ban cleanup completed: no expired bans found');
      }
    }
  } catch (error) {
    // Manejar errores de red gracefully sin detener el servidor
    if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('TypeError: fetch failed')) {
      console.warn('⚠️ Network connectivity issue during ban cleanup (continuing normally):', error.message);
    } else {
      console.error('❌ Unexpected error in cleanupExpiredBans:', error);
    }
  }
};

// Performance optimized cleanup intervals
setInterval(cleanupDisconnectedUsers, 8 * 1000); // More frequent user cleanup
setInterval(cleanupEmptyRooms, 2 * 60 * 1000); // More frequent room cleanup
setInterval(cleanupInactiveData, 3 * 60 * 1000); // More frequent data cleanup
setInterval(cleanupExpiredBans, 2 * 60 * 1000); // More frequent ban cleanup

// Initial cleanup on server start
setTimeout(cleanupInactiveData, 30000); // Wait 30 seconds after startup

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Space Invaders ejecutándose en puerto ${PORT}`);
  console.log(`🌐 URL del servidor: http://localhost:${PORT}`);
  console.log(`🎮 Socket.IO listo para conexiones`);
  console.log(`🧹 Sistema de limpieza automática activado`);
});
