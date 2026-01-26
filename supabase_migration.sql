-- Halloumi Map - Database Migration Script
-- Run this in Supabase SQL Editor

-- 1. Add tier and stored_rent columns to user_buildings
ALTER TABLE user_buildings ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'TENT';
ALTER TABLE user_buildings ADD COLUMN IF NOT EXISTS stored_rent INTEGER DEFAULT 0;

-- 2. Create world_news table for global events ticker
CREATE TABLE IF NOT EXISTS world_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE world_news ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read news
CREATE POLICY "Anyone can read world_news" ON world_news 
    FOR SELECT USING (true);

-- Policy: Only authenticated users can insert (via RPC)
CREATE POLICY "Service role can insert world_news" ON world_news 
    FOR INSERT WITH CHECK (true);

-- 3. Add energy column to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS energy INTEGER DEFAULT 100;

-- 4. Update monuments to have 10,000 HP (if they exist)
UPDATE monuments SET max_health = 10000, health = 10000 
WHERE max_health != 10000;

-- 5. Insert Cyprus Monuments (if not exist)
INSERT INTO monuments (name, latitude, longitude, health, max_health, emoji) VALUES
    -- North Cyprus
    ('Kyrenia Castle', 35.3414, 33.3183, 10000, 10000, '🏰'),
    ('Büyük Han', 35.1764, 33.3639, 10000, 10000, '🏛️'),
    ('Saint Hilarion', 35.3119, 33.2811, 10000, 10000, '⛰️'),
    ('Salamis Ruins', 35.1847, 33.9000, 10000, 10000, '🏛️'),
    ('Bellapais Abbey', 35.3069, 33.3550, 10000, 10000, '⛪'),
    -- South Cyprus
    ('Kourion Theater', 34.6647, 32.8892, 10000, 10000, '🎭'),
    ('Tombs of the Kings', 34.7697, 32.4056, 10000, 10000, '⚱️'),
    ('Saint Lazarus Church', 34.9178, 33.6369, 10000, 10000, '⛪'),
    ('Limassol Castle', 34.6722, 33.0425, 10000, 10000, '🏰'),
    ('Petra tou Romiou', 34.6639, 32.6283, 10000, 10000, '🪨')
ON CONFLICT (name) DO NOTHING;

-- 6. Function to post world news on monument capture
CREATE OR REPLACE FUNCTION post_monument_victory_news()
RETURNS TRIGGER AS $$
BEGIN
    -- When a monument is reset (health goes back to max_health), post news
    IF NEW.health = NEW.max_health AND OLD.health < 100 THEN
        INSERT INTO world_news (message) 
        VALUES (
            '🏆 A player has captured ' || NEW.name || '!'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS monument_capture_trigger ON monuments;
CREATE TRIGGER monument_capture_trigger
    AFTER UPDATE ON monuments
    FOR EACH ROW
    EXECUTE FUNCTION post_monument_victory_news();

-- 7. Enable realtime for world_news
ALTER PUBLICATION supabase_realtime ADD TABLE world_news;

COMMIT;
