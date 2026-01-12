-- PostgreSQL Schema converted from MySQL dump
-- Converted from booking_db.sql

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
  room_number VARCHAR(10) NOT NULL UNIQUE,
  capacity VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (converted from MySQL structure)
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Note: This should be password_hash in production
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  fname VARCHAR(100) NOT NULL,
  lname VARCHAR(100) NOT NULL,
  identity_card VARCHAR(13),
  address TEXT,
  organization VARCHAR(200),
  verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'student', 'teacher', 'staff')),
  image VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create room_schedules table (converted from MySQL structure)
CREATE TABLE room_schedules (
  schedule_id SERIAL PRIMARY KEY,
  room_id INTEGER,
  day_of_week VARCHAR(10),
  start_time TIME,
  end_time TIME,
  subject VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_start ON bookings(start);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_room_schedules_room_id ON room_schedules(room_id);

-- Insert sample data for rooms
INSERT INTO rooms (room_id, name, room_number, capacity, description, status, created_at, updated_at) VALUES
(1, 'ห้องเรียนรวม', '6102', '50 คน', 'ห้องเรียนรวมขนาดใหญ่ เหมาะสำหรับการบรรยายและการประชุมใหญ่', 'active', '2025-08-08 15:18:18+00', '2025-08-08 15:18:18+00'),
(2, 'ห้องประชุมคณะ', '6302', '10 คน', 'ห้องประชุมคณะ เหมาะสำหรับการประชุมคณะกรรมการและการสัมมนา', 'active', '2025-08-08 15:18:18+00', '2025-10-19 11:55:19+00'),
(3, 'ห้องสำนักงาน', '6101', '7 คน', 'ห้องสำนักงานขนาดเล็ก เหมาะสำหรับการประชุมกลุ่มย่อยและการทำงานร่วมกัน', 'active', '2025-08-08 15:18:18+00', '2025-09-07 15:37:00+00');

-- Insert sample data for users (passwords are already hashed)
INSERT INTO users (user_id, username, password, email, phone, fname, lname, identity_card, address, organization, verification_status, role, image, created_at, updated_at) VALUES
(6, 'admin01', '$2b$10$9lTV9OCbHzbKHhHCzc1vueD3wh0SqZYpN/RYRSNRyLXktn0uuVaWm', 'jaahaha10@gmail.com', '0971622018', 'Pepat', 'Komson', '1234567891012', '111', 'test', 'approved', 'admin', '/uploads/1759060008616-wimogj.png', '2025-08-08 15:56:00+00', '2025-09-28 11:46:51+00'),
(18, 'aaaaa001', '$2b$10$vRtkV/ojpPzJ4pTIcEPxc.frNQKi2EyKKJzHZohe0855U5Qm/t.iu', 'aaaaa001@gmail.com', '08813241324', 'ppht', 'asfd', '1133124124411', 'adsf', 'asdf', 'approved', 'teacher', '/uploads/1759116667216-l5hjgf.png', '2025-09-26 16:35:11+00', '2025-10-04 09:50:19+00'),
(20, 'test2', '$2b$10$Xjhjt4Y1sBGMLqYaqK7NS.6C878V/W6bbKkhTRmN/pKbVJNPPCwFC', 'test2@gmail.com', '13251253', '1', '1', '1133124125555', '1', '1', 'approved', 'student', NULL, '2025-09-28 23:40:25+00', '2025-10-04 11:23:35+00'),
(21, 'test5', '$2b$10$3xA6SPpmBeIp2rD.BU9ZxOIQHVWCEYKqgT4RLdT89RdMnE2BCezRe', 'test5@gmail.com', '4412312431', 'test', 'test2', NULL, NULL, NULL, 'approved', 'user', NULL, '2025-10-04 08:51:39+00', '2025-10-04 11:23:24+00'),
(23, 'test1', '$2b$10$oRgA0OCnOVc8dFyGfIs.3ea3h7Z2uJx9lm1g.ZeMG8Nb2UKdwf5gm', 'testzx@gmail.com', '01239906235', 'Somdee', 'Testlelotus', '1234567891013', '111', 'ggas', 'approved', 'staff', '/uploads/1759680788275-7e54i6.png', '2025-10-04 09:05:46+00', '2025-10-19 11:52:12+00'),
(25, 'test3', '$2b$10$gRwpX2aVu9Xmgap7tUONrO/EgjLV0K.tr/soY1liAR8yTDS8Gi5MG', 'test3@gmail.com', '0922123311', '123a', 'aabz', '1231231322222', 'suphan', 'sci', 'approved', 'user', NULL, '2025-10-05 18:12:44+00', '2025-10-05 18:23:00+00'),
(26, 'test333', '$2b$10$wqGn26Pn7Jc0vpBAheCaVe8fvYq0CzJIAo5Vq/QYfxvTiDjZMXj.2', 'assa@gfail.com', '1231233112', 'a123z', 'jazzx', '1793311266124', '1941/', 'ssa', 'approved', 'user', NULL, '2025-10-17 19:23:48+00', '2025-10-17 19:33:11+00'),
(27, 'test9', '$2b$10$.MIqDZxMu9md2ZJ43zW7JuSLT3JRSy17SCPg9mEYsOD3kPsu991cC', 'test11@gmail.com', '0912312111', '1123a', 'saz', '1312112313212', 'tas13', '1234', 'approved', 'user', NULL, '2025-10-18 16:42:56+00', '2025-10-19 11:39:22+00');

-- Insert sample bookings data
INSERT INTO bookings (booking_id, title, room_id, user_id, start, "end", status, confirmed_by, cancelled_by, attendees, notes, created_at, updated_at) VALUES
(79, 'test', 3, 25, '2025-10-06 08:00:00+00', '2025-10-06 12:00:00+00', 'confirmed', 23, NULL, '5', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-05 18:23:21+00', '2025-10-05 18:28:18+00'),
(80, '11', 1, 21, '2025-10-06 13:00:00+00', '2025-10-06 17:00:00+00', 'confirmed', 23, NULL, '1', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-05 18:27:33+00', '2025-10-05 18:28:17+00'),
(89, '1', 1, 20, '2025-10-21 08:00:00+00', '2025-10-21 12:00:00+00', 'confirmed', 6, NULL, '1', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-17 19:14:29+00', '2025-10-17 19:16:10+00'),
(90, 'test', 2, 26, '2025-10-18 08:00:00+00', '2025-10-18 12:00:00+00', 'confirmed', 6, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-17 19:35:31+00', '2025-10-17 19:36:01+00'),
(92, 'meeting aug 2', 2, 18, '2025-08-10 13:00:00+00', '2025-08-10 15:00:00+00', 'confirmed', 18, NULL, '3', 'Microphone', '2025-08-10 05:00:00+00', '2025-08-10 05:00:00+00'),
(93, 'meeting aug 3', 3, 20, '2025-08-15 08:00:00+00', '2025-08-15 10:00:00+00', 'confirmed', 20, NULL, '1', 'Whiteboard', '2025-08-15 00:00:00+00', '2025-08-15 00:00:00+00'),
(94, 'meeting aug 4', 1, 21, '2025-08-20 14:00:00+00', '2025-08-20 16:00:00+00', 'confirmed', 21, NULL, '2', 'Notebook', '2025-08-20 06:00:00+00', '2025-08-20 06:00:00+00'),
(95, 'meeting aug 5', 2, 23, '2025-08-25 10:00:00+00', '2025-08-25 12:00:00+00', 'confirmed', 23, NULL, '4', 'TV', '2025-08-25 02:00:00+00', '2025-08-25 02:00:00+00'),
(96, 'meeting sep 1', 1, 6, '2025-09-03 09:00:00+00', '2025-09-03 11:00:00+00', 'confirmed', 6, NULL, '2', 'Projector', '2025-09-03 01:00:00+00', '2025-09-03 01:00:00+00'),
(97, 'meeting sep 2', 2, 18, '2025-09-08 13:00:00+00', '2025-09-08 15:00:00+00', 'confirmed', 18, NULL, '3', 'Microphone', '2025-09-08 05:00:00+00', '2025-09-08 05:00:00+00'),
(98, 'meeting sep 3', 3, 20, '2025-09-13 08:00:00+00', '2025-09-13 10:00:00+00', 'confirmed', 20, NULL, '1', 'Whiteboard', '2025-09-13 00:00:00+00', '2025-09-13 00:00:00+00'),
(99, 'meeting sep 4', 1, 21, '2025-09-18 14:00:00+00', '2025-09-18 16:00:00+00', 'confirmed', 21, NULL, '2', 'Notebook', '2025-09-18 06:00:00+00', '2025-09-18 06:00:00+00'),
(100, 'meeting sep 5', 2, 23, '2025-09-23 10:00:00+00', '2025-09-23 12:00:00+00', 'confirmed', 23, NULL, '4', 'TV', '2025-09-23 02:00:00+00', '2025-09-23 02:00:00+00'),
(101, '11', 3, 20, '2025-10-23 08:00:00+00', '2025-10-23 12:00:00+00', 'confirmed', 6, NULL, '4', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 16:30:54+00', '2025-10-18 16:31:08+00'),
(102, 'test78', 2, 20, '2025-10-24 08:00:00+00', '2025-10-24 12:00:00+00', 'confirmed', 6, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 16:31:40+00', '2025-10-18 16:39:56+00'),
(103, '11', 2, 20, '2025-10-22 08:00:00+00', '2025-10-22 12:00:00+00', 'confirmed', 6, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 16:33:31+00', '2025-10-18 16:39:54+00'),
(104, 'aaa', 2, 20, '2025-10-26 08:00:00+00', '2025-10-26 12:00:00+00', 'confirmed', 23, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 16:40:40+00', '2025-10-18 20:38:13+00'),
(105, 'test', 3, 27, '2025-10-25 08:00:00+00', '2025-10-25 17:00:00+00', 'confirmed', 23, NULL, '1', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 20:39:35+00', '2025-10-18 20:39:58+00'),
(106, '123', 1, 27, '2025-10-25 08:00:00+00', '2025-10-25 12:00:00+00', 'confirmed', 23, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 20:40:33+00', '2025-10-18 20:40:51+00'),
(107, 'test44', 3, 25, '2025-10-26 08:00:00+00', '2025-10-26 12:00:00+00', 'confirmed', 23, NULL, '4', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 21:12:59+00', '2025-10-18 21:13:15+00'),
(108, '113zx', 1, 25, '2025-10-31 13:00:00+00', '2025-10-31 17:00:00+00', 'confirmed', 23, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 21:35:14+00', '2025-10-19 11:39:32+00'),
(109, 'DemoBz1', 1, 20, '2025-10-26 08:00:00+00', '2025-10-26 17:00:00+00', 'confirmed', 23, NULL, '11', 'ไมโครโฟน x4, ลำโพง x3, โปรเจคเตอร์ x1, จอภาพ x1', '2025-10-19 11:56:42+00', '2025-10-19 11:57:03+00');

-- Insert room schedules data
INSERT INTO room_schedules (schedule_id, room_id, day_of_week, start_time, end_time, subject) VALUES
(1, 1, 'จันทร์', '08:00:00', '12:00:00', 'Multimedia Technology Project 1'),
(2, 1, 'จันทร์', '15:00:00', '17:00:00', 'Script Writing and Storytelling'),
(3, 1, 'อังคาร', '13:00:00', '14:00:00', 'Preparation for Professional Experience'),
(4, 1, 'อังคาร', '16:00:00', '17:00:00', 'Script Writing and Storytelling'),
(5, 1, 'พุธ', '08:00:00', '12:00:00', 'Multimedia Technology Project 2'),
(6, 1, 'พุธ', '13:00:00', '15:00:00', 'Multimedia Technology Project 2'),
(7, 1, 'พฤหัสบดี', '08:00:00', '11:00:00', 'Linear Algebra Computer Graphics'),
(8, 1, 'พฤหัสบดี', '13:00:00', '16:00:00', 'Data Science in Sufficient Life'),
(9, 1, 'ศุกร์', '08:00:00', '12:00:00', 'Viral Marketing'),
(10, 2, 'จันทร์', '13:00:00', '16:00:00', 'Information Technology and Digital Economy Project 1'),
(11, 2, 'พุธ', '12:00:00', '14:00:00', 'Information Technology and Digital Economy Project 2'),
(12, 2, 'ศุกร์', '13:00:00', '17:00:00', 'Information Technology and Digital Economy Project 2');

-- Add foreign key constraints
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE room_schedules ADD CONSTRAINT fk_room_schedules_room FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE;