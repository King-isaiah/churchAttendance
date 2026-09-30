-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 10, 2026 at 08:22 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `church_attendance`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
CREATE TABLE IF NOT EXISTS `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category_id` int NOT NULL,
  `department_id` varchar(110) NOT NULL,
  `dayofactivity` varchar(50) NOT NULL,
  `time` time NOT NULL,
  `time_exp` time NOT NULL,
  `location_id` int NOT NULL,
  `attendance_method_id` int NOT NULL,
  `status_id` int NOT NULL,
  `attendance_count` int DEFAULT '0',
  `expected_count` int DEFAULT '0',
  `target_audience` varchar(50) DEFAULT 'all',
  `deleted` varchar(110) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `name`, `description`, `category_id`, `department_id`, `dayofactivity`, `time`, `time_exp`, `location_id`, `attendance_method_id`, `status_id`, `attendance_count`, `expected_count`, `target_audience`, `deleted`, `created_at`, `updated_at`) VALUES
(1, 'sunday school', 'oioidmmskd', 3, '[\"12\",\"11\",\"10\",\"9\"]', 'Sunday', '02:10:00', '18:05:00', 12, 3, 1, 0, 77, 'all', NULL, '2025-10-21 12:10:14', '2026-09-02 10:44:51'),
(2, 'Fellowship', 'fellowship with God', 4, '[\"12\",\"11\",\"10\",\"9\"]', 'Sunday', '04:14:00', '18:00:00', 10, 4, 4, 0, 330, 'youth', 'yes', '2025-10-21 12:14:14', '2026-09-02 10:44:47'),
(3, 'believers class', 'training for believers', 1, '[\"12\",\"11\",\"10\",\"9\"]', 'Wednesday', '05:41:00', '12:03:00', 12, 3, 1, 0, 444, 'youth', NULL, '2025-10-21 14:39:54', '2026-09-01 14:11:06'),
(4, 'Envagelism', 'envagelize to people basically spreading the good news', 4, '[\"12\",\"11\",\"10\",\"9\"]', 'Thursday', '06:25:00', '18:00:00', 8, 3, 1, 0, 4785555, 'all', NULL, '2025-10-21 15:24:58', '2026-09-02 10:44:56'),
(6, 'Excos Meeting', 'meeting for the excos of the church', 3, '[\"12\",\"11\",\"10\",\"9\"]', 'Sunday', '00:22:00', '18:00:00', 9, 1, 1, 0, 23, 'youth', NULL, '2025-10-22 15:03:55', '2026-09-02 10:45:03'),
(7, 'atestto see', 'we testing something now shhh', 4, '', 'Sunday', '00:30:00', '18:00:00', 12, 1, 2, 0, 441451325, 'all', NULL, '2025-11-04 11:30:26', '2025-12-17 13:53:24'),
(8, 'Welcoming', 'we testingt', 4, '', 'Sunday', '11:34:00', '17:40:00', 13, 3, 1, 0, 120, 'all', NULL, '2025-12-05 10:35:12', '2026-01-21 15:27:01'),
(10, 'notasexpected', 'trying out to see if it really connects', 1, '[\"12\",\"11\",\"10\",\"9\"]', 'Friday', '14:54:00', '20:55:00', 8, 4, 1, 0, 7411, 'all', 'yes', '2025-12-17 13:55:19', '2026-09-02 10:45:06'),
(11, 'senjurama', 'working on the distrubution', 3, '[\"15\",\"14\"]', 'Tuesday', '17:25:00', '15:31:00', 12, 4, 1, 0, 17852, 'target_audience', 'yes', '2026-09-01 14:26:08', '2026-09-01 14:26:22'),
(12, 'real rela', 'fella fella', 3, '[\"all\"]', 'Wednesday', '19:25:00', '21:25:00', 20, 3, 3, 0, 933332, 'all', NULL, '2026-09-02 14:26:08', '2026-09-07 04:49:36'),
(13, 'testactivity', 'checking to see what was saved in the db', 3, '[\"all\"]', 'Sunday', '05:36:00', '00:48:00', 20, 1, 1, 0, 1233, 'target_audience', 'yes', '2026-09-07 04:36:42', '2026-09-07 04:37:26'),
(14, 'TESTING QR CODE', 'CHECKING TO SEE IF THE CREATION IS INTACT', 2, '[\"9\"]', 'Sunday', '07:26:00', '12:26:00', 10, 1, 1, 0, 23, 'target_audience', NULL, '2026-09-07 05:26:53', '2026-09-07 05:26:53');

