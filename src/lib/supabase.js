import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables not found!');
  console.error('❌ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Test connection
supabase.from('users').select('count').limit(1).then(
  (result) => console.log('✅ Supabase conectado correctamente'),
  (error) => console.error('❌ Error de conexión con Supabase:', error)
)

// Database helper functions
export const userService = {
  // Create or update user
  async upsertUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        username: userData.username,
        email: userData.email,
        password: userData.password, // Note: In production, hash passwords
        avatar: userData.avatar,
        coins: userData.coins || 0,
        is_admin: userData.isAdmin || false,
        is_special_admin: userData.isSpecialAdmin || false,
        equipped_ship: userData.equippedShip || 'ship1',
        equipped_upgrade: userData.equippedUpgrade || null,
        equipped_pet: userData.equippedPet || null,
        unlocked_ships: userData.unlockedShips || ['ship1'],
        unlocked_upgrades: userData.unlockedUpgrades || [],
        unlocked_pets: userData.unlockedPets || [],
        pet_levels: userData.petLevels || {},
        settings: userData.settings || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get user by username and password
  async getUser(username, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  },

  // Get user by email and password
  async getUserByEmail(email, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  },

  // Check if email exists
  async emailExists(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  },

  // Check if username exists
  async usernameExists(username) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  },

  // Update user data
  async updateUser(username, updates) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('username', username)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Reset all users' progress (admin function)
  async resetAllUsersProgress() {
    console.log('🔄 Iniciando reset completo de todos los usuarios...');

    // Helper function to create update object with or without current_level
    const createUpdateObject = (includeCurrentLevel = true) => {
      const baseUpdate = {
        coins: 0,
        high_score: 0,
        total_games_played: 0,
        total_enemies_destroyed: 0,
        total_coins_earned: 0,
        pet_levels: {},
        unlocked_ships: ['ship1'],
        unlocked_upgrades: [],
        unlocked_pets: [],
        last_played: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (includeCurrentLevel) {
        baseUpdate.current_level = 1;
      }

      return baseUpdate;
    };

    // First, reset all normal users to zero
    let normalUsers, normalError;
    try {
      const result = await supabase
        .from('users')
        .update(createUpdateObject(true))
        .eq('is_admin', false)
        .neq('is_special_admin', true)
        .select();

      normalUsers = result.data;
      normalError = result.error;
    } catch (error) {
      normalError = error;
    }

    // If current_level column doesn't exist, try without it
    if (normalError && normalError.message && normalError.message.includes('current_level')) {
      console.warn('⚠️ current_level column not found, resetting without it');
      const result = await supabase
        .from('users')
        .update(createUpdateObject(false))
        .eq('is_admin', false)
        .neq('is_special_admin', true)
        .select();

      normalUsers = result.data;
      normalError = result.error;
    }

    if (normalError) {
      console.error('❌ Error resetting normal users:', normalError);
      throw normalError;
    }

    console.log(`✅ ${normalUsers?.length || 0} usuarios normales reseteados a cero`);

    // Reset special admins to zero as well (but keep their admin status)
    let specialAdmins, specialError;
    try {
      const result = await supabase
        .from('users')
        .update(createUpdateObject(true))
        .eq('is_special_admin', true)
        .select();

      specialAdmins = result.data;
      specialError = result.error;
    } catch (error) {
      specialError = error;
    }

    // If current_level column doesn't exist, try without it
    if (specialError && specialError.message && specialError.message.includes('current_level')) {
      console.warn('⚠️ current_level column not found, resetting special admins without it');
      const result = await supabase
        .from('users')
        .update(createUpdateObject(false))
        .eq('is_special_admin', true)
        .select();

      specialAdmins = result.data;
      specialError = result.error;
    }

    if (specialError) {
      console.error('❌ Error resetting special admins:', specialError);
      throw specialError;
    }

    console.log(`✅ ${specialAdmins?.length || 0} admins especiales reseteados a cero`);

    // Set infinite coins for regular admin users
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .update({
        coins: 999999999, // Infinite coins for admins
        updated_at: new Date().toISOString()
      })
      .eq('is_admin', true)
      .eq('is_special_admin', false)

    if (adminError) {
      console.error('❌ Error setting infinite coins for admins:', adminError);
      throw adminError;
    }

    console.log(`✅ ${adminData?.length || 0} admins regulares configurados con monedas infinitas`);

    // Ensure all users maintain their individual progression persistence
    // This means when they log back in, their progress should be preserved
    // The reset only affects the database values, but the system should
    // handle persistence properly

    const totalResets = (normalUsers?.length || 0) + (specialAdmins?.length || 0) + (adminData?.length || 0);
    console.log(`🎯 Reset completo finalizado. Total de usuarios afectados: ${totalResets}`);

    return {
      normalUsers: normalUsers || [],
      specialAdmins: specialAdmins || [],
      adminUsers: adminData || [],
      totalResets: totalResets
    }
  },

  // Save game progress
  async saveGameProgress(username, gameProgress) {
    try {
      // First try to update with current_level
      const { data, error } = await supabase
        .from('users')
        .update({
          current_level: gameProgress.currentLevel || 1,
          high_score: gameProgress.highScore || 0,
          total_games_played: gameProgress.totalGamesPlayed || 0,
          total_enemies_destroyed: gameProgress.totalEnemiesDestroyed || 0,
          total_coins_earned: gameProgress.totalCoinsEarned || 0,
          last_played: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('username', username)
        .select()
        .single()

      if (error) {
        // If current_level column doesn't exist, try without it
        if (error.message && error.message.includes('current_level')) {
          console.warn('⚠️ current_level column not found, saving without it');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('users')
            .update({
              high_score: gameProgress.highScore || 0,
              total_games_played: gameProgress.totalGamesPlayed || 0,
              total_enemies_destroyed: gameProgress.totalEnemiesDestroyed || 0,
              total_coins_earned: gameProgress.totalCoinsEarned || 0,
              last_played: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('username', username)
            .select()
            .single()

          if (fallbackError) throw fallbackError
          return fallbackData
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('❌ Error saving game progress:', error)
      throw error
    }
  },

  // Load game progress
  async loadGameProgress(username) {
    try {
      // First try to select with current_level
      const { data, error } = await supabase
        .from('users')
        .select('current_level, high_score, total_games_played, total_enemies_destroyed, total_coins_earned, last_played')
        .eq('username', username)
        .single()

      if (error && error.code !== 'PGRST116') {
        // If current_level column doesn't exist, try without it
        if (error.message && error.message.includes('current_level')) {
          console.warn('⚠️ current_level column not found, trying fallback query');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('users')
            .select('high_score, total_games_played, total_enemies_destroyed, total_coins_earned, last_played')
            .eq('username', username)
            .single()

          if (fallbackError && fallbackError.code !== 'PGRST116') throw fallbackError

          // Return fallback data with default current_level
          return fallbackData ? {
            ...fallbackData,
            current_level: 1 // Default level
          } : null
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('❌ Error loading game progress:', error)
      throw error
    }
  }
}

// Real-time multiplayer service using Supabase
export const realtimeMultiplayerService = {
  // Subscribe to room updates
  subscribeToRoom(roomCode, callback) {
    const channel = supabase.channel(`room-${roomCode}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'multiplayer_rooms',
        filter: `room_code=eq.${roomCode}`
      }, (payload) => {
        console.log('🔔 Real-time room update:', payload);
        callback(payload);
      })
      .subscribe();

    return channel;
  },

  // Subscribe to player updates
  subscribeToPlayers(roomCode, callback) {
    const channel = supabase.channel(`players-${roomCode}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_code=eq.${roomCode}`
      }, (payload) => {
        console.log('🔔 Real-time player update:', payload);
        callback(payload);
      })
      .subscribe();

    return channel;
  },

  // Update room status
  async updateRoomStatus(roomCode, status, players = []) {
    try {
      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .upsert({
          room_code: roomCode,
          status: status,
          player_count: players.length,
          players: players,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'room_code'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  },

  // Add player to room
  async addPlayerToRoom(roomCode, playerData) {
    try {
      const { data, error } = await supabase
        .from('room_players')
        .upsert({
          room_code: roomCode,
          player_id: playerData.id,
          player_name: playerData.name,
          player_avatar: playerData.avatar,
          player_ship: playerData.ship,
          joined_at: new Date().toISOString(),
          is_online: true
        }, {
          onConflict: 'room_code,player_id'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding player to room:', error);
      throw error;
    }
  },

  // Remove player from room
  async removePlayerFromRoom(roomCode, playerId) {
    try {
      const { error } = await supabase
        .from('room_players')
        .delete()
        .eq('room_code', roomCode)
        .eq('player_id', playerId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing player from room:', error);
      throw error;
    }
  },

  // Get room players
  async getRoomPlayers(roomCode) {
    try {
      const { data, error } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_code', roomCode)
        .eq('is_online', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting room players:', error);
      throw error;
    }
  },

  // 💾 SISTEMA DE PERSISTENCIA PARA SALAS Y NOTIFICACIONES
  // Save persistent room state to database
  async savePersistentRoomState(roomCode, roomData) {
    try {
      const { data, error } = await supabase
        .from('persistent_rooms')
        .upsert({
          room_code: roomCode,
          room_data: roomData,
          last_updated: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }, {
          onConflict: 'room_code'
        });

      if (error) throw error;
      console.log('💾 Room state saved to database:', roomCode);
      return data;
    } catch (error) {
      console.error('Error saving persistent room state:', error);
      throw error;
    }
  },

  // Load persistent room state from database
  async loadPersistentRoomState(roomCode) {
    try {
      const { data, error } = await supabase
        .from('persistent_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error loading persistent room state:', error);
      return null;
    }
  },

  // Save notification to database
  async savePersistentNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('persistent_notifications')
        .insert({
          notification_type: notificationData.type,
          player_name: notificationData.playerName,
          message: notificationData.message,
          host_name: notificationData.hostName,
          avatar: notificationData.avatar,
          is_leaving: notificationData.isLeaving,
          reason: notificationData.reason,
          severity: notificationData.severity || 'low',
          timestamp: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (error) throw error;
      console.log('💾 Notification saved to database:', notificationData.type);
      return data;
    } catch (error) {
      console.error('Error saving persistent notification:', error);
      throw error;
    }
  },

  // Load persistent notifications from database
  async loadPersistentNotifications(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('persistent_notifications')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading persistent notifications:', error);
      return [];
    }
  },

  // Delete expired persistent data
  async cleanupExpiredData() {
    try {
      const now = new Date().toISOString();

      // Clean up expired rooms
      const { error: roomError } = await supabase
        .from('persistent_rooms')
        .delete()
        .lt('expires_at', now);

      if (roomError) console.warn('Error cleaning up expired rooms:', roomError);

      // Clean up expired notifications
      const { error: notifError } = await supabase
        .from('persistent_notifications')
        .delete()
        .lt('expires_at', now);

      if (notifError) console.warn('Error cleaning up expired notifications:', notifError);

      console.log('🧹 Cleaned up expired persistent data');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  },

  // Update player online status
  async updatePlayerOnlineStatus(roomCode, playerId, isOnline) {
    try {
      const { data, error } = await supabase
        .from('room_players')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('room_code', roomCode)
        .eq('player_id', playerId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating player online status:', error);
      throw error;
    }
  }
};

export default supabase