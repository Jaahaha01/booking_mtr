-- Turso SQLite Schema for Booking System

-- Users table
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  department VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT 1,
  email_verified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
  room_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL,
  location VARCHAR(200),
  description TEXT,
  equipment TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
  booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(100) NOT NULL,
  room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  start DATETIME NOT NULL,
  end DATETIME NOT NULL,
  status TEXT CHECK(status IN ('confirmed', 'pending', 'cancelled')) DEFAULT 'confirmed',
  confirmed_by INTEGER,
  cancelled_by INTEGER,
  attendees TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Room schedules table
CREATE TABLE room_schedules (
  schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_start ON bookings(start);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_room_schedules_room_id ON room_schedules(room_id);

-- Insert sample data
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@example.com', '$2b$10$example.hash.here', 'Administrator', 'admin'),
('user1', 'user1@example.com', '$2b$10$example.hash.here', 'User One', 'user');

INSERT INTO rooms (name, capacity, location, description) VALUES
('Meeting Room A', 10, 'Floor 1', 'Small meeting room with projector'),
('Meeting Room B', 20, 'Floor 2', 'Large meeting room with video conferencing'),
('Conference Room', 50, 'Floor 3', 'Main conference room for company events');