-- --------------------------------------------------------

--
-- Table structure for table `activity_qr_codes`
--

DROP TABLE IF EXISTS `activity_qr_codes`;
CREATE TABLE IF NOT EXISTS `activity_qr_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NOT NULL,
  `qr_code` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `max_uses` int DEFAULT '100',
  `uses` int DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qr_code` (`qr_code`),
  KEY `idx_activity_id` (`activity_id`),
  KEY `idx_qr_code` (`qr_code`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=MyISAM AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `activity_qr_codes`
--

INSERT INTO `activity_qr_codes` (`id`, `activity_id`, `qr_code`, `expires_at`, `max_uses`, `uses`, `is_active`, `created_at`, `updated_at`) VALUES
(21, 7, 'ACTIVITY_7_1762357625_65d3d7ea', '2025-11-05 18:47:05', 100, 0, 0, '2025-11-05 15:47:05', '2025-12-05 11:38:17'),
(22, 4, 'ACTIVITY_4_1762358789_5c9855e9', '2025-11-06 16:06:29', 100, 0, 0, '2025-11-05 16:06:29', '2025-11-16 12:21:50'),
(23, 4, 'ACTIVITY_4_1763292110_633edcab', '2025-11-17 11:21:50', 100, 0, 1, '2025-11-16 11:21:50', '2025-11-16 12:21:50'),
(24, 7, 'ACTIVITY_7_1764931097_ddb1e0d8', '2025-12-05 13:38:17', 100, 0, 0, '2025-12-05 10:38:17', '2026-01-22 14:27:37'),
(25, 7, 'ACTIVITY_7_1769088457_a4c2ed93', '2026-01-22 16:27:37', 100, 0, 1, '2026-01-22 13:27:37', '2026-01-22 14:27:37'),
(26, 14, 'ACTIVITY_14_1788758834_b78a7682', '2026-09-08 05:27:14', 100, 0, 1, '2026-09-07 05:27:14', '2026-09-07 06:27:14');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attendance_category` varchar(110) NOT NULL,
  `attendance_category_id` int NOT NULL,
  `unique_id` int NOT NULL,
  `department_id` int NOT NULL,
  `attendance_method_id` int NOT NULL,
  `location_id` int NOT NULL,
  `dayofactivity` varchar(50) NOT NULL,
  `status` varchar(110) DEFAULT 'present',
  `check_in_time` varchar(110) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `attendance_category`, `attendance_category_id`, `unique_id`, `department_id`, `attendance_method_id`, `location_id`, `dayofactivity`, `status`, `check_in_time`, `created_at`) VALUES
(1, 'activity', 3, 561347511, 11, 3, 12, 'Sunday', 'present', '11:45:35', '2025-12-10 10:45:37'),
(2, 'activity', 4, 561347511, 11, 3, 12, 'Sunday', 'present', '11:45:35', '2025-12-10 10:45:37'),
(7, 'event', 7, 5154165, 9, 3, 12, 'Monday', 'present', '11:55:35', '2026-01-09 12:27:49'),
(8, 'event', 6, 646516, 15, 3, 12, 'Monday', 'present', '10:55:35', '2026-01-09 12:27:49'),
(10, 'event', 7, 874984, 11, 3, 12, 'Monday', 'present', '9:55:35', '2026-01-09 12:27:54'),
(11, 'activity', 6, 47854, 12, 4, 13, 'Tuesday', 'present', '7:55:35', '2026-01-08 23:00:00'),
(12, 'activity', 4, 75457, 15, 4, 13, 'Wednesday', 'present', '11:55:35', '2026-01-08 23:00:00'),
(16, 'activity', 4, 561347511, 14, 3, 8, 'Thursday', 'present', '12:47:47', '2026-01-22 11:47:47'),
(17, 'activity', 4, 561347511, 14, 3, 8, 'Thursday', 'late', '06:41:15', '2026-08-27 05:41:17'),
(18, 'activity', 4, 561347511, 14, 3, 8, 'Thursday', 'present', '08:36:59', '2026-09-10 07:37:00');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_methods`
--

DROP TABLE IF EXISTS `attendance_methods`;
CREATE TABLE IF NOT EXISTS `attendance_methods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text,
  `is_active` varchar(110) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `attendance_methods`
--

INSERT INTO `attendance_methods` (`id`, `name`, `code`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'QR Code', 'qr_code', 'Scan QR code to check in', 'active', '2025-10-20 15:08:24', '2025-10-22 10:42:24'),
(2, 'Numeric Code', 'numeric_code', 'Enter numeric code to check in', 'active', '2025-10-20 15:08:24', '2025-10-22 10:42:30'),
(3, 'Location', 'gps', 'GPS location-based check ins', 'active', '2025-10-20 15:08:24', '2025-10-22 10:42:37'),
(4, 'NFC/RFID', 'nfc', 'Tap NFC/RFID card to check in', 'active', '2025-10-20 15:08:24', '2025-10-22 10:42:43'),
(6, 'testing', 'okyi', 'testing to see whats poping fuck shot', 'inactive', '2025-10-21 11:02:02', '2025-10-22 10:42:51');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categories` varchar(255) NOT NULL,
  `color` varchar(110) NOT NULL,
  `description` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories` (`categories`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `categories`, `color`, `description`, `created_at`) VALUES
(1, 'fellowship', '#e51f1f', 'felowshiping with one another', '2025-12-18 09:06:29'),
(2, 'praise', '', '', '2025-10-09 10:24:40'),
(3, 'Education', '#0b87f4', 'Educative purposes like', '2026-01-09 15:36:57'),
(4, 'Social', '#d12929', 'its kinda of a social event', '2026-01-07 13:31:32'),
(5, 'Out reach', '#e74f0d', 'to reach out to people to know whatsup', '2025-12-18 08:56:09');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `no_members` int DEFAULT NULL,
  `description` varchar(400) NOT NULL,
  `HOD` varchar(500) DEFAULT NULL,
  `ASS_HOD` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=MyISAM AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `no_members`, `description`, `HOD`, `ASS_HOD`, `created_at`) VALUES
(14, 'excos', 40, 'executives duties and roles', 'seyi', 'omo', '2025-11-14 09:53:10'),
(13, 'sound', 12, 'sound administration and control', 'dayo', 'dont know', '2025-11-14 09:52:40'),
(10, 'Pastorial', 11, 'pastors stuff', 'seyi', 'omo', '2025-11-14 09:51:07'),
(11, 'ushering', 33, 'ushering stuff', 'joyce', 'emmanuel', '2025-11-14 09:51:32'),
(12, 'choir', 35, 'music ministeration and offering you know', 'i cant remember her name', 'Emelda', '2026-08-31 13:58:23'),
(9, 'sounding', 3, 'just testing', 'joke', 'jola', '2025-10-10 15:03:38'),
(15, 'welcome', 11, 'welcoming new comers', 'one fine tall girl', 'emelda', '2026-08-31 13:58:33');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
CREATE TABLE IF NOT EXISTS `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `event_date` date NOT NULL,
  `event_time` time NOT NULL,
  `location_id` int NOT NULL,
  `department_id` varchar(110) NOT NULL DEFAULT '0',
  `category_id` int DEFAULT NULL,
  `attendance_method_id` int DEFAULT NULL,
  `expected_attendance` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_date` (`event_date`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `title`, `description`, `event_date`, `event_time`, `location_id`, `department_id`, `category_id`, `attendance_method_id`, `expected_attendance`, `created_at`, `updated_at`) VALUES
(7, 'Road trip', 'come together know each other i think broooooooooooo', '2025-10-29', '10:08:00', 6, '9', 2, 0, 7777, '2025-10-29 06:06:28', '2026-01-26 15:14:43'),
(2, 'Youth Bible Study', 'Youth group Bible study and fellowship', '2024-01-10', '18:30:00', 12, '[10,11,14]', 1, 0, 45, '2025-10-24 16:01:22', '2026-09-10 08:21:17'),
(3, 'Choir Practices', 'Weekly choir rehearsal for Sunday service', '2024-01-11', '20:00:00', 7, '10', 4, 0, 25, '2025-10-24 16:01:22', '2026-01-07 09:29:14'),
(4, 'Leadership Meeting', 'Monthly church leadership planning session', '2024-01-13', '14:00:00', 13, '0', 3, 0, 15, '2025-10-24 16:01:22', '2025-12-18 08:24:24'),
(5, 'Prayer Meeting', 'Mid-week prayer and intercession gathering', '2024-01-14', '18:00:00', 6, '0', 3, 0, 60, '2025-10-24 16:01:22', '2025-12-18 08:24:26'),
(6, 'Tupusa', 'praying and singing toegther', '2025-10-24', '11:53:00', 12, '0', 1, 0, 110, '2025-10-24 15:48:03', '2025-12-18 08:24:30'),
(8, 'desk', 'djjjcnjxcnjzcxncnjc', '2026-05-06', '21:33:00', 12, '0', NULL, NULL, 12, '2026-01-26 14:29:43', '2026-01-26 15:29:43'),
(9, 'mess up', 'foind the origin of the problem hopin it is fixed now', '2026-09-16', '23:38:00', 13, '0', NULL, NULL, 77, '2026-01-26 14:32:34', '2026-01-26 15:32:34'),
(10, 'testing for a time', 'trying the cartegory id', '2026-02-05', '21:01:00', 12, '14', 1, NULL, 21, '2026-01-26 14:57:24', '2026-01-26 15:57:24');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `capacity` int NOT NULL,
  `address` varchar(400) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `location` (`name`)
) ENGINE=MyISAM AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `name`, `capacity`, `address`, `created_at`, `latitude`, `longitude`) VALUES
(1, 'opic', 24530, 'opic begger ogun state', '2025-12-12 14:46:33', NULL, NULL),
(6, 'Wembely-stadium', 1200, 'wembly stadium', '2025-12-12 15:20:24', 9.59799300, 76.89610600),
(12, 'ICM', 50000, 'Ikeja city mall Alausa', '2025-11-25 15:57:02', 6.61437850, 3.35776800),
(7, 'Youth Night', 23242, '21 compose yourself street mightyhadit campus lagos state\n', '2025-12-12 15:15:27', NULL, NULL),
(8, 'bolous enterprise', 442, '10 Acme Rd, Ikeja, LA, NG', '2026-01-09 15:41:52', 6.62761540, 3.35418280),
(9, 'CCI new celebration Church', 7700, 'Celebr8 Centre HQ, Vori Close, off Acme Road, Ogba, Ikeja, Lagos', '2026-01-09 15:40:22', 6.62172400, 3.33602400),
(10, 'Conference Room', 475200, 'what concerns you', '2025-10-24 15:04:38', NULL, NULL),
(13, 'Belimpex', 478554, 'Belimpex Acme Road Ogba Industrial Estate, Ikeja Lagos state Nigeria', '2025-12-12 14:44:10', 6.62172400, 3.33602400),
(17, 'Maitama', 2392404, ' 1 Aguiyi Ironsi Street, Maitama, Abuja', '2026-08-24 08:32:57', 9.08707920, 7.47359240),
(18, 'lust workd', 3924032, 'testing to see if this wrong location ', '2026-08-24 08:19:36', -25.26631700, -57.58456500),
(20, 'Fade aWAY', 38490, '814 Main Street, Van Buren, AR 72956', '2026-08-24 10:28:47', 35.43686200, -94.35204690);

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
CREATE TABLE IF NOT EXISTS `members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unique_id` int NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department_id` varchar(110) NOT NULL,
  `primary_dept_id` int NOT NULL,
  `password` varchar(250) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `join_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `unique_id` (`unique_id`),
  UNIQUE KEY `user_name` (`user_name`),
  KEY `idx_email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `unique_id`, `user_name`, `first_name`, `last_name`, `email`, `phone`, `department_id`, `primary_dept_id`, `password`, `join_date`, `created_at`, `updated_at`) VALUES
