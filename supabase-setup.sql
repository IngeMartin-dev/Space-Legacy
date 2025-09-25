-- Create users table for Space Invaders game
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL, -- Note: In production, use proper password hashing
  avatar VARCHAR(10) DEFAULT '👨‍🚀',
  coins INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  is_special_admin BOOLEAN DEFAULT FALSE,
  equipped_ship VARCHAR(20) DEFAULT 'ship1',
  equipped_upgrade VARCHAR(20),
  equipped_pet VARCHAR(20),
  unlocked_ships TEXT[] DEFAULT ARRAY['ship1'],
  unlocked_upgrades TEXT[] DEFAULT ARRAY[]::TEXT[],
  unlocked_pets TEXT[] DEFAULT ARRAY[]::TEXT[],
  pet_levels JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  -- Game progress fields
  current_level INTEGER DEFAULT 1,
  high_score INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_enemies_destroyed INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ===========================================
-- MULTIPLAYER PERSISTENCE TABLES
-- ===========================================

-- Create persistent rooms table for room state persistence
DROP TABLE IF EXISTS persistent_rooms CASCADE;
CREATE TABLE persistent_rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) UNIQUE NOT NULL,
  room_data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create persistent notifications table
DROP TABLE IF EXISTS persistent_notifications CASCADE;
CREATE TABLE persistent_notifications (
  id SERIAL PRIMARY KEY,
  notification_type VARCHAR(20) NOT NULL,
  player_name VARCHAR(100),
  message TEXT,
  host_name VARCHAR(100),
  avatar VARCHAR(10),
  is_leaving BOOLEAN DEFAULT FALSE,
  reason VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'low',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create multiplayer rooms table for real-time room management
DROP TABLE IF EXISTS multiplayer_rooms CASCADE;
CREATE TABLE multiplayer_rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  player_count INTEGER DEFAULT 0,
  players JSONB DEFAULT '[]',
  host_player_id VARCHAR(50),
  host_name VARCHAR(100),
  max_players INTEGER DEFAULT 4,
  game_started BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room players table for player management
DROP TABLE IF EXISTS room_players CASCADE;
CREATE TABLE room_players (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  player_avatar VARCHAR(10) DEFAULT '👤',
  player_ship VARCHAR(20) DEFAULT 'ship1',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT TRUE,
  UNIQUE(room_code, player_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_persistent_rooms_code ON persistent_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_persistent_rooms_expires ON persistent_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_persistent_notifications_type ON persistent_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_persistent_notifications_expires ON persistent_notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_persistent_notifications_timestamp ON persistent_notifications(timestamp DESC);

-- Indexes for multiplayer tables
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_code ON multiplayer_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status ON multiplayer_rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room_code ON room_players(room_code);
CREATE INDEX IF NOT EXISTS idx_room_players_player_id ON room_players(player_id);
CREATE INDEX IF NOT EXISTS idx_room_players_online ON room_players(is_online);

-- Enable RLS on new tables
ALTER TABLE persistent_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE persistent_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for persistent_rooms
DROP POLICY IF EXISTS "Anyone can read persistent rooms" ON persistent_rooms;
CREATE POLICY "Anyone can read persistent rooms" ON persistent_rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert persistent rooms" ON persistent_rooms;
CREATE POLICY "Anyone can insert persistent rooms" ON persistent_rooms
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update persistent rooms" ON persistent_rooms;
CREATE POLICY "Anyone can update persistent rooms" ON persistent_rooms
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete persistent rooms" ON persistent_rooms;
CREATE POLICY "Anyone can delete persistent rooms" ON persistent_rooms
  FOR DELETE USING (true);

-- Create RLS policies for persistent_notifications
DROP POLICY IF EXISTS "Anyone can read persistent notifications" ON persistent_notifications;
CREATE POLICY "Anyone can read persistent notifications" ON persistent_notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert persistent notifications" ON persistent_notifications;
CREATE POLICY "Anyone can insert persistent notifications" ON persistent_notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update persistent notifications" ON persistent_notifications;
CREATE POLICY "Anyone can update persistent notifications" ON persistent_notifications
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete persistent notifications" ON persistent_notifications;
CREATE POLICY "Anyone can delete persistent notifications" ON persistent_notifications
  FOR DELETE USING (true);

-- Enable RLS on multiplayer tables
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multiplayer_rooms
DROP POLICY IF EXISTS "Anyone can read multiplayer rooms" ON multiplayer_rooms;
CREATE POLICY "Anyone can read multiplayer rooms" ON multiplayer_rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert multiplayer rooms" ON multiplayer_rooms;
CREATE POLICY "Anyone can insert multiplayer rooms" ON multiplayer_rooms
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update multiplayer rooms" ON multiplayer_rooms;
CREATE POLICY "Anyone can update multiplayer rooms" ON multiplayer_rooms
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete multiplayer rooms" ON multiplayer_rooms;
CREATE POLICY "Anyone can delete multiplayer rooms" ON multiplayer_rooms
  FOR DELETE USING (true);

-- Create RLS policies for room_players
DROP POLICY IF EXISTS "Anyone can read room players" ON room_players;
CREATE POLICY "Anyone can read room players" ON room_players
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert room players" ON room_players;
CREATE POLICY "Anyone can insert room players" ON room_players
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update room players" ON room_players;
CREATE POLICY "Anyone can update room players" ON room_players
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete room players" ON room_players;
CREATE POLICY "Anyone can delete room players" ON room_players
  FOR DELETE USING (true);

-- Create bans table for admin ban system
DROP TABLE IF EXISTS user_bans CASCADE;
CREATE TABLE user_bans (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  banned_by VARCHAR(50) NOT NULL,
  ban_reason TEXT,
  ban_duration_minutes INTEGER, -- NULL for permanent ban
  ban_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ban_end TIMESTAMP WITH TIME ZONE, -- NULL for permanent ban
  is_permanent BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key constraint (optional, since username might not exist in users table)
  CONSTRAINT fk_banned_user FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
  CONSTRAINT fk_banning_admin FOREIGN KEY (banned_by) REFERENCES users(username) ON DELETE SET NULL
);

-- Create indexes for bans table
CREATE INDEX IF NOT EXISTS idx_user_bans_username ON user_bans(username);
CREATE INDEX IF NOT EXISTS idx_user_bans_active ON user_bans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_bans_end ON user_bans(ban_end);

-- Enable RLS on bans table
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bans table
DROP POLICY IF EXISTS "Admins can read all bans" ON user_bans;
CREATE POLICY "Admins can read all bans" ON user_bans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert bans" ON user_bans;
CREATE POLICY "Admins can insert bans" ON user_bans
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update bans" ON user_bans;
CREATE POLICY "Admins can update bans" ON user_bans
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete bans" ON user_bans;
CREATE POLICY "Admins can delete bans" ON user_bans
  FOR DELETE USING (true);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create proper Row Level Security policies
-- Allow all operations for development (you can make this more restrictive in production)

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read all data" ON users;
DROP POLICY IF EXISTS "Users can insert data" ON users;
DROP POLICY IF EXISTS "Users can update data" ON users;
DROP POLICY IF EXISTS "Users can delete data" ON users;

-- Create new policies
DROP POLICY IF EXISTS "Users can read all data" ON users;
CREATE POLICY "Users can read all data" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert data" ON users;
CREATE POLICY "Users can insert data" ON users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update data" ON users;
CREATE POLICY "Users can update data" ON users
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete data" ON users;
CREATE POLICY "Users can delete data" ON users
  FOR DELETE USING (true);

-- Fix existing SECURITY DEFINER view if it exists
DROP VIEW IF EXISTS user_profiles;

-- Create a view for easier data access (without SECURITY DEFINER)
CREATE OR REPLACE VIEW user_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  username,
  avatar,
  coins,
  is_admin,
  is_special_admin,
  equipped_ship,
  equipped_upgrade,
  equipped_pet,
  unlocked_ships,
  unlocked_upgrades,
  unlocked_pets,
  pet_levels,
  settings,
  created_at,
  updated_at
FROM users;

-- Grant access to the view
GRANT SELECT ON user_profiles TO anon, authenticated;

-- ===========================================
-- ROOM MANAGEMENT FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to automatically delete inactive rooms
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete rooms that haven't been updated in the last 30 minutes
  DELETE FROM multiplayer_rooms
  WHERE last_updated < NOW() - INTERVAL '30 minutes'
  AND status = 'waiting';

  -- Mark rooms as inactive if they haven't been updated in 10 minutes
  UPDATE multiplayer_rooms
  SET status = 'inactive'
  WHERE last_updated < NOW() - INTERVAL '10 minutes'
  AND status = 'waiting';

  -- Delete old inactive rooms after 1 hour
  DELETE FROM multiplayer_rooms
  WHERE status = 'inactive'
  AND last_updated < NOW() - INTERVAL '1 hour';
END;
$$;

-- Function to update room last_updated timestamp
CREATE OR REPLACE FUNCTION update_room_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update last_updated on room changes
CREATE TRIGGER update_room_last_updated
  BEFORE UPDATE ON multiplayer_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_room_timestamp();

-- Create a view for active rooms (easier querying)
CREATE OR REPLACE VIEW active_rooms
WITH (security_invoker = on) AS
SELECT
  id,
  room_code,
  host_player_id as host_id,
  host_name,
  status,
  player_count,
  max_players,
  game_started,
  created_at,
  last_updated,
  EXTRACT(EPOCH FROM (NOW() - last_updated)) / 60 as minutes_since_update
FROM multiplayer_rooms
WHERE status IN ('waiting', 'playing')
AND last_updated > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;

-- Grant access to the active rooms view
GRANT SELECT ON active_rooms TO anon, authenticated;

-- Create function to get room statistics
CREATE OR REPLACE FUNCTION get_room_stats()
RETURNS TABLE (
  total_rooms bigint,
  active_rooms bigint,
  waiting_rooms bigint,
  playing_rooms bigint,
  total_players bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_rooms,
    COUNT(*) FILTER (WHERE status IN ('waiting', 'playing')) as active_rooms,
    COUNT(*) FILTER (WHERE status = 'waiting') as waiting_rooms,
    COUNT(*) FILTER (WHERE status = 'playing') as playing_rooms,
    COALESCE(SUM(player_count), 0) as total_players
  FROM multiplayer_rooms
  WHERE last_updated > NOW() - INTERVAL '30 minutes';
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_room_stats() TO anon, authenticated;

-- Create function to clean up old persistent notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM persistent_notifications
  WHERE expires_at < NOW();
END;
$$;

-- Create function to clean up old persistent rooms
CREATE OR REPLACE FUNCTION cleanup_old_persistent_rooms()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM persistent_rooms
  WHERE expires_at < NOW();
END;
$$;

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_last_updated ON multiplayer_rooms(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status_updated ON multiplayer_rooms(status, last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_room_players_last_seen ON room_players(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_room_players_online_last_seen ON room_players(is_online, last_seen DESC);

-- Create a function to update player online status
CREATE OR REPLACE FUNCTION update_player_online_status()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark players as offline if they haven't been seen in 5 minutes
  UPDATE room_players
  SET is_online = false
  WHERE last_seen < NOW() - INTERVAL '5 minutes'
  AND is_online = true;

  -- Delete players who have been offline for more than 30 minutes
  DELETE FROM room_players
  WHERE last_seen < NOW() - INTERVAL '30 minutes'
  AND is_online = false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_player_online_status() TO anon, authenticated;

-- Create a comprehensive room info view
CREATE OR REPLACE VIEW room_details
WITH (security_invoker = on) AS
SELECT
  r.id,
  r.room_code,
  r.host_player_id as host_id,
  r.host_name,
  r.status,
  r.player_count,
  r.max_players,
  r.game_started,
  r.created_at,
  r.last_updated,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'player_id', rp.player_id,
      'player_name', rp.player_name,
      'player_avatar', rp.player_avatar,
      'player_ship', rp.player_ship,
      'joined_at', rp.joined_at,
      'last_seen', rp.last_seen,
      'is_online', rp.is_online
    )
  ) FILTER (WHERE rp.player_id IS NOT NULL) as players,
  EXTRACT(EPOCH FROM (NOW() - r.last_updated)) / 60 as minutes_since_update
FROM multiplayer_rooms r
LEFT JOIN room_players rp ON r.room_code = rp.room_code
WHERE r.status IN ('waiting', 'playing')
AND r.last_updated > NOW() - INTERVAL '30 minutes'
GROUP BY r.id, r.room_code, r.host_player_id, r.host_name, r.status, r.player_count, r.max_players, r.game_started, r.created_at, r.last_updated
ORDER BY r.created_at DESC;

-- Grant access to the room details view
GRANT SELECT ON room_details TO anon, authenticated;
