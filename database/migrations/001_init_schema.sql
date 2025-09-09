-- Pingnom Database Schema Migration v1.0
-- Create Date: 2025-09-09
-- Description: Initial database schema for Pingnom social dining app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    location_latitude DECIMAL(10,8),
    location_longitude DECIMAL(11,8),
    location_address TEXT,
    dietary_restrictions TEXT[],
    preferred_cuisine_types TEXT[],
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_display_name ON users(display_name);
CREATE INDEX idx_users_location ON users(location_latitude, location_longitude);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Friendships table
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- Create indexes for friendships table
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(100),
    location_latitude DECIMAL(10,8) NOT NULL,
    location_longitude DECIMAL(11,8) NOT NULL,
    location_address TEXT NOT NULL,
    phone VARCHAR(20),
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    price_range VARCHAR(10) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    opening_hours JSONB,
    features TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for restaurants table
CREATE INDEX idx_restaurants_location ON restaurants(location_latitude, location_longitude);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_restaurants_rating ON restaurants(rating);
CREATE INDEX idx_restaurants_name ON restaurants(name);

-- Pings table
CREATE TABLE pings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    preferred_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location_latitude DECIMAL(10,8),
    location_longitude DECIMAL(11,8),
    location_address TEXT,
    max_participants INTEGER,
    cuisine_preferences TEXT[],
    price_range VARCHAR(10) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for pings table
CREATE INDEX idx_pings_creator ON pings(creator_id);
CREATE INDEX idx_pings_location ON pings(location_latitude, location_longitude);
CREATE INDEX idx_pings_preferred_time ON pings(preferred_time);
CREATE INDEX idx_pings_status ON pings(status);

-- Ping responses table
CREATE TABLE ping_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ping_id UUID NOT NULL REFERENCES pings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('interested', 'maybe', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ping_id, user_id)
);

-- Create indexes for ping responses table
CREATE INDEX idx_ping_responses_ping ON ping_responses(ping_id);
CREATE INDEX idx_ping_responses_user ON ping_responses(user_id);
CREATE INDEX idx_ping_responses_status ON ping_responses(status);

-- Group dining plans table
CREATE TABLE group_dining_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'voting', 'finalized', 'completed', 'cancelled')),
    final_restaurant_id UUID REFERENCES restaurants(id),
    final_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for group dining plans table
CREATE INDEX idx_group_dining_plans_creator ON group_dining_plans(creator_id);
CREATE INDEX idx_group_dining_plans_status ON group_dining_plans(status);
CREATE INDEX idx_group_dining_plans_created_at ON group_dining_plans(created_at);

-- Group dining participants table
CREATE TABLE group_dining_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES group_dining_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, user_id)
);

-- Create indexes for participants table
CREATE INDEX idx_group_dining_participants_plan ON group_dining_participants(plan_id);
CREATE INDEX idx_group_dining_participants_user ON group_dining_participants(user_id);

-- Group dining time slots table
CREATE TABLE group_dining_time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES group_dining_plans(id) ON DELETE CASCADE,
    proposed_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for time slots table
CREATE INDEX idx_group_dining_time_slots_plan ON group_dining_time_slots(plan_id);
CREATE INDEX idx_group_dining_time_slots_time ON group_dining_time_slots(proposed_time);

-- Group dining restaurant options table
CREATE TABLE group_dining_restaurant_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES group_dining_plans(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, restaurant_id)
);

-- Create indexes for restaurant options table
CREATE INDEX idx_group_dining_restaurant_options_plan ON group_dining_restaurant_options(plan_id);
CREATE INDEX idx_group_dining_restaurant_options_restaurant ON group_dining_restaurant_options(restaurant_id);

-- Group dining votes table
CREATE TABLE group_dining_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES group_dining_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_option_id UUID REFERENCES group_dining_restaurant_options(id) ON DELETE CASCADE,
    time_slot_id UUID REFERENCES group_dining_time_slots(id) ON DELETE CASCADE,
    restaurant_preference INTEGER CHECK (restaurant_preference >= 1 AND restaurant_preference <= 5),
    time_preference INTEGER CHECK (time_preference >= 1 AND time_preference <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, user_id)
);

-- Create indexes for votes table
CREATE INDEX idx_group_dining_votes_plan ON group_dining_votes(plan_id);
CREATE INDEX idx_group_dining_votes_user ON group_dining_votes(user_id);
CREATE INDEX idx_group_dining_votes_restaurant ON group_dining_votes(restaurant_option_id);
CREATE INDEX idx_group_dining_votes_time ON group_dining_votes(time_slot_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pings_updated_at BEFORE UPDATE ON pings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ping_responses_updated_at BEFORE UPDATE ON ping_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_dining_plans_updated_at BEFORE UPDATE ON group_dining_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_dining_votes_updated_at BEFORE UPDATE ON group_dining_votes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert test data for development (can be removed in production)
-- Test restaurants in Taipei area
INSERT INTO restaurants (name, cuisine_type, location_latitude, location_longitude, location_address, phone, rating, total_reviews, price_range, features) VALUES
('鼎泰豐', 'Chinese', 25.0330, 121.5654, '台北市信義區松壽路11號', '02-8101-7799', 4.5, 2500, '$$$', ARRAY['xiaolongbao', 'taiwanese', 'famous']),
('添好運', 'Hong Kong', 25.0478, 121.5174, '台北市中山區南京東路三段', '02-2716-0968', 4.2, 1800, '$$', ARRAY['dimsum', 'hongkong', 'affordable']),
('欣葉餐廳', 'Taiwanese', 25.0418, 121.5223, '台北市中山區雙城街', '02-2596-3255', 4.3, 2200, '$$$', ARRAY['taiwanese', 'traditional', 'family']),
('Mume', 'European', 25.0397, 121.5298, '台北市大安區四維路', '02-8786-2219', 4.7, 850, '$$$$', ARRAY['european', 'fusion', 'fine-dining']),
('RAW', 'French', 25.0329, 121.5436, '台北市信義區忠孝東路五段', '02-8786-2236', 4.8, 650, '$$$$', ARRAY['french', 'innovative', 'michelin']),
('寧夏夜市大腸包小腸', 'Street Food', 25.0572, 121.5156, '台北市大同區寧夏路', '0988-123-456', 4.1, 3200, '$', ARRAY['street-food', 'taiwanese', 'night-market']),
('君悅酒店彩日式料理', 'Japanese', 25.0404, 121.5677, '台北市信義區松壽路2號', '02-2720-1234', 4.6, 950, '$$$$', ARRAY['japanese', 'hotel', 'luxury']),
('青葉餐廳', 'Taiwanese', 25.0545, 121.5173, '台北市大同區中山北路一段', '02-2331-0123', 4.0, 1500, '$$', ARRAY['taiwanese', 'traditional', 'old-style']);

COMMIT;