-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 14, 2025 at 07:37 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sangsawang_furniture`
--

CREATE DATABASE IF NOT EXISTS `sangsawang_furniture`;
USE `sangsawang_furniture`;

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL,
  `admin_username` varchar(50) NOT NULL,
  `admin_password` varchar(255) NOT NULL,
  `admin_fname` varchar(50) NOT NULL,
  `admin_lname` varchar(50) NOT NULL,
  `admin_email` varchar(100) NOT NULL,
  `admin_tel` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`admin_id`, `admin_username`, `admin_password`, `admin_fname`, `admin_lname`, `admin_email`, `admin_tel`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2a$10$0eFk/iNLKbl0tS1sYcIL4u7vEhhl51QwZVs1Z/e9IOFqTSQWbyeA.', 'Admin', 'Sangsawang', 'admin@sangsawang.com', '02-123-4567', '2025-11-06 15:23:52', '2025-11-06 15:23:52');

-- --------------------------------------------------------

--
-- Table structure for table `cart_item`
--

CREATE TABLE `cart_item` (
  `cart_item_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `pricing_type` varchar(32) NOT NULL,
  `pricing_label` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart_item`
--

INSERT INTO `cart_item` (`cart_item_id`, `customer_id`, `product_id`, `pricing_type`, `pricing_label`, `quantity`, `unit_price`, `created_at`, `updated_at`) VALUES
(5, 1, 32, 'cashPromo', 'ซื้อสด', 2, 5900.00, '2025-11-12 19:41:14', '2025-11-12 19:41:15'),
(7, 1, 11, 'cashPromo', 'ซื้อสด', 1, 4900.00, '2025-11-14 05:42:33', '2025-11-14 05:42:33'),
(8, 1, 11, 'installmentPromo', 'ซื้อผ่อน', 3, 5900.00, '2025-11-14 06:33:08', '2025-11-14 06:33:10');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(200) NOT NULL,
  `category_description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `category_name`, `category_description`) VALUES
