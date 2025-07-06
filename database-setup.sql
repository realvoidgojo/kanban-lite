-- =====================================================
-- TEAM KANBAN BOARD - SUPABASE DATABASE SETUP
-- =====================================================
-- 
-- This SQL file sets up the complete database schema for the Team Kanban Board application.
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
--
-- If you have existing data and want a fresh start, uncomment the lines below:
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS users CASCADE; 
-- DROP TABLE IF EXISTS teams CASCADE;

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Teams table: Main authentication entity
-- Each team has a unique name and shared password
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table: Team members (no individual authentication)
-- Each user belongs to a team and has their own Kanban board
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique names within each team
    UNIQUE(team_id, name)
);

-- Tasks table: Individual tasks assigned to users
-- Each task belongs to a user and has a status (Kanban column)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure status is one of the four Kanban columns
    CONSTRAINT valid_status CHECK (status IN ('new', 'current', 'in_progress', 'completed'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Teams indexes
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_created_at ON teams(created_at);

-- Users indexes
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_team_name ON users(team_id, name);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Tasks indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_team_status ON tasks(team_id, status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);

-- Text search indexes for global search functionality
CREATE INDEX idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_search ON tasks USING gin(to_tsvector('english', description));

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at when tasks are modified
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment the lines below if you want to create sample data for testing

/*
-- Sample team (password is 'password123' hashed with SHA-256)
INSERT INTO teams (name, password_hash) VALUES 
('Demo Team', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');

-- Sample users for the demo team
-- Note: Replace the team_id with the actual UUID generated above
INSERT INTO users (name, team_id) VALUES 
('Alice Johnson', (SELECT id FROM teams WHERE name = 'Demo Team')),
('Bob Smith', (SELECT id FROM teams WHERE name = 'Demo Team')),
('Carol Davis', (SELECT id FROM teams WHERE name = 'Demo Team'));

-- Sample tasks
INSERT INTO tasks (title, description, status, user_id, team_id) VALUES 
('Setup project repository', 'Create GitHub repo and initial structure', 'completed', 
 (SELECT id FROM users WHERE name = 'Alice Johnson'), 
 (SELECT id FROM teams WHERE name = 'Demo Team')),
 
('Design login page', 'Create wireframes and mockups for authentication', 'in_progress',
 (SELECT id FROM users WHERE name = 'Bob Smith'), 
 (SELECT id FROM teams WHERE name = 'Demo Team')),
 
('Implement user dashboard', 'Build the main dashboard interface', 'new',
 (SELECT id FROM users WHERE name = 'Carol Davis'), 
 (SELECT id FROM teams WHERE name = 'Demo Team'));
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these queries after setup to verify everything is working:

-- Check tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check indexes were created  
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Count records (should be 0 for fresh install, or sample data if uncommented above)
-- SELECT 'teams' as table_name, COUNT(*) as count FROM teams
-- UNION ALL
-- SELECT 'users' as table_name, COUNT(*) as count FROM users  
-- UNION ALL
-- SELECT 'tasks' as table_name, COUNT(*) as count FROM tasks;

-- =====================================================
-- SECURITY NOTES
-- =====================================================

-- This setup uses application-level security instead of Row Level Security (RLS)
-- The application manages access control through the team authentication system
-- All database operations are performed through the application's service layer
-- Team passwords are hashed using SHA-256 before storage

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Your database is now ready for the Team Kanban Board application!
-- 
-- Next steps:
-- 1. Update your .env file with Supabase credentials
-- 2. Start the application: npm run dev
-- 3. Register a new team to test the setup
--
-- For support, check the README.md and SETUP.md files in your project. 