(3, 874984, 'Mike J', 'Mike', 'Johnson', 'mike.johnson@example.coms', '555-9012', '11', 11, 'watsapp', '2023-03-10', '2025-10-23 15:45:36', '2026-09-08 05:53:35'),
(4, 884564, 'Sarai', 'Sarah', 'Wilson', 'sarah.wilson@example.com', '555-3456', '10', 10, '', '2023-04-05', '2025-10-23 15:45:36', '2026-09-08 05:53:30'),
(5, 98456, 'run run run', 'David', 'Browns', 'david.browns@example.com', '555-7890', '9', 9, '', '2023-05-12', '2025-10-23 15:45:36', '2026-09-08 05:53:21'),
(6, 96450, 'JERVIS', 'Emily', 'Davis', 'emily.davis@example.com', '555-2345', '14', 14, 'MI PASSWORD', '2023-06-18', '2025-10-23 15:45:36', '2026-09-08 05:53:24'),
(7, 5154165, 'Roberto', 'Robert', 'Miller', 'robert.miller@example.com', '555-6789', '9', 9, '', '2023-07-22', '2025-10-23 15:45:36', '2026-09-08 05:53:27'),
(8, 646516, 'E A Sports', 'Eshiozemhe', 'Afuwape', 'eshiozemhea@gmail.com', '09069318837', '15', 15, '', '2025-10-23', '2025-10-23 15:23:19', '2026-09-08 05:53:12'),
(9, 75457, 'U ply to much', 'Ufouma', 'Napoleon', 'napo@gmail.com', '09069318837', '15', 15, '', '2025-10-23', '2025-10-23 15:29:31', '2026-09-08 05:53:16'),
(10, 47854, 'kakarot', 'Jane', 'Smith', 'jane.smithings@example.com', '09085555678', '12', 12, 'shutitbruv', '2025-11-07', '2025-11-07 08:27:54', '2026-09-08 05:54:02'),
(11, 561347511, 'youngblood', 'young j', 'Masayuki', 'eshioze@gmail.com', '09069318837', '14', 14, 'eshioze', '2025-11-15', '2025-11-07 10:02:59', '2026-09-08 05:18:09'),
(12, 717039019, 'sddff', 'habibi', 'gdgfhgj', 'hrhcj@gmail.com', '050263147895', '12', 12, 'duck', '2026-01-12', '2026-01-12 11:09:05', '2026-09-08 05:54:06'),
(13, 1500832833, 'desire', 'desire', 'dekints', 'desire@gmail.com', '09084723455', '[13,12,14]', 13, 'desire', '2026-01-26', '2026-01-26 14:25:25', '2026-09-08 05:54:49'),
(14, 792214516, 'Usman', 'Debwoi', 'destro', 'duboi@gmail.com', '09087642134', '[15,14,9]', 15, 'duboi', '2026-09-08', '2026-09-08 04:03:04', '2026-09-08 05:03:04'),
(15, 987316638, 'we wrod', 'rock we do', 'desdon', 'deson@gmail.com', '07146782902', '14', 14, 'desdon', '2026-09-08', '2026-09-08 05:24:09', '2026-09-08 06:24:09');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `notification_type` enum('member','announcement','event','activity','department','system') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'announcement',
  `department_id` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_active_department` (`is_active`,`department_id`),
  KEY `idx_expires` (`expires_at`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `title`, `message`, `notification_type`, `department_id`, `is_active`, `priority`, `created_at`, `expires_at`) VALUES
(1, 'New Event: mess up', 'foind the origin of the problem hopin it is fixed now', 'event', 0, 1, 'medium', '2026-01-26 16:32:34', '2026-02-02 15:32:34'),
(2, 'New Event: testing for a time', 'trying the cartegory id', 'event', 14, 1, 'medium', '2026-01-26 16:57:24', '2026-02-02 15:57:24'),
(3, 'New Activity', 'senjurama A new activity has been scheduled.', 'activity', 0, 1, 'medium', '2026-09-01 14:26:08', '2026-09-08 14:26:08'),
(4, 'New Activity', 'real rela A new activity has been scheduled.', 'activity', 0, 1, 'medium', '2026-09-02 14:26:08', '2026-09-09 14:26:08'),
(5, 'New Activity', 'testactivity A new activity has been scheduled.', 'activity', 0, 1, 'medium', '2026-09-07 04:36:42', '2026-09-14 04:36:42'),
(6, 'New Activity', 'TESTING QR CODE A new activity has been scheduled.', 'activity', 0, 1, 'medium', '2026-09-07 05:26:53', '2026-09-14 05:26:53'),
(7, 'New Member', 'yudis has joined your department workforce.', '', 0, 1, 'medium', '2026-09-08 04:18:35', '2026-09-15 04:18:35'),
(8, 'New Member', 'yudis has joined your department workforce.', '', 0, 1, 'medium', '2026-09-08 04:18:48', '2026-09-15 04:18:48'),
(9, 'New Member', 'Debwoi has joined your department workforce.', '', 0, 1, 'medium', '2026-09-08 05:03:04', '2026-09-15 05:03:04'),
(10, 'New Member', 'rock we do has joined your department workforce.', 'member', 14, 1, 'medium', '2026-09-08 06:24:09', '2026-09-15 06:24:09'),
(11, 'wechecking', 'rest', 'event', 14, 1, 'medium', '2026-09-10 07:42:02', '2026-09-17 07:42:02'),
(12, 'QWE', 'SWQA', 'event', 0, 1, 'medium', '2026-09-10 08:18:51', '2026-09-17 08:18:51');

-- --------------------------------------------------------

--
-- Table structure for table `rsvp`
--

DROP TABLE IF EXISTS `rsvp`;
CREATE TABLE IF NOT EXISTS `rsvp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `unique_id` int NOT NULL,
  `attending` int NOT NULL,
  `guest_count` int NOT NULL,
  `notes` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `rsvp`
