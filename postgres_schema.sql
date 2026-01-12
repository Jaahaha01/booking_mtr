-- PostgreSQL Schema for Vercel Postgres
-- Converted from MySQL schema

-- Create database (optional, Vercel handles this)
-- CREATE DATABASE booking_db;

-- Use the database
-- \c booking_db;

-- Create bookings table
CREATE TABLE bookings (
  booking_id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  start TIMESTAMPTZ NOT NULL,
  "end" TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  confirmed_by INTEGER,
  cancelled_by INTEGER,
  attendees TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create rooms table
CREATE TABLE rooms (
  room_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  room_number VARCHAR(10) NOT NULL,
  capacity VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create room_schedules table
CREATE TABLE room_schedules (
  schedule_id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_start ON bookings(start);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_room_schedules_room_id ON room_schedules(room_id);

-- Insert sample data for rooms
INSERT INTO rooms (name, room_number, capacity, description, status) VALUES
('ห้องเรียนรวม', '6102', '50 คน', 'ห้องเรียนรวมขนาดใหญ่ เหมาะสำหรับการบรรยายและการประชุมใหญ่', 'active'),
('ห้องประชุมคณะ', '6302', '10 คน', 'ห้องประชุมคณะ เหมาะสำหรับการประชุมคณะกรรมการและการสัมมนา', 'active'),
('ห้องสำนักงาน', '6101', '7 คน', 'ห้องสำนักงานขนาดเล็ก เหมาะสำหรับการประชุมกลุ่มย่อยและการทำงานร่วมกัน', 'active');

-- Insert sample data for users (passwords are hashed)
-- Note: You should hash passwords properly in production
INSERT INTO users (username, email, password_hash, full_name, role, status) VALUES
('admin', 'admin@example.com', '$2b$10$example.hash.here', 'Administrator', 'admin', 'active'),
('user1', 'user1@example.com', '$2b$10$example.hash.here', 'User One', 'user', 'active');

-- Insert sample room schedules (Monday to Friday, 8:00-18:00)
INSERT INTO room_schedules (room_id, day_of_week, start_time, end_time, is_available) VALUES
(1, 1, '08:00:00', '18:00:00', true),
(1, 2, '08:00:00', '18:00:00', true),
(1, 3, '08:00:00', '18:00:00', true),
(1, 4, '08:00:00', '18:00:00', true),
(1, 5, '08:00:00', '18:00:00', true),
(2, 1, '08:00:00', '18:00:00', true),
(2, 2, '08:00:00', '18:00:00', true),
(2, 3, '08:00:00', '18:00:00', true),
(2, 4, '08:00:00', '18:00:00', true),
(2, 5, '08:00:00', '18:00:00', true),
(3, 1, '08:00:00', '18:00:00', true),
(3, 2, '08:00:00', '18:00:00', true),
(3, 3, '08:00:00', '18:00:00', true),
(3, 4, '08:00:00', '18:00:00', true),
(3, 5, '08:00:00', '18:00:00', true);