(1, 'สำนักงาน', 'เฟอร์นิเจอร์สำหรับสำนักงานและพื้นที่ทำงาน'),
(2, 'บ้านพักอาศัย', 'เฟอร์นิเจอร์สำหรับใช้ในบ้านและที่พักอาศัย'),
(3, 'เตียงนอน', 'เตียงนอนและอุปกรณ์สำหรับห้องนอน'),
(4, 'โซฟา', 'โซฟาและเก้าอี้นั่งสำหรับห้องนั่งเล่น'),
(5, 'ชั้นวางทีวี', 'ชั้นวางทีวีและตู้โชว์สำหรับห้องนั่งเล่น'),
(6, 'โต๊ะเครื่องแป้ง', 'โต๊ะเครื่องแป้งและโต๊ะแต่งตัว'),
(7, 'ตู้เสื้อผ้า', 'ตู้เสื้อผ้าและตู้เก็บของ'),
(8, 'ฟูกนอน/ที่นอน', 'ฟูกนอนและที่นอนคุณภาพสูง'),
(9, 'ตู้โชว์', 'ตู้โชว์และตู้แสดงของตกแต่ง'),
(10, 'หิ้งพระ', 'หิ้งพระและแท่นบูชา'),
(11, 'ตู้กับข้าว', 'ตู้กับข้าวและตู้เก็บอาหาร'),
(12, 'ตู้เสื้อผ้า + โต๊ะเครื่องแป้ง (เซ็ต)', 'เซ็ตตู้เสื้อผ้าและโต๊ะเครื่องแป้ง');

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `customer_id` int(11) NOT NULL,
  `customer_username` varchar(50) NOT NULL,
  `customer_password` varchar(255) NOT NULL,
  `customer_fname` varchar(50) NOT NULL,
  `customer_lname` varchar(50) NOT NULL,
  `customer_email` varchar(100) NOT NULL,
  `customer_tel` varchar(20) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `customer_alt_addresses` text DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verification_token` varchar(255) DEFAULT NULL,
  `email_verification_expires` datetime DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `customer_username`, `customer_password`, `customer_fname`, `customer_lname`, `customer_email`, `customer_tel`, `customer_address`, `created_at`, `updated_at`, `customer_alt_addresses`, `email_verified`, `email_verification_token`, `email_verification_expires`, `password_reset_token`, `password_reset_expires`) VALUES
(1, 'customer1', '$2a$10$1p7SM1UFYHNWH42ai/KdUeVj.V.emw3WOG7ZjfDBxIGrd.H.EvseW', 'สมชาย', 'ใจดี', 'somchai@sangsawang.com', '08-123-4567', '123 ถนนสุขุมวิท กรุงเทพฯ 10110', '2025-11-06 15:23:52', '2025-11-12 14:37:59', NULL, 0, NULL, NULL, NULL, NULL),
(2, 'customer2', '$2a$10$1p7SM1UFYHNWH42ai/KdUeVj.V.emw3WOG7ZjfDBxIGrd.H.EvseW', 'สมหญิง', 'รวยมาก', 'somying@sangsawang.com', '08-765-4321', '456 ถนนพหลโยธิน กรุงเทพฯ 10400', '2025-11-06 15:23:52', '2025-11-12 14:37:59', NULL, 0, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `installment_payments`
--

CREATE TABLE `installment_payments` (
  `installment_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `installment_number` int(11) NOT NULL,
  `installment_amount` decimal(10,2) NOT NULL,
  `payment_due_date` date NOT NULL,
  `payment_status` varchar(50) DEFAULT 'pending',
  `payment_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_date` date NOT NULL,
  `order_status` varchar(50) NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `installment_periods` int(11) NOT NULL,
  `monthly_payment` decimal(10,2) NOT NULL,
  `shipping_address` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order`
--

INSERT INTO `order` (`order_id`, `customer_id`, `order_date`, `order_status`, `total_amount`, `payment_method`, `installment_periods`, `monthly_payment`, `shipping_address`) VALUES
(1, 1, '2025-11-12', 'cancelled', 246890.00, 'cash', 1, 246890.00, '{\"recipientName\":\"สมชาย\",\"recipientSurname\":\"ใจดี\",\"phone\":\"081234567\",\"address\":\"123 ถนนสุขุมวิท กรุงเทพฯ 10110\"}');

-- --------------------------------------------------------

--
-- Table structure for table `order_detail`
--

CREATE TABLE `order_detail` (
  `order_detail_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `product_description` text DEFAULT NULL,
  `product_price` decimal(10,2) NOT NULL,
  `product_stock` int(11) NOT NULL DEFAULT 0,
  `product_image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category_id` int(11) DEFAULT NULL,
  `price_cash` decimal(10,2) DEFAULT NULL,
  `price_cash_promo` decimal(10,2) DEFAULT NULL,
  `price_installment` decimal(10,2) DEFAULT NULL,
  `price_installment_promo` decimal(10,2) DEFAULT NULL,
  `product_highlights` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`product_highlights`)),
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `product_name`, `product_description`, `product_price`, `product_stock`, `product_image`, `created_at`, `updated_at`, `category_id`, `price_cash`, `price_cash_promo`, `price_installment`, `price_installment_promo`, `product_highlights`, `tags`) VALUES
(1, 'เก้าอี้ CEO หรูหรา', 'เก้าอี้บริหารระดับ CEO ทำจากหนังแท้คุณภาพสูง รองรับสรีระศาสตร์', 35000.00, 10, '[\"/images/โซฟา/532467777_755478177074795_5563060994569645827_n.jpg\",\"/images/โซฟา/532487633_755478313741448_6317967119816904744_n.jpg\",\"/images/โซฟา/532510682_755479190408027_7085474984976072956_n.jpg\",\"/images/โซฟา/532617239_755477537074859_1548190003967310270_n.jpg\"]', '2025-11-06 15:23:52', '2025-11-12 15:01:10', 1, 35000.00, 32000.00, 38000.00, 36000.00, '[\"หนังแท้เกรดพรีเมียม\",\"ปรับระดับได้ 5 จุด\",\"รับประกัน 3 ปี\"]', '[\"เก้าอี้\",\"สำนักงาน\"]'),
(2, 'โต๊ะทำงานไม้สัก', 'โต๊ะทำงานทำจากไม้สักแท้ 100% ผลิตด้วยมือจากช่างฝีมือไทย', 45000.00, 8, '[\"/images/โต๊ะเครื่องแป้ง/470481519_1340007580708887_8348065507718961374_n.jpg\",\"/images/โต๊ะเครื่องแป้ง/500328508_693421413280472_7132169144353674965_n.jpg\"]', '2025-11-06 15:23:52', '2025-11-12 15:01:10', 1, 45000.00, NULL, 48000.00, NULL, '[\"ไม้สักแท้ทั้งแผ่น\",\"เคลือบกันน้ำ\",\"ลิ้นชักซ่อนสายไฟ\"]', '[\"โต๊ะ\",\"งานไม้\"]'),
(3, 'ตู้เสื้อผ้า 5 บาน', 'ตู้เสื้อผ้าสีขาวหน้ารีด 5 บาน พื้นที่เก็บของกว้าง พร้อมกระจกบานใหญ่', 28000.00, 15, '[\"/images/ตู้เสื้อผ้า/470145725_1340007697375542_2153803416669839161_n.jpg\",\"/images/ตู้เสื้อผ้า/470169286_1340008067375505_2650488405659220088_n.jpg\",\"/images/ตู้เสื้อผ้า/470196538_1340007647375547_1448735763485967469_n.jpg\",\"/images/ตู้เสื้อผ้า/532498991_755475737075039_7611176461905116368_n.jpg\"]', '2025-11-06 15:23:52', '2025-11-12 15:15:05', 7, 28000.00, NULL, 30000.00, NULL, '[\"ราวแขวนสแตนเลส 2 ชั้น\",\"ชั้นวางของปรับระดับ\",\"กระจกเต็มบานกลาง\"]', '[\"ตู้เสื้อผ้า\",\"จัดเก็บ\"]'),
(4, 'โซฟาหนังแท้ 3 ที่นั่ง', 'โซฟาหนังสีน้ำตาล 3 ที่นั่ง พื้นที่กว้างขวาง นั่งสบาย', 55000.00, 12, '[\"/images/โซฟา/532467777_755478177074795_5563060994569645827_n.jpg\",\"/images/โซฟา/532487633_755478313741448_6317967119816904744_n.jpg\",\"/images/โซฟา/532510682_755479190408027_7085474984976072956_n.jpg\",\"/images/โซฟา/532617239_755477537074859_1548190003967310270_n.jpg\"]', '2025-11-06 15:23:52', '2025-11-12 15:15:05', 4, 55000.00, 52000.00, 60000.00, 57000.00, '[\"หนังวัวแท้ทั้งใบ\",\"โครงไม้เนื้อแข็ง\",\"รองรับได้สูงสุด 350 กก.\"]', '[\"โซฟา\",\"ห้องนั่งเล่น\"]'),
(6, 'โต๊ะกลางไม้โอ๊ค', 'โต๊ะกลางขนาด 120 ซม. สำหรับห้องนั่งเล่น เคลือบกันรอยขีดข่วน', 0.00, 0, '[\"/images/โต๊ะเครื่องแป้ง/470481519_1340007580708887_8348065507718961374_n.jpg\",\"/images/โต๊ะเครื่องแป้ง/500328508_693421413280472_7132169144353674965_n.jpg\"]', '2025-11-12 14:48:51', '2025-11-12 15:01:10', 2, 18500.00, NULL, 19800.00, NULL, '[\"ไม้โอ๊คแท้\", \"เคลือบกันน้ำ\", \"น้ำหนักเบาเคลื่อนย้ายง่าย\"]', '[\"โต๊ะ\", \"ห้องนั่งเล่น\"]'),
(8, 'ชั้นวางทีวีไม้สีขาว', 'มีประตูกระจก2ข้าง\nลิ้นชัก 3 ตัว', 0.00, 0, '/images/ชั้นวางทีวี/ชั้นวางทีวี000.jpg', '2025-11-12 15:05:21', '2025-11-12 15:37:42', 5, 20000.00, NULL, NULL, NULL, '[]', '[\"ชั้นวางทีวี\"]'),
(11, 'ชั้นวางทีวี 3 ชั้น แบบแขวน', 'ชั้นวางทีวี 3 ชั้น แบบแขวนผนัง ประหยัดพื้นที่ เหมาะสำหรับห้องขนาดเล็ก', 0.00, 0, '[\"/images/ชั้นวางทีวี/ชั้นวางทีวี008.jpg\",\"/images/ชั้นวางทีวี/ชั้นวางทีวี009.jpg\",\"/images/ชั้นวางทีวี/ชั้นวางทีวี010.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 5, 5500.00, 4900.00, 6500.00, 5900.00, '[\"แบบแขวนประหยัดพื้นที่\",\"ติดตั้งง่าย\",\"รองรับน้ำหนักดี\",\"ดีไซน์เรียบง่าย\"]', '[\"ชั้นวางทีวี\"]'),
(12, 'ชั้นวางทีวี 6 ชั้น พร้อมตู้เก็บของ', 'ชั้นวางทีวี 6 ชั้นพร้อมตู้เก็บของด้านล่าง จุของได้เยอะ ใช้งานสะดวก', 0.00, 0, '[\"/images/ชั้นวางทีวี/ชั้นวางทีวี011.jpg\",\"/images/ชั้นวางทีวี/ชั้นวางทีวี012.jpg\",\"/images/ชั้นวางทีวี/ชั้นวางทีวี013.jpg\",\"/images/ชั้นวางทีวี/ชั้นวางทีวี014.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 5, 15000.00, 13500.00, 17000.00, 15500.00, '[\"6 ชั้น + ตู้เก็บของ\",\"จุของได้เยอะ\",\"ดีไซน์สวยงาม\",\"คุณภาพสูง\"]', '[\"ชั้นวางทีวี\"]'),
(15, 'โซฟาหนังแท้ 2+1 ที่นั่ง', 'โซฟาหนังแท้ 2+1 ที่นั่ง พร้อมเก้าอี้แยก ดีไซน์สวยงาม นั่งสบาย', 0.00, 0, '[\"/images/โซฟา/533067303_755479407074672_2108742994701862251_n.jpg\",\"/images/โซฟา/533079728_755479377074675_1309675682671213937_n.jpg\",\"/images/โซฟา/533130431_755477817074831_3319588098584254917_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 4, 32000.00, 29000.00, 36000.00, 33000.00, '[\"ชุดโซฟา 2+1\",\"หนังแท้คุณภาพสูง\",\"นั่งสบาย\",\"ดีไซน์สวยงาม\"]', '[\"โซฟา\"]'),
(16, 'โซฟาไม้สัก 3 ที่นั่ง', 'โซฟาไม้สัก 3 ที่นั่ง พร้อมเบาะนั่งสบาย ดีไซน์คลาสสิก เหมาะสำหรับห้องนั่งเล่น', 0.00, 0, '[\"/images/โซฟา/533289245_755478490408097_8369782019503238314_n.jpg\",\"/images/โซฟา/533484649_755478423741437_571759288273111877_n.jpg\",\"/images/โซฟา/533488065_755477853741494_6307307288933942693_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 4, 18000.00, 16000.00, 21000.00, 19000.00, '[\"ไม้สักแท้\",\"เบาะนั่งสบาย\",\"ดีไซน์คลาสสิก\",\"ทนทาน\"]', '[\"โซฟา\"]'),
(17, 'โซฟาโค้ง 4 ที่นั่ง', 'โซฟาโค้ง 4 ที่นั่ง ดีไซน์โมเดิร์น นั่งสบาย เหมาะสำหรับห้องนั่งเล่นขนาดใหญ่', 0.00, 0, '[\"/images/โซฟา/533742581_755478103741469_2568124521183562965_n.jpg\",\"/images/โซฟา/533948573_755479453741334_358985813184744199_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 4, 35000.00, 32000.00, 39000.00, 36000.00, '[\"โซฟาโค้ง 4 ที่นั่ง\",\"นั่งสบาย\",\"ดีไซน์โมเดิร์น\",\"คุณภาพสูง\"]', '[\"โซฟา\"]'),
(20, 'ตู้เสื้อผ้า 5 บาน ', 'ตู้เสื้อผ้า 5 บาน ทำจาก จุเสื้อผ้าได้เยอะ มีระแนงแขวนผ้า', 0.00, 0, '[\"/images/532606156_755475667075046_8687318870573676900_n.jpg\",\"/images/ตู้เสื้อผ้า/470169286_1340008067375505_2650488405659220088_n.jpg\",\"/images/ตู้เสื้อผ้า/470196538_1340007647375547_1448735763485967469_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 16:09:55', 7, 28000.00, 25000.00, 32000.00, 29000.00, '[\"5 บาน\",\"จุเสื้อผ้าได้เยอะ\",\"มีระแนงแขวนผ้า\"]', '[\"ตู้เสื้อผ้า\"]'),
(21, 'ตู้เสื้อผ้า 4 บาน พร้อมกระจก', 'ตู้เสื้อผ้า 4 บาน พร้อมกระจก ดีไซน์สวยงาม ใช้งานสะดวก', 0.00, 0, '[\"/images/ตู้เสื้อผ้า/532498991_755475737075039_7611176461905116368_n.jpg\",\"/images/ตู้เสื้อผ้า/532606156_755475667075046_8687318870573676900_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 7, 24000.00, 22000.00, 27000.00, 25000.00, '[\"4 บาน\",\"มีกระจก\",\"ดีไซน์สวยงาม\",\"ใช้งานสะดวก\"]', '[\"ตู้เสื้อผ้า\"]'),
(22, 'ตู้เสื้อผ้า 6 บาน แบบสูง', 'ตู้เสื้อผ้า 6 บาน แบบสูง จุเสื้อผ้าได้เยอะมาก เหมาะสำหรับห้องนอนขนาดใหญ่', 0.00, 0, '[\"/images/ตู้เสื้อผ้า/533155572_755475593741720_8556778935977969861_n.jpg\",\"/images/ตู้เสื้อผ้า/533166789_755475697075043_6932633184305003945_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 7, 35000.00, 32000.00, 39000.00, 36000.00, '[\"6 บาน\",\"แบบสูง\",\"จุเสื้อผ้าได้เยอะ\",\"คุณภาพสูง\"]', '[\"ตู้เสื้อผ้า\"]'),
(23, 'โต๊ะเครื่องแป้ง ไม้สัก พร้อมกระจก', 'โต๊ะเครื่องแป้ง ไม้สัก พร้อมกระจก ดีไซน์สวยงาม เหมาะสำหรับห้องนอน', 0.00, 0, '[\"/images/โต๊ะเครื่องแป้ง/470481519_1340007580708887_8348065507718961374_n.jpg\",\"/images/โต๊ะเครื่องแป้ง/500328508_693421413280472_7132169144353674965_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 6, 8500.00, 7500.00, 9500.00, 8500.00, '[\"ไม้สักแท้\",\"มีกระจก\",\"ดีไซน์สวยงาม\",\"ใช้งานสะดวก\"]', '[\"โต๊ะเครื่องแป้ง\"]'),
(24, 'เซ็ตตู้เสื้อผ้า + โต๊ะเครื่องแป้ง', 'เซ็ตตู้เสื้อผ้า + โต๊ะเครื่องแป้ง ดีไซน์เข้ากัน ไม้สักแท้ คุณภาพสูง', 0.00, 0, '[\"/images/เซ็ต(ตู้เสื้อผ้า+โต๊ะเครื่องแป้ง)/470137872_1340007660708879_5378345004137986165_n.jpg\",\"/images/เซ็ต(ตู้เสื้อผ้า+โต๊ะเครื่องแป้ง)/504726616_702210915734855_3721012233829444368_n.jpg\",\"/images/เซ็ต(ตู้เสื้อผ้า+โต๊ะเครื่องแป้ง)/504807606_702211062401507_7400162802669165228_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 12, 35000.00, 32000.00, 39000.00, 36000.00, '[\"เซ็ตตู้เสื้อผ้า + โต๊ะเครื่องแป้ง\",\"ไม้สักแท้\",\"ดีไซน์เข้ากัน\",\"คุณภาพสูง\"]', '[\"ตู้เสื้อผ้า + โต๊ะเครื่องแป้ง (เซ็ต)\"]'),
(25, 'เซ็ตตู้เสื้อผ้า + โต๊ะเครื่องแป้ง พร้อมกระจก', 'เซ็ตตู้เสื้อผ้า + โต๊ะเครื่องแป้ง พร้อมกระจก ดีไซน์สวยงาม ใช้งานสะดวก', 0.00, 0, '[\"/images/เซ็ต(ตู้เสื้อผ้า+โต๊ะเครื่องแป้ง)/504825672_702211025734844_8385283034607899920_n.jpg\",\"/images/เซ็ต(ตู้เสื้อผ้า+โต๊ะเครื่องแป้ง)/504952094_702210995734847_3349277752656922426_n.jpg\",\"/images/เซ็ต(ตู้เสื้อผ้า+โต๊ะเครื่องแป้ง)/505054693_702210952401518_2354118781236786181_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 12, 38000.00, 35000.00, 42000.00, 39000.00, '[\"เซ็ตพร้อมกระจก\",\"ดีไซน์สวยงาม\",\"ไม้สักแท้\",\"ใช้งานสะดวก\"]', '[\"ตู้เสื้อผ้า + โต๊ะเครื่องแป้ง (เซ็ต)\"]'),
(26, 'ตู้โชว์ 3 ชั้น ไม้สัก', 'ตู้โชว์ 3 ชั้น ไม้สัก ดีไซน์สวยงาม เหมาะสำหรับแสดงของตกแต่ง', 0.00, 0, '[\"/images/ตู้โชว์/470176783_1340007544042224_7217264071920822377_n.jpg\",\"/images/ตู้โชว์/470186901_1340008060708839_1116742180263621542_n.jpg\",\"/images/ตู้โชว์/470206321_1340008094042169_3002049694231011769_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 9, 12000.00, 11000.00, 13500.00, 12500.00, '[\"ไม้สักแท้\",\"3 ชั้น\",\"ดีไซน์สวยงาม\",\"เหมาะสำหรับแสดงของตกแต่ง\"]', '[\"ตู้โชว์\"]'),
(27, 'ตู้กับข้าว ไม้สัก 4 ชั้น', 'ตู้กับข้าว ไม้สัก 4 ชั้น จุของได้เยอะ ใช้งานสะดวก เหมาะสำหรับห้องครัว', 0.00, 0, '/images/ตู้กับข้าว/470241173_1340007680708877_7248500554360607986_n.jpg', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 11, 9500.00, 8500.00, 11000.00, 10000.00, '[\"ไม้สักแท้\",\"4 ชั้น\",\"จุของได้เยอะ\",\"ใช้งานสะดวก\"]', '[\"ตู้กับข้าว\"]'),
(28, 'หิ้งพระ ไม้สัก 3 ชั้น', 'หิ้งพระ ไม้สัก 3 ชั้น ดีไซน์สวยงาม เหมาะสำหรับตั้งพระในบ้าน', 0.00, 0, '[\"/images/หิ้งพระ/504679672_702210455734901_1807811510338530256_n.jpg\",\"/images/หิ้งพระ/504796264_702210369068243_7935261268138154552_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 10, 6500.00, 5900.00, 7500.00, 6900.00, '[\"ไม้สักแท้\",\"3 ชั้น\",\"ดีไซน์สวยงาม\",\"เหมาะสำหรับตั้งพระ\"]', '[\"หิ้งพระ\"]'),
(29, 'หิ้งพระ ไม้สัก 5 ชั้น', 'หิ้งพระ ไม้สัก 5 ชั้น ดีไซน์สวยงาม จุพระได้เยอะ', 0.00, 0, '[\"/images/หิ้งพระ/504960712_702210419068238_3339692166990212473_n.jpg\",\"/images/หิ้งพระ/505092126_702210325734914_5625310244093492026_n.jpg\",\"/images/หิ้งพระ/511321754_713674661255147_8252590881737923476_n.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 10, 8500.00, 7500.00, 9500.00, 8500.00, '[\"ไม้สักแท้\",\"5 ชั้น\",\"จุพระได้เยอะ\",\"ดีไซน์สวยงาม\"]', '[\"หิ้งพระ\"]'),
(30, 'ฟูกนอน 6 ฟุต ฟองน้ำ', 'ฟูกนอน 6 ฟุต ทำจากฟองน้ำคุณภาพสูง นอนสบาย รองรับสรีระ', 0.00, 0, '[\"/images/ฟูกนอน/0c148028-b9d6-4ff2-a7ce-3b590876ac39.jpg\",\"/images/ฟูกนอน/144823fc-4844-4ccf-8c70-e5deb8280d11.jpg\",\"/images/ฟูกนอน/18b38104-f4cc-4008-8c11-732c248e79bb.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 8, 8500.00, 7500.00, 9500.00, 8500.00, '[\"ฟองน้ำคุณภาพสูง\",\"ขนาด 6 ฟุต\",\"นอนสบาย\",\"รองรับสรีระ\"]', '[\"ฟูกนอน/ที่นอน\"]'),
(31, 'ฟูกนอน 6 ฟุต สปริง', 'ฟูกนอน 6 ฟุต สปริงคุณภาพสูง นอนสบาย ทนทาน', 0.00, 0, '[\"/images/ฟูกนอน/199286ff-f155-4613-8c8e-439f8f409def.jpg\",\"/images/ฟูกนอน/1a4e6cd2-f34d-4acb-9191-34ce13b6e800.jpg\",\"/images/ฟูกนอน/2cde5ab1-ecc6-4f9c-83e7-f7f4d27aff16.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 8, 12000.00, 11000.00, 13500.00, 12500.00, '[\"สปริงคุณภาพสูง\",\"ขนาด 6 ฟุต\",\"นอนสบาย\",\"ทนทาน\"]', '[\"ฟูกนอน/ที่นอน\"]'),
(32, 'ฟูกนอน 5 ฟุต ฟองน้ำ', 'ฟูกนอน 5 ฟุต ทำจากฟองน้ำคุณภาพสูง เหมาะสำหรับห้องนอนขนาดเล็ก', 0.00, 0, '[\"/images/ฟูกนอน/6038b850-789e-49c7-b43a-0096c7165445.jpg\",\"/images/ฟูกนอน/6de46d7f-6b6c-49e9-888a-04b28bec4737.jpg\",\"/images/ฟูกนอน/785be53e-3b5a-45f0-8774-7a5e5b8e5285.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 8, 6500.00, 5900.00, 7500.00, 6900.00, '[\"ฟองน้ำคุณภาพสูง\",\"ขนาด 5 ฟุต\",\"นอนสบาย\",\"เหมาะสำหรับห้องนอนขนาดเล็ก\"]', '[\"ฟูกนอน/ที่นอน\"]'),
(33, 'ฟูกนอน King Size ฟองน้ำ', 'ฟูกนอน King Size ทำจากฟองน้ำคุณภาพสูง นอนสบาย เหมาะสำหรับคู่รัก', 0.00, 0, '[\"/images/ฟูกนอน/7c3cbea2-aab9-4cfb-8a6a-f69a1596e484.jpg\",\"/images/ฟูกนอน/91a2a52f-a9b8-4e13-89b8-137694cdc983.jpg\",\"/images/ฟูกนอน/a4816de7-5f46-4f30-b21e-446eb5cfa0b3.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 8, 15000.00, 13500.00, 17000.00, 15500.00, '[\"ฟองน้ำคุณภาพสูง\",\"ขนาด King Size\",\"นอนสบาย\",\"เหมาะสำหรับคู่รัก\"]', '[\"ฟูกนอน/ที่นอน\"]'),
(34, 'ฟูกนอน Queen Size สปริง', 'ฟูกนอน Queen Size สปริงคุณภาพสูง นอนสบาย ทนทาน', 0.00, 0, '[\"/images/ฟูกนอน/aed64240-b80f-4d58-828e-50c8e336f629.jpg\",\"/images/ฟูกนอน/b199cca3-e143-400e-9e6a-cee72450bbf9.jpg\",\"/images/ฟูกนอน/bbe0f2fb-d338-4408-825c-23fb47743f5a.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 8, 13000.00, 12000.00, 14500.00, 13500.00, '[\"สปริงคุณภาพสูง\",\"ขนาด Queen Size\",\"นอนสบาย\",\"ทนทาน\"]', '[\"ฟูกนอน/ที่นอน\"]'),
(35, 'ฟูกนอน 6 ฟุต ฟองน้ำพิเศษ', 'ฟูกนอน 6 ฟุต ฟองน้ำพิเศษ นอนสบาย รองรับสรีระดีเยี่ยม', 0.00, 0, '[\"/images/ฟูกนอน/d7f697d4-500a-408e-957f-d5680b453c77.jpg\",\"/images/ฟูกนอน/dc67c33a-e29a-4e04-ac56-1ea6db19de10.jpg\",\"/images/ฟูกนอน/f721de74-4da9-4081-a7ba-cf2c1ad60cda.jpg\"]', '2025-11-12 15:14:09', '2025-11-12 15:15:05', 8, 11000.00, 9900.00, 12500.00, 11500.00, '[\"ฟองน้ำพิเศษ\",\"ขนาด 6 ฟุต\",\"นอนสบาย\",\"รองรับสรีระดีเยี่ยม\"]', '[\"ฟูกนอน/ที่นอน\"]'),
(41, 'เตียงนอน 6 ฟุตสีไม้', 'เตียงนอนขนาด 6 ฟุต ทำจากไม้สักแท้คุณภาพสูง ดีไซน์โมเดิร์น เรียบหรู ทนทาน แข็งแรง พร้อมหัวเตียงสวยงาม เหมาะสำหรับห้องนอนทุกสไตล์', 0.00, 0, '[\"/images/เตียงนอน/537909707_764179556204657_8884610700763867807_n.jpg\",\"/images/เตียงนอน/537909707_764179556204657_8884610700763867807_n.jpg\",\"/images/เตียงนอน/537909707_764179556204657_8884610700763867807_n.jpg\",\"/images/เตียงนอน/537909707_764179556204657_8884610700763867807_n.jpg\"]', '2025-11-12 16:02:56', '2025-11-12 16:07:25', 3, 25000.00, 22000.00, 28000.00, 25000.00, '[\"ไม้สักแท้คุณภาพสูง\",\"ขนาด 6 ฟุต\",\"ดีไซน์โมเดิร์นเรียบหรู\",\"หัวเตียงสวยงาม\",\"แข็งแรงทนทาน\"]', '[\"เตียงนอน\"]'),
(42, 'เตียงนอน 5 ฟุต', 'เตียงนอนขนาด 5 ฟุต ทำจากไม้โอ๊คคุณภาพสูง ดีไซน์คลาสสิก สวยงาม ใช้งานสะดวก แข็งแรง ทนทาน เหมาะสำหรับห้องนอนขนาดเล็ก', 0.00, 0, '[\"/images/เตียงนอน/538061180_764179446204668_2337783818620409913_n.jpg\",\"/images/เตียงนอน/538061180_764179446204668_2337783818620409913_n.jpg\",\"/images/เตียงนอน/538061180_764179446204668_2337783818620409913_n.jpg\",\"/images/เตียงนอน/538061180_764179446204668_2337783818620409913_n.jpg\"]', '2025-11-12 16:02:56', '2025-11-12 16:07:12', 3, 22000.00, 19000.00, 25000.00, 22000.00, '[\"ไม้โอ๊คคุณภาพสูง\",\"ขนาด 5 ฟุต\",\"ดีไซน์คลาสสิก\",\"ใช้งานสะดวก\",\"เหมาะสำหรับห้องนอนขนาดเล็ก\"]', '[\"เตียงนอน\"]'),
(43, 'เตียงนอน 6 ฟุต ', 'เตียงนอนขนาด 6 ฟุต แบบไม่มีหัวเตียง ทำจากไม้คุณภาพสูง ดีไซน์เรียบง่าย สะอาดตา ใช้งานสะดวก เหมาะสำหรับห้องนอนสไตล์มินิมอล', 0.00, 0, '[\"/images/เตียงนอน/538293666_764178386204774_8874850852933323502_n.jpg\",\"/images/เตียงนอน/538293666_764178386204774_8874850852933323502_n.jpg\",\"/images/เตียงนอน/538293666_764178386204774_8874850852933323502_n.jpg\",\"/images/เตียงนอน/538293666_764178386204774_8874850852933323502_n.jpg\"]', '2025-11-12 16:02:56', '2025-11-12 16:07:04', 3, 18000.00, NULL, 20000.00, NULL, '[\"ไม้คุณภาพสูง\",\"ขนาด 6 ฟุต\",\"ดีไซน์เรียบง่าย\",\"เหมาะสำหรับห้องนอนสไตล์มินิมอล\",\"ราคาประหยัด\"]', '[\"เตียงนอน\"]'),
(44, 'เตียงนอน 5 ฟุต แบบมีหัวเตียง', 'เตียงนอนขนาด 5 ฟุต แบบมีหัวเตียง ทำจากไม้สักแท้ หัวเตียงสวยงาม ดีไซน์โมเดิร์น ใช้งานสะดวก แข็งแรง ทนทาน เหมาะสำหรับห้องนอนทุกสไตล์', 0.00, 0, '[\"/images/เตียงนอน/539413130_764179352871344_1449733920269793689_n.jpg\",\"/images/เตียงนอน/539413130_764179352871344_1449733920269793689_n.jpg\",\"/images/เตียงนอน/539413130_764179352871344_1449733920269793689_n.jpg\",\"/images/เตียงนอน/539413130_764179352871344_1449733920269793689_n.jpg\"]', '2025-11-12 16:02:56', '2025-11-12 16:06:26', 3, 23000.00, 20000.00, 26000.00, 23000.00, '[\"ไม้สักแท้\",\"ขนาด 5 ฟุต\",\"หัวเตียงสวยงาม\",\"ดีไซน์โมเดิร์น\",\"แข็งแรงทนทาน\"]', '[\"เตียงนอน\"]');

-- --------------------------------------------------------

--
-- Table structure for table `product_tag`
--

CREATE TABLE `product_tag` (
  `product_id` int(11) NOT NULL,
  `tag` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_tag`
--

INSERT INTO `product_tag` (`product_id`, `tag`) VALUES
(1, 'สำนักงาน'),
(1, 'เก้าอี้'),
(2, 'งานไม้'),
(2, 'โต๊ะ'),
(3, 'จัดเก็บ'),
(3, 'ตู้เสื้อผ้า'),
(4, 'ห้องนั่งเล่น'),
(4, 'โซฟา'),
(6, 'ห้องนั่งเล่น'),
(6, 'โต๊ะ'),
(8, 'ชั้นวางทีวี'),
(11, 'ชั้นวางทีวี'),
(12, 'ชั้นวางทีวี'),
(15, 'โซฟา'),
(16, 'โซฟา'),
(17, 'โซฟา'),
(20, 'ตู้เสื้อผ้า'),
(21, 'ตู้เสื้อผ้า'),
(22, 'ตู้เสื้อผ้า'),
(23, 'โต๊ะเครื่องแป้ง'),
(24, 'ตู้เสื้อผ้า + โต๊ะเครื่องแป้ง (เซ็ต)'),
(25, 'ตู้เสื้อผ้า + โต๊ะเครื่องแป้ง (เซ็ต)'),
(26, 'ตู้โชว์'),
(27, 'ตู้กับข้าว'),
(28, 'หิ้งพระ'),
(29, 'หิ้งพระ'),
(30, 'ฟูกนอน/ที่นอน'),
(31, 'ฟูกนอน/ที่นอน'),
(32, 'ฟูกนอน/ที่นอน'),
(33, 'ฟูกนอน/ที่นอน'),
(34, 'ฟูกนอน/ที่นอน'),
(35, 'ฟูกนอน/ที่นอน'),
(41, 'เตียงนอน'),
(42, 'เตียงนอน'),
(43, 'เตียงนอน'),
(44, 'เตียงนอน');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `admin_username` (`admin_username`),
  ADD UNIQUE KEY `admin_email` (`admin_email`);

--
-- Indexes for table `cart_item`
--
ALTER TABLE `cart_item`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD UNIQUE KEY `unique_cart_item` (`customer_id`,`product_id`,`pricing_type`),
  ADD KEY `fk_cart_item_product` (`product_id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `customer_username` (`customer_username`),
  ADD UNIQUE KEY `customer_email` (`customer_email`);

--
-- Indexes for table `installment_payments`
--
ALTER TABLE `installment_payments`
  ADD PRIMARY KEY (`installment_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `idx_payment_due_date` (`payment_due_date`),
  ADD KEY `idx_payment_status` (`payment_status`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `idx_order_date` (`order_date`),
  ADD KEY `idx_order_status` (`order_status`);

--
-- Indexes for table `order_detail`
--
ALTER TABLE `order_detail`
  ADD PRIMARY KEY (`order_detail_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `product_tag`
--
ALTER TABLE `product_tag`
  ADD PRIMARY KEY (`product_id`,`tag`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cart_item`
--
ALTER TABLE `cart_item`
  MODIFY `cart_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `installment_payments`
--
ALTER TABLE `installment_payments`
  MODIFY `installment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order`
--
ALTER TABLE `order`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_detail`
--
ALTER TABLE `order_detail`
  MODIFY `order_detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_item`
--
ALTER TABLE `cart_item`
  ADD CONSTRAINT `fk_cart_item_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_item_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `installment_payments`
--
ALTER TABLE `installment_payments`
  ADD CONSTRAINT `installment_payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `order_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE;

--
-- Constraints for table `order_detail`
--
ALTER TABLE `order_detail`
  ADD CONSTRAINT `order_detail_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_detail_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `product_tag`
--
ALTER TABLE `product_tag`
  ADD CONSTRAINT `product_tag_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