--

INSERT INTO `rsvp` (`id`, `event_id`, `unique_id`, `attending`, `guest_count`, `notes`, `created_at`) VALUES
(1, 7, 561347511, 1, 0, 'yes', '2026-01-06 08:01:52'),
(2, 6, 561347511, 1, 0, 'yes', '2026-01-06 08:01:06'),
(3, 5, 561347511, 3, 0, 'i havent made up my mind', '2026-01-07 11:39:12'),
(4, 9, 792214516, 1, 8, 'readssd', '2026-09-09 16:11:05'),
(5, 9, 561347511, 1, 7, 'jh', '2026-09-09 16:12:04'),
(6, 2, 561347511, 1, 0, 'mm', '2026-09-09 16:51:50');

-- --------------------------------------------------------

--
-- Table structure for table `speakers`
--

DROP TABLE IF EXISTS `speakers`;
CREATE TABLE IF NOT EXISTS `speakers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `speakers_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(11) NOT NULL,
  `speciality` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `speakers_name` (`speakers_name`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `speakers`
--

INSERT INTO `speakers` (`id`, `speakers_name`, `email`, `phone_number`, `speciality`, `created_at`) VALUES
(1, 'eshiozemhe afuwape', 'eshiozemhe@gmail.com', '09069318837', 'yeshua', '2025-10-07 10:04:41'),
(3, 'blud', 'eshiozemhea@gmail.com', '09069318837', 'ww', '2025-10-04 11:21:10'),
(6, 'wembely', 'wembly@gmail.com', '09047563829', 'submission to God', '2025-10-08 13:36:29'),
(7, 'kaitels', 'kaitel@gmail.com', '08073456178', 'beatitudes', '2025-10-17 15:49:48'),
(9, 'Riddick', 'naths@gmail.com', '09087313452', 'Gods will', '2026-08-27 06:50:20');

-- --------------------------------------------------------

--
-- Table structure for table `statuses`
--

DROP TABLE IF EXISTS `statuses`;
CREATE TABLE IF NOT EXISTS `statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `color` varchar(7) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `statuses`
--

INSERT INTO `statuses` (`id`, `name`, `color`, `description`, `created_at`) VALUES
(1, 'Active', '#29db53', 'Currently ongoing activities', '2025-10-20 14:32:29'),
(2, 'Upcoming', '#17a2b8', 'Scheduled future activities', '2025-10-20 14:32:29'),
(3, 'Completed', '#6c757d', 'Finished activities', '2025-10-20 14:32:29'),
(4, 'Cancelled', '#dc3545', 'Cancelled activities', '2025-10-20 14:32:29');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
