-- ==============================================================================
-- AgriShare: A Web-Based Agricultural Resource-Sharing and Scheduling Platform
-- Municipal Agriculture Office (MAO) of Baco, Oriental Mindoro
--
-- phpMyAdmin / MySQL Database Dump
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, XAMPP, WAMP, Laragon
-- ==============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+08:00";
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `agrishare_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `agrishare_db`;

-- -----------------------------------------------------------------------------
-- Table structure for `roles`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL UNIQUE,
  `role_name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `permissions` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `roles` (7 rows)
INSERT INTO `roles` (`id`, `code`, `role_name`, `description`, `permissions`) VALUES
  (1, 'admin', 'MAO Administrator', 'Full administrative control.', '["*"]'),
  (2, 'staff', 'MAO Staff / Coordinator', 'Operational management.', '["requests.review","equipment.manage","schedule.manage","content.manage"]'),
  (3, 'farmer', 'Farmer', 'Submit requests and view information.', '["requests.create","profile.manage"]'),
  (4, 'association', 'Association Officer', 'Association-level coordination.', '["association.view","requests.create"]'),
  (5, 'barangay', 'Barangay Representative', 'Barangay-level coordination.', '["barangay.view"]'),
  (6, 'operator', 'Driver / Technician / Operator', 'Field assignments.', '["assignments.view","assignments.update"]'),
  (7, 'auditor', 'System Auditor', 'Read-only monitoring.', '["reports.view","logs.view"]');

-- -----------------------------------------------------------------------------
-- Table structure for `barangays`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `barangays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `municipality` varchar(100) NOT NULL DEFAULT 'Baco',
  `province` varchar(100) NOT NULL DEFAULT 'Oriental Mindoro',
  `lat` decimal(10,6) NOT NULL,
  `lng` decimal(10,6) NOT NULL,
  `farmland_ha` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `barangays` (17 rows)
INSERT INTO `barangays` (`id`, `name`, `municipality`, `province`, `lat`, `lng`, `farmland_ha`) VALUES
  (1, 'Poblacion', 'Baco', 'Oriental Mindoro', '13.357800', '121.100200', '120.50'),
  (2, 'Alag', 'Baco', 'Oriental Mindoro', '13.401000', '121.079000', '480.00'),
  (3, 'Bangkatan', 'Baco', 'Oriental Mindoro', '13.372000', '121.118000', '260.75'),
  (4, 'Baras', 'Baco', 'Oriental Mindoro', '13.350600', '121.107000', '190.00'),
  (5, 'Bayanan', 'Baco', 'Oriental Mindoro', '13.335000', '121.089000', '310.20'),
  (6, 'Burbuli', 'Baco', 'Oriental Mindoro', '13.322000', '121.132000', '205.00'),
  (7, 'Catwiran I', 'Baco', 'Oriental Mindoro', '13.305000', '121.155000', '175.40'),
  (8, 'Dulangan I', 'Baco', 'Oriental Mindoro', '13.383000', '121.141000', '410.00'),
  (9, 'Lumangbayan', 'Baco', 'Oriental Mindoro', '13.365000', '121.085000', '225.60'),
  (10, 'Malapad', 'Baco', 'Oriental Mindoro', '13.344000', '121.070000', '150.00'),
  (11, 'Mangangan I', 'Baco', 'Oriental Mindoro', '13.398000', '121.123000', '345.30'),
  (12, 'Mayabig', 'Baco', 'Oriental Mindoro', '13.318000', '121.095000', '280.00'),
  (13, 'Pulang-Tubig', 'Baco', 'Oriental Mindoro', '13.390000', '121.160000', '198.75'),
  (14, 'San Andres', 'Baco', 'Oriental Mindoro', '13.331000', '121.118000', '265.10'),
  (15, 'Santa Rosa I', 'Baco', 'Oriental Mindoro', '13.412000', '121.104000', '390.00'),
  (16, 'Silonay', 'Baco', 'Oriental Mindoro', '13.369000', '121.063000', '140.00'),
  (17, 'Tabon-tabon', 'Baco', 'Oriental Mindoro', '13.310000', '121.075000', '215.90');

-- -----------------------------------------------------------------------------
-- Table structure for `associations`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `associations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `acronym` varchar(50) NOT NULL DEFAULT '',
  `contact_person` varchar(255) NOT NULL DEFAULT '',
  `contact_number` varchar(50) NOT NULL DEFAULT '',
  `barangay_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `barangay_id` (`barangay_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `associations` (5 rows)
INSERT INTO `associations` (`id`, `name`, `acronym`, `contact_person`, `contact_number`, `barangay_id`, `status`) VALUES
  (1, 'Baco Rice Farmers Association', 'BRFA', 'Rolando M. Dela Cruz', '0917-555-0101', 1, 'Active'),
  (2, 'Alag Irrigators Association', 'AIA', 'Melinda C. Reyes', '0918-555-0142', 2, 'Active'),
  (3, 'Mangangan Vegetable Growers', 'MVG', 'Jaime P. Villanueva', '0920-555-0177', 11, 'Active'),
  (4, 'Bayanan Farmers Cooperative', 'BFC', 'Teresita L. Agbayani', '0916-555-0198', 5, 'Active'),
  (5, 'Dulangan Corn Producers Group', 'DCPG', 'Nestor G. Ramos', '0999-555-0123', 8, 'Active');

-- -----------------------------------------------------------------------------
-- Table structure for `users`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `phone` varchar(50) NOT NULL DEFAULT '',
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'farmer',
  `barangay_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `avatar_emoji` varchar(10) NOT NULL DEFAULT '🧑‍🌾',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `role` (`role`),
  KEY `barangay_id` (`barangay_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users` (15 rows)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `barangay_id`, `status`, `avatar_emoji`, `created_at`) VALUES
  (1, 'Engr. Ramon T. Bautista', 'admin@agrishare.gov.ph', '0917-100-1001', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'admin', 1, 'Active', '👨‍💼', '2026-09-20 12:25:44'),
  (2, 'Ma. Cristina L. Fajardo', 'staff@agrishare.gov.ph', '0917-100-1002', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'staff', 1, 'Active', '👩‍💻', '2026-09-20 12:25:44'),
  (3, 'Arnel D. Manalo', 'coordinator@agrishare.gov.ph', '0917-100-1003', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'staff', 1, 'Active', '🧑‍💼', '2026-09-20 12:25:44'),
  (4, 'Juan P. Dela Cruz', 'farmer@agrishare.gov.ph', '0917-200-2001', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'farmer', 2, 'Active', '🧑‍🌾', '2026-09-20 12:25:44'),
  (5, 'Maria S. Santos', 'maria.santos@agrishare.gov.ph', '0917-200-2002', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'farmer', 5, 'Active', '👩‍🌾', '2026-09-20 12:25:44'),
  (6, 'Pedro L. Villanueva', 'pedro.villanueva@agrishare.gov.ph', '0917-200-2003', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'farmer', 11, 'Active', '🧑‍🌾', '2026-09-20 12:25:44'),
  (7, 'Lorna B. Aguilar', 'lorna.aguilar@agrishare.gov.ph', '0917-200-2004', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'farmer', 8, 'Active', '👩‍🌾', '2026-09-20 12:25:44'),
  (8, 'Ricardo M. Gatchalian', 'ricardo.g@agrishare.gov.ph', '0917-200-2005', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'farmer', 14, 'Active', '🧑‍🌾', '2026-09-20 12:25:44'),
  (9, 'Anita R. Bituin', 'anita.bituin@agrishare.gov.ph', '0917-200-2006', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'farmer', 15, 'Active', '👩‍🌾', '2026-09-20 12:25:44'),
  (10, 'Rolando M. Dela Cruz', 'association@agrishare.gov.ph', '0917-300-3001', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'association', 1, 'Active', '🧑‍⚖️', '2026-09-20 12:25:44'),
  (11, 'Kgd. Vilma O. Pastrana', 'barangay@agrishare.gov.ph', '0917-400-4001', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'barangay', 2, 'Active', '🏛️', '2026-09-20 12:25:44'),
  (12, 'Danilo C. Estrada', 'operator@agrishare.gov.ph', '0917-500-5001', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'operator', 1, 'Active', '👷', '2026-09-20 12:25:44'),
  (13, 'Marlon V. Sarmiento', 'operator2@agrishare.gov.ph', '0917-500-5002', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'operator', 5, 'Active', '👷', '2026-09-20 12:25:44'),
  (14, 'Eduardo N. Lopez', 'technician@agrishare.gov.ph', '0917-500-5003', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'operator', 1, 'Active', '🔧', '2026-09-20 12:25:44'),
  (15, 'COA Rep. Grace T. Morales', 'auditor@agrishare.gov.ph', '0917-600-6001', 'd556beef00cfb1a6d04f5956788f175c:58e8583bf5337ac1bec20901f1fc363654d9314bd521bb9ae2d3ebe4bdb8ffb7848c7dec8fdf342e618e08f362a3621fe8a4550c918b5f79a6f9c459df00fa5a', 'auditor', 1, 'Active', '🕵️', '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `operators`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `operators` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `specialization` varchar(255) NOT NULL DEFAULT 'Harvester Operator',
  `license_no` varchar(100) NOT NULL DEFAULT '',
  `availability` varchar(50) NOT NULL DEFAULT 'Available',
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `operators` (3 rows)
INSERT INTO `operators` (`id`, `user_id`, `specialization`, `license_no`, `availability`, `status`) VALUES
  (1, 12, 'Combine Harvester Operator', 'N02-15-004512', 'Available', 'Active'),
  (2, 13, 'Tractor Operator / Driver', 'N02-16-009821', 'On Assignment', 'Active'),
  (3, 14, 'Farm Machinery Technician', 'TESDA-AFM-2291', 'Available', 'Active');

-- -----------------------------------------------------------------------------
-- Table structure for `farmers`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `association_id` int(11) DEFAULT NULL,
  `barangay_id` int(11) DEFAULT NULL,
  `rsbsa_number` varchar(100) NOT NULL DEFAULT '',
  `address` text NOT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(20) NOT NULL DEFAULT '',
  `preferred_contact` varchar(50) NOT NULL DEFAULT 'Mobile',
  `total_area_ha` decimal(10,2) NOT NULL DEFAULT 0.00,
  `main_crop` varchar(100) NOT NULL DEFAULT 'Rice',
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `barangay_id` (`barangay_id`),
  KEY `association_id` (`association_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `farmers` (7 rows)
