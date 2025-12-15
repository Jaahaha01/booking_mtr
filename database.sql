-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 26, 2025 at 05:21 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `booking_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
  `color` varchar(7) DEFAULT '#2563eb',
  `status` enum('confirmed','pending','cancelled') DEFAULT 'confirmed',
  `confirmed_by` int(11) DEFAULT NULL,
  `cancelled_by` int(11) DEFAULT NULL,
  `attendees` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `title`, `description`, `room_id`, `user_id`, `start`, `end`, `color`, `status`, `confirmed_by`, `cancelled_by`, `attendees`, `notes`, `created_at`, `updated_at`) VALUES
(51, 'ccc', 'sdf', 2, 13, '2025-09-24 08:00:00', '2025-09-24 12:00:00', '#2563eb', 'confirmed', 6, NULL, 'fff gg', 'ไมโครโฟน x4, โปรเจคเตอร์ x1', '2025-09-23 13:54:23', '2025-09-23 13:54:51');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(8, 13, '', 'คำขอจองของคุณได้รับการยืนยัน', '', 0, '2025-09-23 13:54:51');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `room_number` varchar(10) NOT NULL,
  `capacity` varchar(50) NOT NULL,
  `equipment` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `name`, `room_number`, `capacity`, `equipment`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'ห้องเรียนรวม', '6102', '50 คน', 'โปรเจคเตอร์, ไมโครโฟน, ไวท์บอร์ด, แอร์คอนดิชัน', 'ห้องเรียนรวมขนาดใหญ่ เหมาะสำหรับการบรรยายและการประชุมใหญ่', 'active', '2025-08-08 15:18:18', '2025-08-08 15:18:18'),
(2, 'ห้องประชุมคณะ', '6302', '30 คน', 'โปรเจคเตอร์, ระบบเสียง, ไมโครโฟน, ไวท์บอร์ด, แอร์คอนดิชัน', 'ห้องประชุมคณะ เหมาะสำหรับการประชุมคณะกรรมการและการสัมมนา', 'active', '2025-08-08 15:18:18', '2025-09-06 18:06:27'),
(3, 'ห้องสำนักงาน', '6101', '7 คน', 'ทีวี, ไวท์บอร์ด, โต๊ะประชุม', 'ห้องสำนักงานขนาดเล็ก เหมาะสำหรับการประชุมกลุ่มย่อยและการทำงานร่วมกัน', 'active', '2025-08-08 15:18:18', '2025-09-07 15:37:00');

-- --------------------------------------------------------

--
-- Table structure for table `room_schedules`
--

CREATE TABLE `room_schedules` (
  `id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `day_of_week` varchar(10) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `teacher` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_schedules`
--

INSERT INTO `room_schedules` (`id`, `room_id`, `day_of_week`, `start_time`, `end_time`, `subject`, `code`, `type`, `teacher`) VALUES
(1, 6102, 'จันทร์', '08:00:00', '12:00:00', 'Multimedia Technology Project 1', 'MMT36721N', 'Project', NULL),
(2, 6102, 'จันทร์', '15:00:00', '17:00:00', 'Script Writing and Storytelling', 'MMT36741N', 'Lecture', NULL),
(3, 6102, 'อังคาร', '13:00:00', '14:00:00', 'Preparation for Professional Experience', 'MMT36721N,MMT36741N', 'Tutorial', NULL),
(4, 6102, 'อังคาร', '16:00:00', '17:00:00', 'Script Writing and Storytelling', 'MMT36741N', 'Tutorial', NULL),
(5, 6102, 'พุธ', '08:00:00', '12:00:00', 'Multimedia Technology Project 2', 'MMT36541N', 'Lecture', NULL),
(6, 6102, 'พุธ', '13:00:00', '15:00:00', 'Multimedia Technology Project 2', 'MMT36541N', 'Lecture', NULL),
(7, 6102, 'พฤหัสบดี', '08:00:00', '11:00:00', 'Linear Algebra Computer Graphics', 'MMT36841N', 'Tutorial', NULL),
(8, 6102, 'พฤหัสบดี', '13:00:00', '16:00:00', 'Data Science in Sufficient Life', 'DT36821N', 'Tutorial', NULL),
(9, 6102, 'ศุกร์', '08:00:00', '12:00:00', 'Viral Marketing', 'MMT36541N,MMT36721N', 'Tutorial', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `fname` varchar(100) NOT NULL,
  `lname` varchar(100) NOT NULL,
  `identity_card` varchar(13) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `organization` varchar(200) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_status` enum('pending','approved','rejected') DEFAULT NULL,
  `role` enum('admin','user','student','teacher','staff') DEFAULT 'user',
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `email`, `phone`, `fname`, `lname`, `identity_card`, `address`, `organization`, `is_verified`, `verification_status`, `role`, `image`, `created_at`, `updated_at`) VALUES
(6, 'admin01', '$2b$10$9lTV9OCbHzbKHhHCzc1vueD3wh0SqZYpN/RYRSNRyLXktn0uuVaWm', 'jaahaha10@gmail.com', '0971622018', 'Pepat', 'Komson', '1234567891012', '111', 'test', 1, 'approved', 'admin', '/uploads/1757415713803-mpkf1s.png', '2025-08-08 15:56:00', '2025-09-09 11:02:00'),
(13, 'user1', '$2b$10$aQMep4Y6mFGqFw2BZEycR.aojrW3cl1xlGYXAWTwhl7cn8A9OaR3K', 'jaahaha15@gmail.com', '0971622018', 'Phatcharapon', 'Huajaipeth', '1122334455555', '123/7 khunmala ', 'sci', 1, 'approved', 'user', '/uploads/1757171046437-k4jhqb.jpg', '2025-09-06 15:01:40', '2025-09-06 15:04:07'),
(14, 'test2', '$2b$10$2873WlIduemGJnhnvIxdHO5XMLFzalllgXMVLfYKYDYmx4gE0iQoG', 'asdf@gasdf.om', '007', 'test44', 'afsdxz', '1325531235123', '12', '321', 1, 'approved', 'user', NULL, '2025-09-06 18:42:00', '2025-09-06 18:45:31'),
(15, 'test01', '$2b$10$.3z1lAmBCX8hXXwdDc47juZjt5dG2JLTCFCvple.j76FnLt2.6lGm', 'test@gmail.com', '0971622018', 'test', 'test22', '1234564191012', 'fasf', 'ffaa', 1, 'approved', 'user', NULL, '2025-09-23 15:21:36', '2025-09-23 16:09:28');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bookings_room_date` (`room_id`,`start`,`end`),
  ADD KEY `idx_bookings_user` (`user_id`),
  ADD KEY `fk_bookings_confirmed_by` (`confirmed_by`),
  ADD KEY `fk_bookings_cancelled_by` (`cancelled_by`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`,`is_read`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_number` (`room_number`);

--
-- Indexes for table `room_schedules`
--
ALTER TABLE `room_schedules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_username` (`username`),
  ADD KEY `idx_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `room_schedules`
--
ALTER TABLE `room_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_bookings_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
