-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 17, 2025 at 07:10 AM
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
  `booking_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
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

INSERT INTO `bookings` (`booking_id`, `title`, `room_id`, `user_id`, `start`, `end`, `status`, `confirmed_by`, `cancelled_by`, `attendees`, `notes`, `created_at`, `updated_at`) VALUES
(79, 'test', 3, 25, '2025-10-06 08:00:00', '2025-10-06 12:00:00', 'confirmed', 23, NULL, '5', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-05 18:23:21', '2025-10-05 18:28:18'),
(80, '11', 1, 21, '2025-10-06 13:00:00', '2025-10-06 17:00:00', 'confirmed', 23, NULL, '1', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-05 18:27:33', '2025-10-05 18:28:17'),
(89, '1', 1, 20, '2025-10-21 08:00:00', '2025-10-21 12:00:00', 'confirmed', 6, NULL, '1', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-17 19:14:29', '2025-10-17 19:16:10'),
(90, 'test', 2, 26, '2025-10-18 08:00:00', '2025-10-18 12:00:00', 'confirmed', 6, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-17 19:35:31', '2025-10-17 19:36:01'),
(92, 'meeting aug 2', 2, 18, '2025-08-10 13:00:00', '2025-08-10 15:00:00', 'confirmed', 18, NULL, '3', 'Microphone', '2025-08-10 05:00:00', '2025-08-10 05:00:00'),
(93, 'meeting aug 3', 3, 20, '2025-08-15 08:00:00', '2025-08-15 10:00:00', 'confirmed', 20, NULL, '1', 'Whiteboard', '2025-08-15 00:00:00', '2025-08-15 00:00:00'),
(94, 'meeting aug 4', 1, 21, '2025-08-20 14:00:00', '2025-08-20 16:00:00', 'confirmed', 21, NULL, '2', 'Notebook', '2025-08-20 06:00:00', '2025-08-20 06:00:00'),
(95, 'meeting aug 5', 2, 23, '2025-08-25 10:00:00', '2025-08-25 12:00:00', 'confirmed', 23, NULL, '4', 'TV', '2025-08-25 02:00:00', '2025-08-25 02:00:00'),
(96, 'meeting sep 1', 1, 6, '2025-09-03 09:00:00', '2025-09-03 11:00:00', 'confirmed', 6, NULL, '2', 'Projector', '2025-09-03 01:00:00', '2025-09-03 01:00:00'),
(97, 'meeting sep 2', 2, 18, '2025-09-08 13:00:00', '2025-09-08 15:00:00', 'confirmed', 18, NULL, '3', 'Microphone', '2025-09-08 05:00:00', '2025-09-08 05:00:00'),
(98, 'meeting sep 3', 3, 20, '2025-09-13 08:00:00', '2025-09-13 10:00:00', 'confirmed', 20, NULL, '1', 'Whiteboard', '2025-09-13 00:00:00', '2025-09-13 00:00:00'),
(99, 'meeting sep 4', 1, 21, '2025-09-18 14:00:00', '2025-09-18 16:00:00', 'confirmed', 21, NULL, '2', 'Notebook', '2025-09-18 06:00:00', '2025-09-18 06:00:00'),
(100, 'meeting sep 5', 2, 23, '2025-09-23 10:00:00', '2025-09-23 12:00:00', 'confirmed', 23, NULL, '4', 'TV', '2025-09-23 02:00:00', '2025-09-23 02:00:00'),
(101, '11', 3, 20, '2025-10-23 08:00:00', '2025-10-23 12:00:00', 'confirmed', 6, NULL, '4', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 16:30:54', '2025-10-18 16:31:08'),
(102, 'test78', 2, 20, '2025-10-24 08:00:00', '2025-10-24 12:00:00', 'confirmed', 6, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 16:31:40', '2025-10-18 16:39:56'),
(103, '11', 2, 20, '2025-10-22 08:00:00', '2025-10-22 12:00:00', 'confirmed', 6, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 16:33:31', '2025-10-18 16:39:54'),
(104, 'aaa', 2, 20, '2025-10-26 08:00:00', '2025-10-26 12:00:00', 'confirmed', 23, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 16:40:40', '2025-10-18 20:38:13'),
(105, 'test', 3, 27, '2025-10-25 08:00:00', '2025-10-25 17:00:00', 'confirmed', 23, NULL, '1', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 20:39:35', '2025-10-18 20:39:58'),
(106, '123', 1, 27, '2025-10-25 08:00:00', '2025-10-25 12:00:00', 'confirmed', 23, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 20:40:33', '2025-10-18 20:40:51'),
(107, 'test44', 3, 25, '2025-10-26 08:00:00', '2025-10-26 12:00:00', 'confirmed', 23, NULL, '4', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 21:12:59', '2025-10-18 21:13:15'),
(108, '113zx', 1, 25, '2025-10-31 13:00:00', '2025-10-31 17:00:00', 'confirmed', 23, NULL, '11', 'ไม่ต้องการอุปกรณ์เสริม', '2025-10-18 21:35:14', '2025-10-19 11:39:32'),
(109, 'DemoBz1', 1, 20, '2025-10-26 08:00:00', '2025-10-26 17:00:00', 'confirmed', 23, NULL, '11', 'ไมโครโฟน x4, ลำโพง x3, โปรเจคเตอร์ x1, จอภาพ x1', '2025-10-19 11:56:42', '2025-10-19 11:57:03');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `room_number` varchar(10) NOT NULL,
  `capacity` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `name`, `room_number`, `capacity`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'ห้องเรียนรวม', '6102', '50 คน', 'ห้องเรียนรวมขนาดใหญ่ เหมาะสำหรับการบรรยายและการประชุมใหญ่', 'active', '2025-08-08 15:18:18', '2025-08-08 15:18:18'),
(2, 'ห้องประชุมคณะ', '6302', '10 คน', 'ห้องประชุมคณะ เหมาะสำหรับการประชุมคณะกรรมการและการสัมมนา', 'active', '2025-08-08 15:18:18', '2025-10-19 11:55:19'),
(3, 'ห้องสำนักงาน', '6101', '7 คน', 'ห้องสำนักงานขนาดเล็ก เหมาะสำหรับการประชุมกลุ่มย่อยและการทำงานร่วมกัน', 'active', '2025-08-08 15:18:18', '2025-09-07 15:37:00');

-- --------------------------------------------------------

--
-- Table structure for table `room_schedules`
--

CREATE TABLE `room_schedules` (
  `schedule_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `day_of_week` varchar(10) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_schedules`
--

INSERT INTO `room_schedules` (`schedule_id`, `room_id`, `day_of_week`, `start_time`, `end_time`, `subject`) VALUES
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
  `verification_status` enum('pending','approved','rejected') DEFAULT NULL,
  `role` enum('admin','user','student','teacher','staff') DEFAULT 'user',
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `email`, `phone`, `fname`, `lname`, `identity_card`, `address`, `organization`, `verification_status`, `role`, `image`, `created_at`, `updated_at`) VALUES
(6, 'admin01', '$2b$10$9lTV9OCbHzbKHhHCzc1vueD3wh0SqZYpN/RYRSNRyLXktn0uuVaWm', 'jaahaha10@gmail.com', '0971622018', 'Pepat', 'Komson', '1234567891012', '111', 'test', 'approved', 'admin', '/uploads/1759060008616-wimogj.png', '2025-08-08 15:56:00', '2025-09-28 11:46:51'),
(18, 'aaaaa001', '$2b$10$vRtkV/ojpPzJ4pTIcEPxc.frNQKi2EyKKJzHZohe0855U5Qm/t.iu', 'aaaaa001@gmail.com', '08813241324', 'ppht', 'asfd', '1133124124411', 'adsf', 'asdf', 'approved', 'teacher', '/uploads/1759116667216-l5hjgf.png', '2025-09-26 16:35:11', '2025-10-04 09:50:19'),
(20, 'test2', '$2b$10$Xjhjt4Y1sBGMLqYaqK7NS.6C878V/W6bbKkhTRmN/pKbVJNPPCwFC', 'test2@gmail.com', '13251253', '1', '1', '1133124125555', '1', '1', 'approved', 'student', NULL, '2025-09-28 23:40:25', '2025-10-04 11:23:35'),
(21, 'test5', '$2b$10$3xA6SPpmBeIp2rD.BU9ZxOIQHVWCEYKqgT4RLdT89RdMnE2BCezRe', 'test5@gmail.com', '4412312431', 'test', 'test2', NULL, NULL, NULL, 'approved', 'user', NULL, '2025-10-04 08:51:39', '2025-10-04 11:23:24'),
(23, 'test1', '$2b$10$oRgA0OCnOVc8dFyGfIs.3ea3h7Z2uJx9lm1g.ZeMG8Nb2UKdwf5gm', 'testzx@gmail.com', '01239906235', 'Somdee', 'Testlelotus', '1234567891013', '111', 'ggas', 'approved', 'staff', '/uploads/1759680788275-7e54i6.png', '2025-10-04 09:05:46', '2025-10-19 11:52:12'),
(25, 'test3', '$2b$10$gRwpX2aVu9Xmgap7tUONrO/EgjLV0K.tr/soY1liAR8yTDS8Gi5MG', 'test3@gmail.com', '0922123311', '123a', 'aabz', '1231231322222', 'suphan', 'sci', 'approved', 'user', NULL, '2025-10-05 18:12:44', '2025-10-05 18:23:00'),
(26, 'test333', '$2b$10$wqGn26Pn7Jc0vpBAheCaVe8fvYq0CzJIAo5Vq/QYfxvTiDjZMXj.2', 'assa@gfail.com', '1231233112', 'a123z', 'jazzx', '1793311266124', '1941/', 'ssa', 'approved', 'user', NULL, '2025-10-17 19:23:48', '2025-10-17 19:33:11'),
(27, 'test9', '$2b$10$.MIqDZxMu9md2ZJ43zW7JuSLT3JRSy17SCPg9mEYsOD3kPsu991cC', 'test11@gmail.com', '0912312111', '1123a', 'saz', '1312112313212', 'tas13', '1234', 'approved', 'user', NULL, '2025-10-18 16:42:56', '2025-10-19 11:39:22');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `idx_bookings_room_date` (`room_id`,`start`,`end`),
  ADD KEY `idx_bookings_user` (`user_id`),
  ADD KEY `fk_bookings_cancelled_by` (`cancelled_by`),
  ADD KEY `fk_bookings_confirmed_by` (`confirmed_by`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `room_number` (`room_number`);

--
-- Indexes for table `room_schedules`
--
ALTER TABLE `room_schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `fk_room_schedules_room` (`room_id`);

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
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT for table `room_schedules`
--
ALTER TABLE `room_schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_bookings_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_bookings_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `room_schedules`
--
ALTER TABLE `room_schedules`
  ADD CONSTRAINT `fk_room_schedules_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