INSERT INTO `farmers` (`id`, `user_id`, `association_id`, `barangay_id`, `rsbsa_number`, `address`, `birth_date`, `gender`, `preferred_contact`, `total_area_ha`, `main_crop`, `status`, `created_at`) VALUES
  (1, 4, 1, 2, 'RSBSA-175-2019-00412', 'Sitio Malaya, Alag, Baco', NULL, 'Male', 'Mobile', '3.50', 'Rice', 'Active', '2026-09-20 12:25:44'),
  (2, 5, 4, 5, 'RSBSA-175-2019-00518', 'Purok 3, Bayanan, Baco', NULL, 'Female', 'SMS', '2.20', 'Rice', 'Active', '2026-09-20 12:25:44'),
  (3, 6, 3, 11, 'RSBSA-175-2020-00733', 'Mangangan I, Baco', NULL, 'Male', 'Mobile', '1.80', 'Vegetables', 'Active', '2026-09-20 12:25:44'),
  (4, 7, 5, 8, 'RSBSA-175-2018-00219', 'Dulangan I, Baco', NULL, 'Female', 'Mobile', '4.00', 'Corn', 'Active', '2026-09-20 12:25:44'),
  (5, 8, 1, 14, 'RSBSA-175-2021-00905', 'San Andres, Baco', NULL, 'Male', 'Barangay Office', '2.75', 'Rice', 'Active', '2026-09-20 12:25:44'),
  (6, 9, 2, 15, 'RSBSA-175-2017-00108', 'Santa Rosa I, Baco', NULL, 'Female', 'Mobile', '5.10', 'Rice', 'Active', '2026-09-20 12:25:44'),
  (7, 10, 1, 1, 'RSBSA-175-2016-00021', 'Poblacion, Baco', NULL, 'Male', 'Mobile', '6.00', 'Rice', 'Active', '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `farms`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `farms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `farmer_id` int(11) NOT NULL,
  `barangay_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `crop` varchar(100) NOT NULL DEFAULT 'Rice',
  `area_ha` decimal(10,2) NOT NULL DEFAULT 0.00,
  `lat` decimal(10,6) NOT NULL,
  `lng` decimal(10,6) NOT NULL,
  `landmark` text NOT NULL,
  `notes` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `farmer_id` (`farmer_id`),
  KEY `barangay_id` (`barangay_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `farms` (9 rows)
INSERT INTO `farms` (`id`, `farmer_id`, `barangay_id`, `name`, `crop`, `area_ha`, `lat`, `lng`, `landmark`, `notes`, `created_at`) VALUES
  (1, 1, 2, 'Dela Cruz Rice Field A', 'Rice (NSIC Rc222)', '2.00', '13.402400', '121.080500', 'Near Alag irrigation canal', '', '2026-09-20 12:25:44'),
  (2, 1, 2, 'Dela Cruz Rice Field B', 'Rice (NSIC Rc160)', '1.50', '13.399100', '121.076200', 'Beside Alag Elementary School', '', '2026-09-20 12:25:44'),
  (3, 2, 5, 'Santos Family Farm', 'Rice (Hybrid)', '2.20', '13.336400', '121.090800', 'Purok 3 access road', '', '2026-09-20 12:25:44'),
  (4, 3, 11, 'Villanueva Vegetable Plot', 'Eggplant / Ampalaya', '1.80', '13.397200', '121.124600', 'Upland area, Mangangan I', '', '2026-09-20 12:25:44'),
  (5, 4, 8, 'Aguilar Corn Farm', 'Yellow Corn', '4.00', '13.384500', '121.142800', 'Dulangan river bank', '', '2026-09-20 12:25:44'),
  (6, 5, 14, 'Gatchalian Riceland', 'Rice (NSIC Rc216)', '2.75', '13.332100', '121.119700', 'San Andres barangay road', '', '2026-09-20 12:25:44'),
  (7, 6, 15, 'Bituin Farm North', 'Rice (NSIC Rc222)', '3.10', '13.413200', '121.105400', 'Sta. Rosa I service road', '', '2026-09-20 12:25:44'),
  (8, 6, 15, 'Bituin Farm South', 'Rice (NSIC Rc160)', '2.00', '13.410100', '121.101900', 'Near creek crossing', '', '2026-09-20 12:25:44'),
  (9, 7, 1, 'BRFA Demo Farm', 'Rice (Certified Seeds)', '6.00', '13.356200', '121.102900', 'MAO demo area', '', '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `equipment_categories`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipment_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(10) NOT NULL DEFAULT '🚜',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `equipment_categories` (6 rows)
INSERT INTO `equipment_categories` (`id`, `category_name`, `description`, `icon`) VALUES
  (1, 'Combine Harvester', 'Self-propelled rice combine harvesters.', '🌾'),
  (2, 'Tractor', 'Four-wheel and hand tractors for land preparation.', '🚜'),
  (3, 'Thresher', 'Rice and corn threshing machines.', '⚙️'),
  (4, 'Transport', 'Hauling trucks and multicabs.', '🛻'),
  (5, 'Post-Harvest', 'Dryers, mills and post-harvest facilities.', '🏭'),
  (6, 'Irrigation', 'Water pumps and irrigation sets.', '💧');

-- -----------------------------------------------------------------------------
-- Table structure for `equipment`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `asset_code` varchar(50) NOT NULL UNIQUE,
  `description` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Available',
  `condition` varchar(50) NOT NULL DEFAULT 'Good',
  `owner_office` varchar(255) NOT NULL DEFAULT 'MAO Baco',
  `home_barangay_id` int(11) DEFAULT NULL,
  `location` varchar(255) NOT NULL DEFAULT 'MAO Motorpool, Baco',
  `lat` decimal(10,6) DEFAULT NULL,
  `lng` decimal(10,6) DEFAULT NULL,
  `image_url` text NOT NULL,
  `default_operator_id` int(11) DEFAULT NULL,
  `rate_per_ha` decimal(10,2) NOT NULL DEFAULT 0.00,
  `capacity_note` varchar(255) NOT NULL DEFAULT '',
  `next_maintenance_due` date DEFAULT NULL,
  `notes` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `home_barangay_id` (`home_barangay_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `equipment` (12 rows)
INSERT INTO `equipment` (`id`, `name`, `category_id`, `asset_code`, `description`, `status`, `condition`, `owner_office`, `home_barangay_id`, `location`, `lat`, `lng`, `image_url`, `default_operator_id`, `rate_per_ha`, `capacity_note`, `next_maintenance_due`, `notes`, `created_at`) VALUES
  (1, 'Kubota DC-70 Combine Harvester', 1, 'MAO-HRV-001', '70 HP rice combine harvester with 2.0 m cutting width. Ideal for 1–4 ha lowland rice fields.', 'Available', 'Good', 'MAO Baco', 1, 'MAO Motorpool, Poblacion', '13.357100', '121.100900', 'https://images.pexels.com/photos/37395400/pexels-photo-37395400.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 1, '3500.00', '≈1.2 ha per day', '2026-10-14 00:00:00', '', '2026-09-20 12:25:44'),
  (2, 'Yanmar YH700 Combine Harvester', 1, 'MAO-HRV-002', 'Track-type combine harvester assigned to the northern barangay cluster.', 'Reserved', 'Good', 'MAO Baco', 2, 'Alag Barangay Motorpool', '13.401600', '121.079600', 'https://images.pexels.com/photos/37395394/pexels-photo-37395394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 2, '3500.00', '≈1.5 ha per day', '2026-10-30 00:00:00', '', '2026-09-20 12:25:44'),
  (3, 'World 504 Rice Combine Harvester', 1, 'MAO-HRV-003', 'Municipal harvester for the southern cluster (Bayanan, Mayabig, Tabon-tabon).', 'Under Maintenance', 'Needs Repair', 'MAO Baco', 5, 'MAO Service Bay', '13.336000', '121.089700', 'https://images.pexels.com/photos/10893497/pexels-photo-10893497.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 3, '3200.00', '≈1.0 ha per day', '2026-09-23 00:00:00', '', '2026-09-20 12:25:44'),
  (4, 'Kubota M6040 Farm Tractor', 2, 'MAO-TRC-001', '60 HP four-wheel drive tractor with rotavator for land preparation.', 'Available', 'Excellent', 'MAO Baco', 1, 'MAO Motorpool, Poblacion', '13.357400', '121.101300', 'https://images.pexels.com/photos/34632627/pexels-photo-34632627.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 2, '2500.00', '≈2 ha per day', '2026-10-05 00:00:00', '', '2026-09-20 12:25:44'),
  (5, 'Massey Ferguson 4WD Tractor', 2, 'MAO-TRC-002', 'Heavy-duty tractor with disc plow and harrow attachments.', 'In Use', 'Good', 'MAO Baco', 8, 'Dulangan I field assignment', '13.383800', '121.141500', 'https://images.pexels.com/photos/19030951/pexels-photo-19030951.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 2, '2800.00', '≈2.5 ha per day', '2026-09-29 00:00:00', '', '2026-09-20 12:25:44'),
  (6, 'Hand Tractor with Trailer', 2, 'MAO-TRC-003', 'Hand tractor unit for small upland plots and hauling.', 'Available', 'Fair', 'MAO Baco', 11, 'Mangangan I Barangay Hall', '13.398500', '121.123400', 'https://images.pexels.com/photos/8977227/pexels-photo-8977227.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', NULL, '1200.00', '≈0.5 ha per day', '2026-11-14 00:00:00', '', '2026-09-20 12:25:44'),
  (7, 'Axial Flow Rice Thresher', 3, 'MAO-THR-001', 'Portable axial flow thresher, 1.5 tons/hour capacity.', 'Available', 'Good', 'MAO Baco', 15, 'Sta. Rosa I Warehouse', '13.412400', '121.104800', 'https://images.pexels.com/photos/35187052/pexels-photo-35187052.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', NULL, '900.00', '1.5 tons per hour', '2026-10-21 00:00:00', '', '2026-09-20 12:25:44'),
  (8, 'Corn Sheller Unit', 3, 'MAO-THR-002', 'Motorized corn sheller for the Dulangan corn cluster.', 'Available', 'Good', 'MAO Baco', 8, 'Dulangan I Warehouse', '13.382600', '121.140200', 'https://images.pexels.com/photos/8977227/pexels-photo-8977227.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', NULL, '800.00', '1 ton per hour', '2026-11-07 00:00:00', '', '2026-09-20 12:25:44'),
  (9, 'MAO Hauling Truck (6-wheeler)', 4, 'MAO-TRK-001', 'Hauling truck for produce delivery and equipment transfer.', 'Available', 'Good', 'MAO Baco', 1, 'MAO Motorpool, Poblacion', '13.357000', '121.100400', 'https://images.pexels.com/photos/37412190/pexels-photo-37412190.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 2, '0.00', '4-ton capacity', '2026-10-10 00:00:00', '', '2026-09-20 12:25:44'),
  (10, 'Mechanical Flatbed Dryer', 5, 'MAO-PHF-001', '6-ton capacity flatbed dryer located at the MAO post-harvest facility.', 'Available', 'Excellent', 'MAO Baco', 1, 'MAO Post-Harvest Facility', '13.356600', '121.099600', 'https://images.pexels.com/photos/35187052/pexels-photo-35187052.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', NULL, '0.00', '6 tons per batch', '2026-11-19 00:00:00', '', '2026-09-20 12:25:44'),
  (11, 'Rice Mill Unit (Village Type)', 5, 'MAO-PHF-002', 'Village-type rice mill shared by accredited associations.', 'Available', 'Good', 'MAO Baco', 4, 'Baras Village Mill', '13.350900', '121.107600', 'https://images.pexels.com/photos/8977227/pexels-photo-8977227.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', NULL, '0.00', '500 kg per hour', '2026-10-28 00:00:00', '', '2026-09-20 12:25:44'),
  (12, '4-inch Irrigation Water Pump', 6, 'MAO-IRR-001', 'Diesel water pump set with 50 m hose for supplemental irrigation.', 'Available', 'Good', 'MAO Baco', 12, 'Mayabig Barangay Hall', '13.318500', '121.095800', 'https://images.pexels.com/photos/35187052/pexels-photo-35187052.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', NULL, '600.00', '4-inch discharge', '2026-10-17 00:00:00', '', '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `resources`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL DEFAULT 'Service',
  `description` text NOT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'unit',
  `quantity_total` int(11) NOT NULL DEFAULT 0,
  `quantity_available` int(11) NOT NULL DEFAULT 0,
  `availability` varchar(50) NOT NULL DEFAULT 'Available',
  `notes` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `resources` (6 rows)
INSERT INTO `resources` (`id`, `name`, `type`, `description`, `unit`, `quantity_total`, `quantity_available`, `availability`, `notes`) VALUES
  (1, 'Certified Rice Seeds (NSIC Rc222)', 'Farm Input', 'Certified inbred rice seeds distributed per approved request.', 'bag (20kg)', 400, 165, 'Available', ''),
  (2, 'Organic Fertilizer', 'Farm Input', 'Vermicast-based organic fertilizer from the MAO composting facility.', 'sack (50kg)', 600, 240, 'Available', ''),
  (3, 'Soil Testing Service', 'Service', 'Soil sampling and analysis by MAO agricultural technologists.', 'sample', 100, 74, 'Request-based', ''),
  (4, 'Agricultural Extension Assistance', 'Service', 'On-farm technical assistance and farm visit by an assigned technologist.', 'visit', 200, 158, 'Request-based', ''),
  (5, 'Solar Dryer Pavement Use', 'Facility', 'Use of the barangay solar drying pavement (scheduled by batch).', 'slot', 24, 9, 'Available', ''),
  (6, 'Knapsack Sprayer Set', 'Tool', 'Manual and motorized knapsack sprayers for borrowing.', 'unit', 30, 12, 'Available', '');

-- -----------------------------------------------------------------------------
-- Table structure for `maintenance_records`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `maintenance_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipment_id` int(11) NOT NULL,
  `service_date` date NOT NULL,
  `type` varchar(100) NOT NULL DEFAULT 'Preventive',
  `description` text NOT NULL,
  `cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `next_due` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Completed',
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `equipment_id` (`equipment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `maintenance_records` (6 rows)
INSERT INTO `maintenance_records` (`id`, `equipment_id`, `service_date`, `type`, `description`, `cost`, `next_due`, `status`, `recorded_by`, `created_at`) VALUES
  (1, 1, '2026-08-16 00:00:00', 'Preventive', 'Change of engine oil, filters and blade sharpening after 120 hours of operation.', '8500.00', '2026-10-14 00:00:00', 'Completed', 2, '2026-09-20 12:25:44'),
  (2, 3, '2026-09-16 00:00:00', 'Corrective', 'Replacement of damaged threshing drum bearing and belt. Unit temporarily unavailable.', '15200.00', '2026-09-23 00:00:00', 'In Progress', 14, '2026-09-20 12:25:44'),
  (3, 4, '2026-09-02 00:00:00', 'Preventive', 'Hydraulic fluid top-up, tire pressure and brake inspection.', '3200.00', '2026-10-05 00:00:00', 'Completed', 14, '2026-09-20 12:25:44'),
  (4, 5, '2026-07-22 00:00:00', 'Preventive', 'General tune-up before the land preparation season.', '6400.00', '2026-09-29 00:00:00', 'Completed', 2, '2026-09-20 12:25:44'),
  (5, 7, '2026-09-08 00:00:00', 'Inspection', 'Post-use inspection, no defects found.', '0.00', '2026-10-21 00:00:00', 'Completed', 3, '2026-09-20 12:25:44'),
  (6, 9, '2026-08-26 00:00:00', 'Preventive', 'LTO registration renewal and brake pad replacement.', '11800.00', '2026-10-10 00:00:00', 'Completed', 2, '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `equipment_requests`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipment_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL UNIQUE,
  `farmer_id` int(11) NOT NULL,
  `equipment_id` int(11) DEFAULT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `farm_id` int(11) DEFAULT NULL,
  `barangay_id` int(11) DEFAULT NULL,
  `service_type` varchar(100) NOT NULL DEFAULT 'Harvesting',
  `requested_start` datetime NOT NULL,
  `requested_end` datetime NOT NULL,
  `purpose` text NOT NULL,
  `crop_type` varchar(100) NOT NULL DEFAULT 'Rice',
  `area_ha` decimal(10,2) NOT NULL DEFAULT 0.00,
  `priority` varchar(50) NOT NULL DEFAULT 'Normal',
  `attachment_name` varchar(255) NOT NULL DEFAULT '',
  `notes` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Submitted',
  `review_notes` text NOT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `farmer_id` (`farmer_id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `equipment_requests` (12 rows)
INSERT INTO `equipment_requests` (`id`, `code`, `farmer_id`, `equipment_id`, `resource_id`, `farm_id`, `barangay_id`, `service_type`, `requested_start`, `requested_end`, `purpose`, `crop_type`, `area_ha`, `priority`, `attachment_name`, `notes`, `status`, `review_notes`, `reviewed_by`, `reviewed_at`, `completed_at`, `created_at`) VALUES
  (1, 'REQ-2601-0001', 1, 1, NULL, 1, 2, 'Harvesting', '2026-09-23 07:00:00', '2026-09-23 15:00:00', 'Harvesting of 2.0 ha mature rice (NSIC Rc222) before forecast rains.', 'Rice', '2.00', 'High', '', '', 'Approved', 'Approved. Operator assigned. Please prepare the access road.', 2, '2026-09-19 10:00:00', NULL, '2026-09-17 09:00:00'),
  (2, 'REQ-2601-0002', 2, 1, NULL, 3, 5, 'Harvesting', '2026-09-23 10:00:00', '2026-09-23 17:00:00', 'Harvest assistance for 2.2 ha hybrid rice.', 'Rice', '2.20', 'Normal', '', 'Requesting morning schedule if possible.', 'Under Review', '', NULL, NULL, NULL, '2026-09-19 14:00:00'),
  (3, 'REQ-2601-0003', 4, 5, NULL, 5, 8, 'Land Preparation', '2026-09-21 07:00:00', '2026-09-21 16:00:00', 'Plowing and harrowing of 4 ha corn area for the next cropping.', 'Corn', '4.00', 'Normal', '', '', 'In Progress', 'Approved and currently on-going.', 1, '2026-09-18 08:00:00', NULL, '2026-09-15 11:00:00'),
  (4, 'REQ-2601-0004', 6, 2, NULL, 7, 15, 'Harvesting', '2026-09-25 07:00:00', '2026-09-25 16:00:00', 'Harvest of 3.1 ha rice field, Sta. Rosa I cluster.', 'Rice', '3.10', 'Normal', '', '', 'Approved', 'Approved, coordinate with barangay for road access.', 2, '2026-09-19 15:00:00', NULL, '2026-09-16 08:00:00'),
  (5, 'REQ-2601-0005', 5, 7, NULL, 6, 14, 'Threshing', '2026-09-22 08:00:00', '2026-09-22 14:00:00', 'Threshing of harvested palay, approx. 6 tons.', 'Rice', '2.75', 'Normal', '', '', 'Submitted', '', NULL, NULL, NULL, '2026-09-20 07:00:00'),
  (6, 'REQ-2601-0006', 3, 6, NULL, 4, 11, 'Land Preparation', '2026-09-24 07:00:00', '2026-09-24 12:00:00', 'Land preparation for eggplant and ampalaya planting.', 'Vegetables', '1.80', 'Normal', '', '', 'Submitted', '', NULL, NULL, NULL, '2026-09-20 09:00:00'),
  (7, 'REQ-2601-0007', 1, 4, NULL, 2, 2, 'Land Preparation', '2026-09-08 07:00:00', '2026-09-08 16:00:00', 'Land preparation of 1.5 ha.', 'Rice', '1.50', 'Normal', '', '', 'Completed', 'Service completed, 1.5 ha covered.', 2, '2026-09-05 09:00:00', '2026-09-08 17:00:00', '2026-09-02 10:00:00'),
  (8, 'REQ-2601-0008', 2, 3, NULL, 3, 5, 'Harvesting', '2026-09-18 07:00:00', '2026-09-18 15:00:00', 'Harvesting request during harvester breakdown.', 'Rice', '2.20', 'High', '', '', 'Rejected', 'Rejected: unit MAO-HRV-003 is under corrective maintenance. Please re-file using MAO-HRV-001.', 1, '2026-09-18 09:00:00', NULL, '2026-09-14 16:00:00'),
  (9, 'REQ-2601-0009', 7, NULL, 1, NULL, 1, 'Farm Input', '2026-09-26 08:00:00', '2026-09-26 12:00:00', 'Request for 40 bags of certified rice seeds for BRFA members.', 'Rice', '20.00', 'High', '', '', 'Under Review', '', NULL, NULL, NULL, '2026-09-19 10:00:00'),
  (10, 'REQ-2601-0010', 6, 10, NULL, NULL, 15, 'Drying', '2026-09-27 08:00:00', '2026-09-27 18:00:00', 'Mechanical drying of 5 tons freshly harvested palay.', 'Rice', '3.10', 'Normal', '', '', 'Approved', 'Approved, batch 2 slot.', 3, '2026-09-20 08:00:00', NULL, '2026-09-18 13:00:00'),
  (11, 'REQ-2601-0011', 5, 1, NULL, 6, 14, 'Harvesting', '2026-09-29 07:00:00', '2026-09-29 15:00:00', 'Scheduled harvest, 2.75 ha.', 'Rice', '2.75', 'Normal', '', '', 'Approved', 'Approved.', 2, '2026-09-20 09:00:00', NULL, '2026-09-19 08:00:00'),
  (12, 'REQ-2601-0012', 3, 12, NULL, 4, 11, 'Irrigation Support', '2026-08-31 07:00:00', '2026-08-31 12:00:00', 'Supplemental irrigation during dry spell.', 'Vegetables', '1.80', 'Normal', '', '', 'Completed', '', 2, '2026-08-29 09:00:00', '2026-08-31 13:00:00', '2026-08-27 15:00:00');

-- -----------------------------------------------------------------------------
-- Table structure for `reservations`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) DEFAULT NULL,
  `equipment_id` int(11) NOT NULL,
  `farmer_id` int(11) DEFAULT NULL,
  `farm_id` int(11) DEFAULT NULL,
  `barangay_id` int(11) DEFAULT NULL,
  `service_type` varchar(100) NOT NULL DEFAULT 'Harvesting',
  `start_at` datetime NOT NULL,
  `end_at` datetime NOT NULL,
  `operator_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Scheduled',
  `is_harvester` tinyint(1) NOT NULL DEFAULT 0,
  `remarks` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `start_at` (`start_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `reservations` (8 rows)
INSERT INTO `reservations` (`id`, `request_id`, `equipment_id`, `farmer_id`, `farm_id`, `barangay_id`, `service_type`, `start_at`, `end_at`, `operator_id`, `status`, `is_harvester`, `remarks`, `created_at`) VALUES
  (1, 1, 1, 1, 1, 2, 'Harvesting', '2026-09-23 07:00:00', '2026-09-23 15:00:00', 1, 'Scheduled', 1, 'Bring extra fuel; field is 2 km from main road.', '2026-09-20 12:25:44'),
  (2, 3, 5, 4, 5, 8, 'Land Preparation', '2026-09-21 07:00:00', '2026-09-21 16:00:00', 2, 'In Progress', 0, 'Ongoing plowing operation.', '2026-09-20 12:25:44'),
  (3, 4, 2, 6, 7, 15, 'Harvesting', '2026-09-25 07:00:00', '2026-09-25 16:00:00', 2, 'Scheduled', 1, 'Coordinate with Sta. Rosa I barangay council.', '2026-09-20 12:25:44'),
  (4, 10, 10, 6, NULL, 15, 'Drying', '2026-09-27 08:00:00', '2026-09-27 18:00:00', NULL, 'Scheduled', 0, 'Batch 2 drying slot.', '2026-09-20 12:25:44'),
  (5, 11, 1, 5, 6, 14, 'Harvesting', '2026-09-29 07:00:00', '2026-09-29 15:00:00', 1, 'Scheduled', 1, '', '2026-09-20 12:25:44'),
  (6, 7, 4, 1, 2, 2, 'Land Preparation', '2026-09-08 07:00:00', '2026-09-08 16:00:00', 2, 'Completed', 0, 'Completed 1.5 ha.', '2026-09-20 12:25:44'),
  (7, 12, 12, 3, 4, 11, 'Irrigation Support', '2026-08-31 07:00:00', '2026-08-31 12:00:00', NULL, 'Completed', 0, '', '2026-09-20 12:25:44'),
  (8, NULL, 2, 2, 3, 5, 'Harvesting', '2026-10-02 07:00:00', '2026-10-02 15:00:00', 2, 'Scheduled', 1, 'Tentative cluster schedule.', '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `waitlist`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `waitlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) DEFAULT NULL,
  `equipment_id` int(11) DEFAULT NULL,
  `farmer_id` int(11) DEFAULT NULL,
  `preferred_date` date DEFAULT NULL,
  `note` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Waiting',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for `announcements`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'General Announcement',
  `priority` varchar(50) NOT NULL DEFAULT 'Normal',
  `audience` varchar(100) NOT NULL DEFAULT 'All Farmers',
  `barangay_id` int(11) DEFAULT NULL,
  `association_id` int(11) DEFAULT NULL,
  `attachment_name` varchar(255) NOT NULL DEFAULT '',
  `publish_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Published',
  `views` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `announcements` (8 rows)
INSERT INTO `announcements` (`id`, `title`, `body`, `category`, `priority`, `audience`, `barangay_id`, `association_id`, `attachment_name`, `publish_at`, `expires_at`, `status`, `views`, `created_by`, `created_at`) VALUES
  (1, 'Harvester Deployment Schedule for the Northern Barangay Cluster', 'The Municipal Agriculture Office announces the deployment schedule of the Kubota DC-70 and Yanmar YH700 combine harvesters for Alag, Santa Rosa I, Mangangan I and Dulangan I.\n\nFarmers with approved requests are advised to prepare field access roads and to be present during the scheduled service. Requests may still be filed through the AgriShare portal; conflicting schedules will automatically be flagged for review by MAO personnel.', 'Equipment Notice', 'Important', 'All Farmers', NULL, NULL, '', '2026-09-19 08:00:00', '2026-10-10 17:00:00', 'Published', 148, 2, '2026-09-20 12:25:44'),
  (2, 'Weather Advisory: Southwest Monsoon Enhanced by LPA', 'PAGASA reports an enhanced southwest monsoon affecting Oriental Mindoro within the next 72 hours. Moderate to heavy rains are expected.\n\nFarmers with standing mature palay are urged to coordinate with the MAO for priority harvesting assistance. Please secure harvested produce in covered storage and avoid drying palay on roadsides.', 'Weather Warning', 'Urgent', 'All Farmers', NULL, NULL, '', '2026-09-20 06:00:00', '2026-09-24 18:00:00', 'Published', 320, 1, '2026-09-20 12:25:44'),
  (3, 'Availability of Certified Rice Seeds under the Rice Competitiveness Enhancement Fund', 'Certified inbred rice seeds (NSIC Rc222, Rc160 and Rc216) are now available at the MAO warehouse for registered RSBSA farmers.\n\nAllocation: two (2) bags per hectare, maximum of six (6) bags per farmer. Bring your RSBSA ID and barangay certification.', 'Program', 'Important', 'All Farmers', NULL, NULL, '', '2026-09-17 09:00:00', '2026-10-15 17:00:00', 'Published', 210, 3, '2026-09-20 12:25:44'),
  (4, 'Barangay Alag Farmers Orientation on AgriShare Portal', 'An orientation on the use of the AgriShare resource-sharing and scheduling platform will be conducted for Barangay Alag farmers. Bring your mobile phone and RSBSA number for account registration assistance.', 'Meeting', 'Normal', 'Selected Barangay', 2, NULL, '', '2026-09-18 10:00:00', '2026-09-30 17:00:00', 'Published', 74, 2, '2026-09-20 12:25:44'),
  (5, 'Temporary Unavailability of World 504 Combine Harvester', 'Unit MAO-HRV-003 is under corrective maintenance due to a damaged threshing drum bearing. Estimated return to service is within three (3) days.\n\nAffected requests have been re-routed to available units. Farmers may check unit availability in real time through the Equipment page.', 'Equipment Notice', 'Important', 'All Farmers', NULL, NULL, '', '2026-09-16 13:00:00', '2026-09-26 17:00:00', 'Published', 96, 14, '2026-09-20 12:25:44'),
  (6, 'Agricultural Advisory: Rat Infestation Monitoring in Lowland Rice Areas', 'Field reports indicate increasing rodent activity in lowland rice areas of Bayanan and San Andres. Community-wide trapping and synchronized planting are recommended.\n\nMAO technologists are available for farm visits upon request through the Farmer Services page.', 'Agriculture Advisory', 'Normal', 'All Farmers', NULL, NULL, '', '2026-09-14 08:00:00', '2026-10-05 17:00:00', 'Published', 130, 3, '2026-09-20 12:25:44'),
  (7, 'Schedule Change: Post-Harvest Facility Drying Slots', 'Drying slots at the MAO post-harvest facility will follow a two-batch system (8:00 AM and 1:00 PM) starting next week to accommodate more farmers during peak harvest.', 'Schedule Change', 'Normal', 'All Farmers', NULL, NULL, '', '2026-09-21 08:00:00', '2026-10-20 17:00:00', 'Scheduled', 0, 2, '2026-09-20 12:25:44'),
  (8, 'Completed: Distribution of Organic Fertilizer for Vegetable Growers', 'The distribution of vermicast-based organic fertilizer for the Mangangan Vegetable Growers has been completed. Thank you to all participating farmers.', 'General Announcement', 'Normal', 'Selected Association', NULL, 3, '', '2026-08-11 09:00:00', '2026-09-10 17:00:00', 'Archived', 58, 3, '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `announcement_reads`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcement_reads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `announcement_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `announcement_id` (`announcement_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for `meetings`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `meetings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `start_at` datetime NOT NULL,
  `end_at` datetime NOT NULL,
  `venue` varchar(255) NOT NULL,
  `organizer` varchar(255) NOT NULL DEFAULT 'Municipal Agriculture Office',
  `agenda` text NOT NULL,
  `description` text NOT NULL,
  `audience` varchar(100) NOT NULL DEFAULT 'All Farmers',
  `barangay_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Upcoming',
  `minutes` text NOT NULL,
  `attachment_name` varchar(255) NOT NULL DEFAULT '',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `meetings` (5 rows)
INSERT INTO `meetings` (`id`, `title`, `start_at`, `end_at`, `venue`, `organizer`, `agenda`, `description`, `audience`, `barangay_id`, `status`, `minutes`, `attachment_name`, `created_by`, `created_at`) VALUES
  (1, 'Municipal Farmers Coordination Meeting', '2026-09-24 09:00:00', '2026-09-24 11:30:00', 'MAO Conference Room, Baco Municipal Hall', 'Municipal Agriculture Office', '1. Harvest season readiness\n2. Equipment scheduling policy\n3. AgriShare portal roll-out\n4. Other matters', 'Quarterly coordination meeting with all accredited farmers\' associations.', 'All Farmers', NULL, 'Upcoming', '', '', 1, '2026-09-20 12:25:44'),
  (2, 'Barangay Alag Irrigators Association Assembly', '2026-09-28 14:00:00', '2026-09-28 16:00:00', 'Alag Barangay Hall', 'Alag Irrigators Association', '1. Canal cleaning schedule\n2. Water distribution during dry spell\n3. Harvester queue for Alag cluster', 'Assembly of AIA members with MAO technical staff.', 'Selected Barangay', 2, 'Upcoming', '', '', 2, '2026-09-20 12:25:44'),
  (3, 'Equipment Operators Safety Briefing', '2026-09-22 08:00:00', '2026-09-22 10:00:00', 'MAO Motorpool, Poblacion', 'MAO Equipment Section', '1. Pre-operation checklist\n2. Field safety protocol\n3. Maintenance reporting through AgriShare', 'Mandatory briefing for all MAO drivers, operators and technicians.', 'Operators', NULL, 'Upcoming', '', '', 3, '2026-09-20 12:25:44'),
  (4, 'Corn Cluster Production Planning (Dulangan)', '2026-09-11 09:00:00', '2026-09-11 11:00:00', 'Dulangan I Multi-Purpose Hall', 'MAO Crop Production Section', '1. Cropping calendar\n2. Sheller scheduling\n3. Buyer linkage', 'Planning session with the Dulangan Corn Producers Group.', 'Selected Association', NULL, 'Completed', 'The group agreed on a synchronized planting window and requested two additional sheller deployment days per month. MAO committed to prioritize corn sheller requests from the cluster during the harvest peak.', '', 2, '2026-09-20 12:25:44'),
  (5, 'Municipal Agriculture and Fishery Council (MAFC) Regular Session', '2026-08-31 09:00:00', '2026-08-31 12:00:00', 'Baco Municipal Session Hall', 'MAFC Secretariat', '1. Review of agricultural programs\n2. Budget utilization\n3. Resolution on equipment sharing guidelines', 'Regular session of the municipal council on agriculture and fishery.', 'All Farmers', NULL, 'Completed', 'Resolution No. 2026-014 adopting the municipal agricultural equipment sharing guidelines was approved, including the use of a digital request and scheduling system (AgriShare).', '', 1, '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `meeting_attendance`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `meeting_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meeting_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Invited',
  `responded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `meeting_attendance` (11 rows)
INSERT INTO `meeting_attendance` (`id`, `meeting_id`, `user_id`, `status`, `responded_at`) VALUES
  (1, 1, 4, 'Confirmed', '2026-09-19 12:00:00'),
  (2, 1, 5, 'Invited', NULL),
  (3, 1, 10, 'Confirmed', '2026-09-19 15:00:00'),
  (4, 1, 9, 'Invited', NULL),
  (5, 2, 4, 'Invited', NULL),
  (6, 2, 11, 'Confirmed', '2026-09-18 09:00:00'),
  (7, 3, 12, 'Confirmed', '2026-09-19 08:00:00'),
  (8, 3, 13, 'Invited', NULL),
  (9, 3, 14, 'Confirmed', '2026-09-19 09:00:00'),
  (10, 4, 7, 'Attended', '2026-09-11 09:00:00'),
  (11, 5, 10, 'Attended', '2026-08-31 09:00:00');

-- -----------------------------------------------------------------------------
-- Table structure for `notifications`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'system',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(255) NOT NULL DEFAULT '',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `notifications` (8 rows)
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `link`, `read_at`, `created_at`) VALUES
  (1, 4, 'request', 'Request REQ-2601-0001 approved', 'Your harvesting request for Dela Cruz Rice Field A has been approved and scheduled. Operator: Danilo C. Estrada.', '/dashboard/requests', NULL, '2026-09-19 10:00:00'),
  (2, 4, 'schedule', 'Upcoming harvester schedule', 'Kubota DC-70 Combine Harvester is scheduled at your farm in 3 days, 7:00 AM.', '/dashboard/harvester', NULL, '2026-09-20 06:00:00'),
  (3, 4, 'announcement', 'Urgent weather advisory posted', 'Southwest monsoon enhanced by LPA — prepare standing crops.', '/announcements', NULL, '2026-09-20 06:10:00'),
  (4, 5, 'request', 'Request REQ-2601-0002 under review', 'A scheduling conflict was detected with REQ-2601-0001. MAO personnel are reviewing your request.', '/dashboard/requests', NULL, '2026-09-19 14:20:00'),
  (5, 2, 'request', '2 new requests awaiting review', 'REQ-2601-0005 and REQ-2601-0006 were submitted today.', '/dashboard/requests', NULL, '2026-09-20 09:05:00'),
  (6, 2, 'maintenance', 'Maintenance due in 3 days', 'MAO-HRV-003 corrective maintenance is scheduled to finish in 3 days.', '/dashboard/maintenance', NULL, '2026-09-20 07:00:00'),
  (7, 1, 'conflict', 'Scheduling conflict detected', 'REQ-2601-0002 overlaps with an existing reservation for MAO-HRV-001.', '/dashboard/harvester', NULL, '2026-09-19 14:21:00'),
  (8, 12, 'assignment', 'New field assignment', 'You are assigned to Dela Cruz Rice Field A, Barangay Alag in 3 days.', '/dashboard/assignments', NULL, '2026-09-19 10:05:00');

-- -----------------------------------------------------------------------------
-- Table structure for `programs`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `programs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `eligibility` text NOT NULL,
  `assistance_type` varchar(100) NOT NULL DEFAULT 'Input Subsidy',
  `opens_at` date DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `slots` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'Open',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `programs` (5 rows)
INSERT INTO `programs` (`id`, `title`, `description`, `eligibility`, `assistance_type`, `opens_at`, `deadline`, `slots`, `status`, `created_at`) VALUES
  (1, 'Rice Competitiveness Enhancement Fund (RCEF) Seed Distribution', 'Free certified inbred rice seeds for registered rice farmers of Baco.', 'Registered in RSBSA; actively farming rice; maximum of 3 hectares.', 'Input Subsidy', '2026-09-10 00:00:00', '2026-10-10 00:00:00', 350, 'Open', '2026-09-20 12:25:44'),
  (2, 'Farm Machinery Grant for Farmers\' Associations', 'Provision of hand tractors, threshers and shellers to accredited associations under a counterpart scheme.', 'CDA/DOLE-registered association with at least 25 active members and complete financial statements.', 'Machinery Grant', '2026-09-15 00:00:00', '2026-10-25 00:00:00', 4, 'Open', '2026-09-20 12:25:44'),
  (3, 'Corn Production Support Program', 'Hybrid corn seeds and fertilizer support for the Dulangan and Catwiran corn clusters.', 'Corn farmers with at least 0.5 ha within the identified corn clusters.', 'Input Subsidy', '2026-09-18 00:00:00', '2026-10-18 00:00:00', 120, 'Open', '2026-09-20 12:25:44'),
  (4, 'Urban and Backyard Vegetable Gardening Kits', 'Vegetable seed kits and gardening tools for households and school gardens.', 'Any Baco resident household or school with available planting area.', 'Input Subsidy', '2026-08-06 00:00:00', '2026-09-15 00:00:00', 200, 'Closed', '2026-09-20 12:25:44'),
  (5, 'Farmers\' Field School on Integrated Pest Management', 'Season-long training on integrated pest management and good agricultural practices.', 'Rice or vegetable farmers endorsed by their association or barangay.', 'Training', '2026-09-23 00:00:00', '2026-10-30 00:00:00', 40, 'Upcoming', '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `applications`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `program_id` int(11) NOT NULL,
  `farmer_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Submitted',
  `notes` text NOT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `program_id` (`program_id`),
  KEY `farmer_id` (`farmer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `applications` (6 rows)
INSERT INTO `applications` (`id`, `program_id`, `farmer_id`, `status`, `notes`, `submitted_at`) VALUES
  (1, 1, 1, 'Approved', '6 bags allocated.', '2026-09-12 10:00:00'),
  (2, 1, 2, 'Under Review', '', '2026-09-17 11:00:00'),
  (3, 1, 5, 'Submitted', '', '2026-09-19 09:00:00'),
  (4, 2, 7, 'Under Review', 'Association documents complete, pending ocular inspection.', '2026-09-16 14:00:00'),
  (5, 3, 4, 'Approved', '4 ha allocation approved.', '2026-09-18 08:00:00'),
  (6, 4, 3, 'Completed', 'Kit released.', '2026-08-21 10:00:00');

-- -----------------------------------------------------------------------------
-- Table structure for `market_prices`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `market_prices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `crop` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Cereal',
  `market` varchar(255) NOT NULL DEFAULT 'Baco Public Market',
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `price` decimal(10,2) NOT NULL,
  `previous_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_date` date NOT NULL,
  `source` varchar(255) NOT NULL DEFAULT 'MAO Baco Market Monitoring',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `market_prices` (10 rows)
INSERT INTO `market_prices` (`id`, `crop`, `category`, `market`, `unit`, `price`, `previous_price`, `price_date`, `source`, `updated_at`) VALUES
  (1, 'Palay (dry, clean)', 'Cereal', 'Baco Public Market', 'kg', '23.50', '22.80', '2026-09-20 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (2, 'Palay (fresh/wet)', 'Cereal', 'Farm gate, Baco', 'kg', '18.00', '18.50', '2026-09-20 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (3, 'Well-milled Rice', 'Cereal', 'Baco Public Market', 'kg', '48.00', '47.00', '2026-09-20 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (4, 'Yellow Corn (dry)', 'Cereal', 'Calapan Trading Post', 'kg', '17.25', '16.90', '2026-09-19 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (5, 'Eggplant', 'Vegetable', 'Baco Public Market', 'kg', '55.00', '60.00', '2026-09-20 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (6, 'Ampalaya', 'Vegetable', 'Baco Public Market', 'kg', '70.00', '65.00', '2026-09-20 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (7, 'Tomato', 'Vegetable', 'Baco Public Market', 'kg', '60.00', '72.00', '2026-09-19 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (8, 'Calamansi', 'Fruit', 'Baco Public Market', 'kg', '45.00', '45.00', '2026-09-19 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (9, 'Banana (Lakatan)', 'Fruit', 'Calapan City Market', 'kg', '62.00', '58.00', '2026-09-18 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44'),
  (10, 'Coconut (whole nut)', 'Plantation', 'Farm gate, Baco', 'piece', '12.00', '11.50', '2026-09-18 00:00:00', 'MAO Baco Market Monitoring', '2026-09-20 12:25:44');

-- -----------------------------------------------------------------------------
-- Table structure for `crop_calendar`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `crop_calendar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `crop` varchar(100) NOT NULL,
  `season` varchar(100) NOT NULL DEFAULT 'Wet Season',
  `planting_start` varchar(50) NOT NULL,
  `planting_end` varchar(50) NOT NULL,
  `harvest_start` varchar(50) NOT NULL,
  `harvest_end` varchar(50) NOT NULL,
  `duration_days` int(11) NOT NULL DEFAULT 110,
  `notes` text NOT NULL,
  `advisory` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `crop_calendar` (8 rows)
INSERT INTO `crop_calendar` (`id`, `crop`, `season`, `planting_start`, `planting_end`, `harvest_start`, `harvest_end`, `duration_days`, `notes`, `advisory`) VALUES
  (1, 'Rice (Wet Season)', 'Wet Season', 'May', 'July', 'September', 'November', 115, 'Main lowland cropping supported by rainfall and NIA irrigation.', 'Coordinate harvester bookings by August to avoid peak-season conflicts.'),
  (2, 'Rice (Dry Season)', 'Dry Season', 'November', 'January', 'March', 'May', 110, 'Requires irrigation support; highest harvester demand in April.', 'Request supplemental irrigation pumps early during El Niño advisories.'),
  (3, 'Yellow Corn', 'Wet Season', 'June', 'July', 'September', 'October', 105, 'Dulangan and Catwiran clusters.', 'Book corn sheller two weeks before target harvest date.'),
  (4, 'Eggplant', 'Year-round', 'October', 'December', 'January', 'April', 90, 'Upland vegetable areas of Mangangan.', 'Monitor fruit and shoot borer; request IPM assistance.'),
  (5, 'Ampalaya', 'Dry Season', 'November', 'January', 'January', 'April', 75, 'Trellised production.', 'Ensure water pump availability during flowering.'),
  (6, 'Tomato', 'Dry Season', 'October', 'November', 'January', 'March', 95, 'Cool months favor fruit set.', 'Avoid planting during heavy monsoon.'),
  (7, 'Banana (Lakatan)', 'Year-round', 'June', 'August', 'May', 'December', 300, 'Perennial, staggered harvest.', 'Request hauling truck assistance for bulk deliveries.'),
  (8, 'Coconut', 'Year-round', 'June', 'September', 'January', 'December', 365, 'Harvested every 45–60 days.', 'Coordinate with PCA for replanting programs.');

-- -----------------------------------------------------------------------------
-- Table structure for `weather_cache`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `weather_cache` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location` varchar(255) NOT NULL,
  `payload` json NOT NULL,
  `source` varchar(255) NOT NULL,
  `fetched_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `weather_cache` (5 rows)
INSERT INTO `weather_cache` (`id`, `location`, `payload`, `source`, `fetched_at`) VALUES
  (1, 'Baco, Oriental Mindoro', '{"daily":[{"max":29.3,"min":25.6,"code":80,"date":"2026-09-20","rain":7.2,"rainChance":100},{"max":28.6,"min":24.7,"code":95,"date":"2026-09-21","rain":5.7,"rainChance":100},{"max":28.5,"min":24.9,"code":80,"date":"2026-09-22","rain":3.1,"rainChance":100},{"max":30.8,"min":25,"code":51,"date":"2026-09-23","rain":0.9,"rainChance":97},{"max":30.6,"min":24.3,"code":51,"date":"2026-09-24","rain":0.6,"rainChance":86},{"max":30.2,"min":24.2,"code":51,"date":"2026-09-25","rain":0.6,"rainChance":79},{"max":30.2,"min":23.9,"code":1,"date":"2026-09-26","rain":0,"rainChance":81}],"current":{"code":3,"time":"2026-09-20T20:15","humidity":98,"windSpeed":2.3,"temperature":26.2,"precipitation":0}}', 'Open-Meteo Public API (api.open-meteo.com)', '2026-09-20 12:25:45'),
  (2, 'Baco, Oriental Mindoro', '{"daily":[{"max":29.3,"min":25.6,"code":95,"date":"2026-09-20","rain":6.6,"rainChance":100},{"max":28.6,"min":24.7,"code":95,"date":"2026-09-21","rain":4.7,"rainChance":100},{"max":28.5,"min":24.9,"code":53,"date":"2026-09-22","rain":1.9,"rainChance":100},{"max":30.8,"min":25,"code":53,"date":"2026-09-23","rain":1.3,"rainChance":97},{"max":30.6,"min":24.3,"code":51,"date":"2026-09-24","rain":1.6,"rainChance":86},{"max":30.2,"min":24.2,"code":95,"date":"2026-09-25","rain":2.4,"rainChance":79},{"max":30.2,"min":23.9,"code":51,"date":"2026-09-26","rain":0.3,"rainChance":81}],"current":{"code":2,"time":"2026-09-20T21:45","humidity":93,"windSpeed":4.5,"temperature":26,"precipitation":0}}', 'Open-Meteo Public API (api.open-meteo.com)', '2026-09-20 13:54:29'),
  (3, 'Baco, Oriental Mindoro', '{"daily":[{"max":30.6,"min":24.6,"code":53,"date":"2026-09-26","rain":1.3,"rainChance":100},{"max":31.1,"min":25.4,"code":51,"date":"2026-09-27","rain":0.2,"rainChance":98},{"max":30.1,"min":24.8,"code":51,"date":"2026-09-28","rain":0.1,"rainChance":78},{"max":30.7,"min":24.6,"code":51,"date":"2026-09-29","rain":0.1,"rainChance":73},{"max":31.2,"min":24.7,"code":51,"date":"2026-09-30","rain":0.3,"rainChance":67},{"max":31.2,"min":24.6,"code":51,"date":"2026-10-01","rain":0.9,"rainChance":54},{"max":31.3,"min":24.7,"code":51,"date":"2026-10-02","rain":1.2,"rainChance":65}],"current":{"code":1,"time":"2026-09-26T13:00","humidity":70,"windSpeed":3.1,"temperature":30.3,"precipitation":0}}', 'Open-Meteo Public API (api.open-meteo.com)', '2026-09-26 05:00:22'),
  (4, 'Baco, Oriental Mindoro', '{"daily":[{"max":30.6,"min":24.6,"code":53,"date":"2026-09-26","rain":1.3,"rainChance":100},{"max":31.1,"min":25.4,"code":51,"date":"2026-09-27","rain":0.2,"rainChance":98},{"max":30.1,"min":24.8,"code":51,"date":"2026-09-28","rain":0.1,"rainChance":78},{"max":30.7,"min":24.6,"code":51,"date":"2026-09-29","rain":0.1,"rainChance":73},{"max":31.2,"min":24.7,"code":51,"date":"2026-09-30","rain":0.3,"rainChance":67},{"max":31.2,"min":24.6,"code":51,"date":"2026-10-01","rain":0.9,"rainChance":54},{"max":31.3,"min":24.7,"code":51,"date":"2026-10-02","rain":1.2,"rainChance":65}],"current":{"code":51,"time":"2026-09-26T13:30","humidity":71,"windSpeed":1.6,"temperature":29.8,"precipitation":0.1}}', 'Open-Meteo Public API (api.open-meteo.com)', '2026-09-26 05:30:25'),
  (5, 'Baco, Oriental Mindoro', '{"daily":[{"max":30.6,"min":24.6,"code":53,"date":"2026-09-26","rain":1.3,"rainChance":100},{"max":31.1,"min":25.4,"code":51,"date":"2026-09-27","rain":0.2,"rainChance":98},{"max":30.1,"min":24.8,"code":51,"date":"2026-09-28","rain":0.1,"rainChance":78},{"max":30.7,"min":24.6,"code":51,"date":"2026-09-29","rain":0.1,"rainChance":73},{"max":31.2,"min":24.7,"code":51,"date":"2026-09-30","rain":0.3,"rainChance":67},{"max":31.2,"min":24.6,"code":51,"date":"2026-10-01","rain":0.9,"rainChance":54},{"max":31.3,"min":24.7,"code":51,"date":"2026-10-02","rain":1.2,"rainChance":65}],"current":{"code":51,"time":"2026-09-26T14:00","humidity":72,"windSpeed":4.9,"temperature":29.5,"precipitation":0.1}}', 'Open-Meteo Public API (api.open-meteo.com)', '2026-09-26 06:10:10');

-- -----------------------------------------------------------------------------
-- Table structure for `audit_logs`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) NOT NULL DEFAULT 'System',
  `action` varchar(100) NOT NULL,
  `module` varchar(100) NOT NULL,
  `record_id` varchar(100) NOT NULL DEFAULT '',
  `details` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `audit_logs` (10 rows)
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `action`, `module`, `record_id`, `details`, `created_at`) VALUES
  (1, 2, 'Ma. Cristina L. Fajardo', 'APPROVE', 'Equipment Requests', 'REQ-2601-0001', 'Approved harvesting request and created reservation for MAO-HRV-001.', '2026-09-19 10:00:00'),
  (2, 1, 'Engr. Ramon T. Bautista', 'REJECT', 'Equipment Requests', 'REQ-2601-0008', 'Rejected request: unit under corrective maintenance.', '2026-09-18 09:00:00'),
  (3, 14, 'Eduardo N. Lopez', 'CREATE', 'Maintenance', 'MAO-HRV-003', 'Logged corrective maintenance for threshing drum bearing.', '2026-09-16 11:00:00'),
  (4, 1, 'Engr. Ramon T. Bautista', 'UPDATE', 'Equipment', 'MAO-HRV-003', 'Status changed from Available to Under Maintenance.', '2026-09-16 11:05:00'),
  (5, 3, 'Arnel D. Manalo', 'PUBLISH', 'Announcements', 'ANN-0003', 'Published RCEF certified seed availability announcement.', '2026-09-17 09:00:00'),
  (6, 1, 'Engr. Ramon T. Bautista', 'PUBLISH', 'Announcements', 'ANN-0002', 'Published urgent weather advisory.', '2026-09-20 06:00:00'),
  (7, 2, 'Ma. Cristina L. Fajardo', 'CREATE', 'Meetings', 'MTG-0002', 'Created Barangay Alag Irrigators Association Assembly.', '2026-09-18 10:00:00'),
  (8, 2, 'Ma. Cristina L. Fajardo', 'ASSIGN', 'Scheduling', 'RES-0001', 'Assigned operator Danilo C. Estrada to reservation RES-0001.', '2026-09-19 10:02:00'),
  (9, 1, 'Engr. Ramon T. Bautista', 'CREATE', 'User Management', 'USR-0015', 'Created auditor account for COA representative.', '2026-08-21 14:00:00'),
  (10, 3, 'Arnel D. Manalo', 'UPDATE', 'Market Prices', 'MKT-DAILY', 'Updated daily market price monitoring sheet.', '2026-09-20 08:00:00');

-- -----------------------------------------------------------------------------
-- Table structure for `settings`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL UNIQUE,
  `value` text NOT NULL,
  `label` varchar(255) NOT NULL,
  `group` varchar(100) NOT NULL DEFAULT 'General',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `settings` (11 rows)
INSERT INTO `settings` (`id`, `key`, `value`, `label`, `group`) VALUES
  (1, 'office_name', 'Municipal Agriculture Office of Baco', 'Office Name', 'General'),
  (2, 'office_address', 'Baco Municipal Hall, Poblacion, Baco, Oriental Mindoro 5201', 'Office Address', 'General'),
  (3, 'office_email', 'mao.baco@oriental-mindoro.gov.ph', 'Official Email', 'General'),
  (4, 'office_hotline', '(043) 288-0123 / 0917-555-0100', 'Hotline', 'General'),
  (5, 'office_hours', 'Monday to Friday, 8:00 AM – 5:00 PM', 'Office Hours', 'General'),
  (6, 'request_lead_days', '3', 'Minimum Request Lead Time (days)', 'Scheduling'),
  (7, 'max_booking_hours', '10', 'Maximum Booking Duration (hours)', 'Scheduling'),
  (8, 'conflict_detection', 'enabled', 'Automatic Conflict Detection', 'Scheduling'),
  (9, 'weather_location', 'Baco, Oriental Mindoro (13.36°N, 121.10°E)', 'Weather Monitoring Point', 'Integrations'),
  (10, 'weather_provider', 'Open-Meteo Public API (live, server-cached)', 'Weather Data Source', 'Integrations'),
  (11, 'map_provider', 'Leaflet + OpenStreetMap', 'Map Provider', 'Integrations');

-- -----------------------------------------------------------------------------
-- Table structure for `plant_diagnoses`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `plant_diagnoses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `farmer_name` varchar(255) NOT NULL DEFAULT 'Guest Farmer',
  `barangay_id` int(11) DEFAULT NULL,
  `crop_type` varchar(100) NOT NULL,
  `disease_name` varchar(255) NOT NULL,
  `scientific_name` varchar(255) NOT NULL DEFAULT '',
  `confidence` decimal(5,2) NOT NULL DEFAULT 95.00,
  `severity` varchar(50) NOT NULL DEFAULT 'Moderate',
  `image_url` text NOT NULL,
  `symptoms` json NOT NULL,
  `causes` text NOT NULL,
  `treatments` json NOT NULL,
  `prevention` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending Review',
  `technologist_notes` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `barangay_id` (`barangay_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `plant_diagnoses` (3 rows)
INSERT INTO `plant_diagnoses` (`id`, `user_id`, `farmer_name`, `barangay_id`, `crop_type`, `disease_name`, `scientific_name`, `confidence`, `severity`, `image_url`, `symptoms`, `causes`, `treatments`, `prevention`, `status`, `technologist_notes`, `created_at`) VALUES
  (1, NULL, 'Juan P. Dela Cruz', NULL, 'Rice', 'Rice Blast', 'Pyricularia oryzae', '96.40', 'Severe', 'https://images.pexels.com/photos/35187052/pexels-photo-35187052.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', '["Diamond spindle lesions with grayish-white centers","Neck rot on panicle"]', 'High humidity and continuous cloudy rain in Alag.', '{"organic":["Foliar spray of Trichoderma harzianum bio-fungicide","Neem seed kernel extract 5%"],"chemical":["Azoxystrobin + Difenoconazole at 15ml / 16L knapsack","Tricyclazole 75% WP"],"cultural":["Split nitrogen fertilizer application","Drain stagnant water for 2 days"]}', 'Plant resistant variety NSIC Rc222.', 'Verified by MAO', 'Validated by MAO Technologist Cristina Fajardo.', '2026-09-26 07:41:39'),
  (2, NULL, 'Lorna B. Aguilar', NULL, 'Corn', 'Fall Armyworm Infestation', 'Spodoptera frugiperda', '97.80', 'Severe', 'https://images.pexels.com/photos/10893497/pexels-photo-10893497.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', '["Ragged windowpane feeding holes on young corn whorls","Heavy sawdust-like frass inside leaf funnel"]', 'Staggered corn planting in adjacent barangays.', '{"organic":["Bacillus thuringiensis (Bt) spray late afternoon","Metarhizium anisopliae application"],"chemical":["Emamectin benzoate 5% WDG directed into whorl","Chlorantraniliprole 18.5% SC"],"cultural":["Install pheromone traps","Synchronize corn planting window"]}', 'Scout corn plots every 3 days. Coordinate with Dulangan Corn Cluster.', 'Verified by MAO', 'MAO provided 2 knapsack sprayers and bio-control inputs.', '2026-09-26 07:41:39'),
  (3, NULL, 'Pedro L. Villanueva', NULL, 'Eggplant', 'Eggplant Fruit & Shoot Borer', 'Leucinodes orbonalis', '94.50', 'Moderate', 'https://images.pexels.com/photos/34632627/pexels-photo-34632627.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', '["Wilting of apical growing shoots","Bore-holes on developing eggplant fruits"]', 'High vegetable cropping density in Mangangan upland.', '{"organic":["Manual clipping and destruction of infested shoots","Neem oil spray"],"chemical":["Flubendiamide 480 SC at fruit set stage"],"cultural":["Install sex pheromone traps","Rotate with non-solanaceous crops"]}', 'Regular scouting and crop rotation.', 'Resolved', 'Resolved after pheromone trap installation.', '2026-09-26 07:41:39');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
