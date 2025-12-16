-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: sigap_ti_db
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kode_satker` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_satker` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_barang` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_barang` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nup` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kondisi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Baik',
  `merek` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ruangan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serial_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pengguna` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assets_kode_barang_index` (`kode_barang`),
  KEY `assets_nup_index` (`nup`),
  KEY `assets_kode_barang_nup_index` (`kode_barang`,`nup`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES (1,NULL,NULL,'123','iphone','1','Baik','Iphone','1',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_index` (`user_id`),
  KEY `audit_logs_action_index` (`action`),
  KEY `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,5,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 02:56:36','2025-12-14 02:56:36'),(2,5,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 02:56:36','2025-12-14 02:56:36'),(3,2,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 03:00:57','2025-12-14 03:00:57'),(4,2,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 03:00:58','2025-12-14 03:00:58'),(5,5,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 03:01:31','2025-12-14 03:01:31'),(6,5,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 03:01:32','2025-12-14 03:01:32'),(7,5,'TICKET_CREATED','Ticket created: Z-20251214-001 (test)','127.0.0.1','2025-12-14 03:02:02','2025-12-14 03:02:02'),(8,5,'LOGIN_FAILED','Failed login attempt','127.0.0.1','2025-12-14 03:04:08','2025-12-14 03:04:08'),(9,5,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 03:04:12','2025-12-14 03:04:12'),(10,5,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 03:04:12','2025-12-14 03:04:12'),(11,5,'TICKET_CREATED','Ticket created: Z-20251214-002 (test)','127.0.0.1','2025-12-14 03:10:21','2025-12-14 03:10:21'),(12,5,'TICKET_CREATED','Ticket created: Z-20251214-003 (test)','127.0.0.1','2025-12-14 03:10:29','2025-12-14 03:10:29'),(13,5,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 03:11:26','2025-12-14 03:11:26'),(14,5,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 03:11:26','2025-12-14 03:11:26'),(15,5,'TICKET_CREATED','Ticket created: Z-20251214-004 (test)','127.0.0.1','2025-12-14 03:11:45','2025-12-14 03:11:45'),(16,5,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 03:22:47','2025-12-14 03:22:47'),(17,5,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 03:22:48','2025-12-14 03:22:48'),(18,5,'TICKET_CREATED','Ticket created: Z-20251214-005 (test)','127.0.0.1','2025-12-14 03:23:09','2025-12-14 03:23:09'),(19,5,'TICKET_CREATED','Ticket created: Z-20251214-006 (test)','127.0.0.1','2025-12-14 03:23:14','2025-12-14 03:23:14'),(20,5,'TICKET_CREATED','Ticket created: T-20251214-001 (booting)','127.0.0.1','2025-12-14 03:26:31','2025-12-14 03:26:31'),(21,5,'TICKET_CREATED','Ticket created: Z-20251214-007 (123)','127.0.0.1','2025-12-14 03:26:56','2025-12-14 03:26:56'),(22,3,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 03:28:15','2025-12-14 03:28:15'),(23,3,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 03:28:16','2025-12-14 03:28:16'),(24,2,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 03:28:24','2025-12-14 03:28:24'),(25,2,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 03:28:25','2025-12-14 03:28:25'),(26,4,'LOGIN_SUCCESS','User logged in','127.0.0.1','2025-12-14 03:28:37','2025-12-14 03:28:37'),(27,4,'LOGIN_SUCCESS','User logged in successfully','N/A','2025-12-14 03:28:37','2025-12-14 03:28:37'),(28,2,'ZOOM_REJECTED','Zoom booking Z-20251214-006 rejected: tidak bisa','127.0.0.1','2025-12-14 03:30:30','2025-12-14 03:30:30'),(29,2,'ZOOM_REJECTED','Zoom booking Z-20251214-005 rejected: test','127.0.0.1','2025-12-14 03:31:22','2025-12-14 03:31:22'),(30,2,'ZOOM_APPROVED','Zoom booking Z-20251214-007 approved with account Slot Zoom 1','127.0.0.1','2025-12-14 03:31:37','2025-12-14 03:31:37'),(31,2,'TICKET_ASSIGNED','Ticket T-20251214-001 assigned to Teknisi','127.0.0.1','2025-12-14 03:31:55','2025-12-14 03:31:55'),(32,2,'CREATE_COMMENT','Comment created on ticket #T-20251214-001','127.0.0.1','2025-12-14 03:32:03','2025-12-14 03:32:03'),(33,4,'TICKET_STATUS_UPDATED','Ticket T-20251214-001 status changed to in_progress','127.0.0.1','2025-12-14 03:32:54','2025-12-14 03:32:54'),(34,4,'DIAGNOSIS_CREATED','Diagnosis for ticket T-20251214-001','127.0.0.1','2025-12-14 03:32:55','2025-12-14 03:32:55'),(35,4,'TICKET_STATUS_UPDATED','Ticket T-20251214-001 status changed to waiting_for_submitter','127.0.0.1','2025-12-14 03:32:57','2025-12-14 03:32:57');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `parent_comment_id` bigint unsigned DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comments_user_id_foreign` (`user_id`),
  KEY `comments_ticket_id_index` (`ticket_id`),
  KEY `comments_created_at_index` (`created_at`),
  KEY `comments_parent_comment_id_index` (`parent_comment_id`),
  CONSTRAINT `comments_parent_comment_id_foreign` FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,7,2,NULL,'hai','admin_layanan','2025-12-14 03:32:03','2025-12-14 03:32:03');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2025_11_18_000003_create_audit_logs_table',1),(5,'2025_11_18_000004_add_profile_fields_to_users_table',1),(6,'2025_11_18_071027_create_personal_access_tokens_table',1),(7,'2025_11_18_140000_update_user_role_to_pegawai',1),(8,'2025_11_18_150000_create_assets_table',1),(9,'2025_11_18_155000_create_categories_table',1),(10,'2025_11_18_160000_create_tickets_table',1),(11,'2025_11_18_160719_make_category_id_nullable_in_tickets_table',1),(12,'2025_11_18_160725_make_category_id_nullable_in_tickets_table',1),(13,'2025_11_18_165000_normalize_database_schema',1),(14,'2025_11_18_170000_create_timelines_table',1),(15,'2025_11_18_180000_create_work_orders_table',1),(16,'2025_11_18_185000_add_work_order_id_to_timelines',1),(17,'2025_11_18_190000_create_inventory_table',1),(18,'2025_11_18_192000_create_inventory_movements_table',1),(19,'2025_11_18_202000_create_notifications_table',1),(20,'2025_11_19_064052_create_zoom_accounts_table',1),(21,'2025_11_19_064335_add_zoom_account_id_to_tickets_table',1),(22,'2025_11_19_100000_fix_user_roles_data',1),(23,'2025_11_19_100001_drop_deprecated_role_column',1),(24,'2025_11_20_000000_create_comments_table',1),(25,'2025_11_20_100000_add_parent_comment_to_comments_table',1),(26,'2025_11_20_200000_drop_inventory_tables',1),(27,'2025_11_21_034318_add_zoom_attachments_to_tickets_table',1),(28,'2025_11_22_000000_add_attachments_to_tickets_table',1),(29,'2025_11_22_000000_add_rejection_reason_to_tickets',1),(30,'2025_11_22_103238_add_new_status_values_to_tickets_table',1),(31,'2025_11_22_105314_create_ticket_diagnoses_table',1),(32,'2025_11_22_105336_update_work_orders_add_license_type',1),(33,'2025_11_22_113933_add_license_fields_to_work_orders_table',1),(34,'2025_11_22_124502_remove_received_fields_from_work_orders_table',1),(35,'2025_11_23_034000_update_existing_zoom_tickets_duration',1),(36,'2025_11_23_111533_add_unique_work_order_to_kartu_kendali_entries',1),(37,'2025_11_23_113837_add_license_fields_to_kartu_kendali_entries',1),(38,'2025_11_23_120000_create_kartu_kendali_tables',1),(39,'2025_11_24_043458_add_vendor_contact_description_to_kartu_kendali_entries',1),(40,'2025_11_24_045005_fix_in_repair_status_to_in_progress',1),(41,'2025_11_25_000000_update_kartu_kendali_tables_simplified',1),(42,'2025_11_25_000001_comprehensive_kartu_kendali_setup',1),(43,'2025_11_25_add_estimasi_hari_to_ticket_diagnoses_table',1),(44,'2025_11_26_010710_add_work_orders_ready_to_tickets_table',1),(45,'2025_11_26_update_tickets_status_enum_simplified',1),(46,'2025_11_27_075957_recreate_assets_table_for_bmn_structure',1),(47,'2025_11_27_090000_rename_asset_fields_in_tickets_table',1),(48,'2025_11_30_120708_add_soft_deletes_to_zoom_accounts_table',1),(49,'2025_12_01_000001_simplify_work_orders_and_kartu_kendali',1),(50,'2025_12_01_100000_drop_kartu_kendali_tables',1),(51,'2025_12_06_090429_add_role_to_users_table',1),(52,'2025_12_09_100000_create_ticket_feedbacks_table',1),(53,'2025_12_09_add_asset_condition_to_ticket_diagnoses',1),(54,'2025_12_10_080628_add_asset_condition_change_to_work_orders_table',1),(55,'2025_12_10_083627_remove_unsuccessful_reason_from_work_orders_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','success','warning','error') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `reference_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `action_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_is_read_created_at_index` (`user_id`,`is_read`,`created_at`),
  KEY `notifications_user_id_type_index` (`user_id`,`type`),
  KEY `notifications_type_index` (`type`),
  KEY `notifications_is_read_index` (`is_read`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'Tiket Zoom Baru','#Z-20251214-001 - test','info','ticket',1,NULL,1,'2025-12-14 03:33:17',NULL,'2025-12-14 03:02:02','2025-12-14 03:33:17'),(2,2,'Tiket Zoom Baru','#Z-20251214-002 - test','info','ticket',2,NULL,1,'2025-12-14 03:33:17',NULL,'2025-12-14 03:10:21','2025-12-14 03:33:17'),(3,2,'Tiket Zoom Baru','#Z-20251214-003 - test','info','ticket',3,NULL,1,'2025-12-14 03:33:17',NULL,'2025-12-14 03:10:29','2025-12-14 03:33:17'),(4,2,'Tiket Zoom Baru','#Z-20251214-004 - test','info','ticket',4,NULL,1,'2025-12-14 03:33:17',NULL,'2025-12-14 03:11:45','2025-12-14 03:33:17'),(5,2,'Tiket Zoom Baru','#Z-20251214-005 - test','info','ticket',5,NULL,1,'2025-12-14 03:33:17',NULL,'2025-12-14 03:23:09','2025-12-14 03:33:17'),(6,2,'Tiket Zoom Baru','#Z-20251214-006 - test','info','ticket',6,NULL,1,'2025-12-14 03:33:17',NULL,'2025-12-14 03:23:14','2025-12-14 03:33:17'),(7,2,'Tiket Perbaikan Baru','#T-20251214-001 - booting','info','ticket',7,NULL,1,'2025-12-14 03:33:17',NULL,'2025-12-14 03:26:31','2025-12-14 03:33:17'),(8,2,'Tiket Zoom Baru','#Z-20251214-007 - 123','info','ticket',8,NULL,1,'2025-12-14 03:33:17',NULL,'2025-12-14 03:26:56','2025-12-14 03:33:17'),(9,5,'Zoom Ditolak','#Z-20251214-006: tidak bisa','error','ticket',6,NULL,0,NULL,NULL,'2025-12-14 03:30:30','2025-12-14 03:30:30'),(10,5,'Zoom Ditolak','#Z-20251214-005: test','error','ticket',5,NULL,0,NULL,NULL,'2025-12-14 03:31:22','2025-12-14 03:31:22'),(11,5,'Zoom Disetujui','#Z-20251214-007 meeting siap digunakan','success','ticket',8,NULL,0,NULL,NULL,'2025-12-14 03:31:37','2025-12-14 03:31:37'),(12,4,'Tugas Baru','#T-20251214-001 ditugaskan kepada Anda','info','ticket',7,NULL,0,NULL,NULL,'2025-12-14 03:31:55','2025-12-14 03:31:55'),(13,5,'Tiket Ditangani','#T-20251214-001 sudah ditugaskan ke teknisi','info','ticket',7,NULL,0,NULL,NULL,'2025-12-14 03:31:55','2025-12-14 03:31:55'),(14,5,'Komentar Baru','#T-20251214-001 ada komentar baru','info','ticket',7,NULL,0,NULL,NULL,'2025-12-14 03:32:03','2025-12-14 03:32:03'),(15,4,'Komentar Baru','#T-20251214-001 ada komentar baru','info','ticket',7,NULL,0,NULL,NULL,'2025-12-14 03:32:03','2025-12-14 03:32:03'),(16,5,'Update Tiket','#T-20251214-001 sedang dikerjakan','info','ticket',7,NULL,0,NULL,NULL,'2025-12-14 03:32:54','2025-12-14 03:32:54'),(17,5,'Diagnosis Selesai','#T-20251214-001: dapat diperbaiki langsung','info','ticket',7,NULL,0,NULL,NULL,'2025-12-14 03:32:55','2025-12-14 03:32:55'),(18,5,'Update Tiket','#T-20251214-001 menunggu konfirmasi Anda','info','ticket',7,NULL,0,NULL,NULL,'2025-12-14 03:32:57','2025-12-14 03:32:57');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',5,'auth_token','bf14a7e33381042e7dad58a098a6b9ef953b682a5fac6284d5a675f3358b5c42','[\"*\"]','2025-12-14 03:00:37',NULL,'2025-12-14 02:56:36','2025-12-14 03:00:37'),(2,'App\\Models\\User',2,'auth_token','dff3f84453c382e9c7a6d05cbc9f9cbd47a860f74927017b4d7fc11c36c09f9b','[\"*\"]','2025-12-14 03:01:18',NULL,'2025-12-14 03:00:57','2025-12-14 03:01:18'),(3,'App\\Models\\User',5,'auth_token','e5c2d95266315e8f93ed53a1e14309cb87d925697482ebacaced8cc8dc3a6d4a','[\"*\"]','2025-12-14 03:03:33',NULL,'2025-12-14 03:01:31','2025-12-14 03:03:33'),(4,'App\\Models\\User',5,'auth_token','192d383b81ce858eab0bbc1e2d144c45849fee48a155dd969b5994d5a76b1e46','[\"*\"]','2025-12-14 03:11:13',NULL,'2025-12-14 03:04:12','2025-12-14 03:11:13'),(5,'App\\Models\\User',5,'auth_token','3ae4f3b9dd57bc5c6c93e7374dd59064cd9a6e0e96292053e9d7e56c6978cd96','[\"*\"]','2025-12-14 03:33:43',NULL,'2025-12-14 03:11:26','2025-12-14 03:33:43'),(6,'App\\Models\\User',5,'auth_token','5c486c6829bf8893729975f3d78ec1a0faf11cecbd8a5a3bcb3590c1b1033652','[\"*\"]','2025-12-14 03:33:32',NULL,'2025-12-14 03:22:47','2025-12-14 03:33:32'),(7,'App\\Models\\User',3,'auth_token','8b3324cdd6333cb2f93744ce683c8a3210906254c1b87a6f2988846bb334313c','[\"*\"]','2025-12-14 03:33:17',NULL,'2025-12-14 03:28:15','2025-12-14 03:33:17'),(8,'App\\Models\\User',2,'auth_token','317675334a91d7c76b6717764759cb913d711e96cd9d5204026f6a07a9c081c5','[\"*\"]','2025-12-14 03:33:24',NULL,'2025-12-14 03:28:24','2025-12-14 03:33:24'),(9,'App\\Models\\User',4,'auth_token','62f59064a17a33bc15a54bb7ec7473cd99f59d2186c9710b2652187ae8767319','[\"*\"]','2025-12-14 03:33:38',NULL,'2025-12-14 03:28:36','2025-12-14 03:33:38');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_diagnoses`
--

DROP TABLE IF EXISTS `ticket_diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_diagnoses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint unsigned NOT NULL,
  `technician_id` bigint unsigned NOT NULL,
  `problem_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `problem_category` enum('hardware','software','lainnya') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `repair_type` enum('direct_repair','need_sparepart','need_vendor','need_license','unrepairable') COLLATE utf8mb4_unicode_ci NOT NULL,
  `repair_description` text COLLATE utf8mb4_unicode_ci,
  `unrepairable_reason` text COLLATE utf8mb4_unicode_ci,
  `alternative_solution` text COLLATE utf8mb4_unicode_ci,
  `technician_notes` text COLLATE utf8mb4_unicode_ci,
  `estimasi_hari` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asset_condition_change` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ticket_diagnoses_ticket_id_foreign` (`ticket_id`),
  KEY `ticket_diagnoses_technician_id_foreign` (`technician_id`),
  CONSTRAINT `ticket_diagnoses_technician_id_foreign` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ticket_diagnoses_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_diagnoses`
--

LOCK TABLES `ticket_diagnoses` WRITE;
/*!40000 ALTER TABLE `ticket_diagnoses` DISABLE KEYS */;
INSERT INTO `ticket_diagnoses` VALUES (1,7,4,'asdf','hardware','direct_repair','asdf',NULL,NULL,'asdf3','3',NULL,'2025-12-14 03:32:55','2025-12-14 03:32:55');
/*!40000 ALTER TABLE `ticket_diagnoses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_feedbacks`
--

DROP TABLE IF EXISTS `ticket_feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_feedbacks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `rating` int NOT NULL COMMENT 'Rating 1-5',
  `feedback_text` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_feedbacks_ticket_id_unique` (`ticket_id`),
  KEY `ticket_feedbacks_user_id_foreign` (`user_id`),
  KEY `ticket_feedbacks_ticket_id_user_id_index` (`ticket_id`,`user_id`),
  CONSTRAINT `ticket_feedbacks_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_feedbacks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_feedbacks`
--

LOCK TABLES `ticket_feedbacks` WRITE;
/*!40000 ALTER TABLE `ticket_feedbacks` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('perbaikan','zoom_meeting') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `kode_barang` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nup` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asset_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `severity` enum('low','normal','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `final_problem_type` enum('hardware','software','lainnya') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `repairable` tinyint(1) DEFAULT NULL,
  `unrepairable_reason` text COLLATE utf8mb4_unicode_ci,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `work_order_id` bigint unsigned DEFAULT NULL,
  `zoom_date` date DEFAULT NULL,
  `zoom_start_time` time DEFAULT NULL,
  `zoom_end_time` time DEFAULT NULL,
  `zoom_duration` int DEFAULT NULL,
  `zoom_estimated_participants` int NOT NULL DEFAULT '0',
  `zoom_co_hosts` json DEFAULT NULL,
  `zoom_breakout_rooms` int NOT NULL DEFAULT '0',
  `zoom_meeting_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoom_meeting_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoom_passcode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoom_rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `zoom_account_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoom_attachments` json DEFAULT NULL,
  `form_data` json DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `status` enum('pending_review','submitted','assigned','in_progress','on_hold','waiting_for_submitter','closed','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `work_orders_ready` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Flag untuk menandai work order sudah siap dilanjutkan',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tickets_ticket_number_unique` (`ticket_number`),
  KEY `tickets_user_id_foreign` (`user_id`),
  KEY `tickets_assigned_to_foreign` (`assigned_to`),
  KEY `tickets_work_order_id_foreign` (`work_order_id`),
  KEY `tickets_zoom_account_id_index` (`zoom_account_id`),
  CONSTRAINT `tickets_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tickets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tickets_work_order_id_foreign` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (1,'Z-20251214-001','zoom_meeting','test','teasf',5,NULL,NULL,NULL,NULL,'normal',NULL,NULL,NULL,NULL,NULL,'2025-12-14','18:01:00','19:01:00',60,15,'[]',0,NULL,NULL,NULL,NULL,'1','[]',NULL,NULL,'pending_review','2025-12-14 03:02:02','2025-12-14 03:02:02',0),(2,'Z-20251214-002','zoom_meeting','test','tasdflkj',5,NULL,NULL,NULL,NULL,'normal',NULL,NULL,NULL,NULL,NULL,'2025-12-23','08:00:00','21:00:00',780,16,'[]',0,NULL,NULL,NULL,NULL,'1','[]',NULL,NULL,'pending_review','2025-12-14 03:10:21','2025-12-14 03:10:21',0),(3,'Z-20251214-003','zoom_meeting','test','tasdflkj',5,NULL,NULL,NULL,NULL,'normal',NULL,NULL,NULL,NULL,NULL,'2025-12-23','08:00:00','21:00:00',780,16,'[]',0,NULL,NULL,NULL,NULL,'1','[]',NULL,NULL,'pending_review','2025-12-14 03:10:29','2025-12-14 03:10:29',0),(4,'Z-20251214-004','zoom_meeting','test','abcde',5,NULL,NULL,NULL,NULL,'normal',NULL,NULL,NULL,NULL,NULL,'2025-12-15','17:00:00','18:00:00',60,15,'[]',0,NULL,NULL,NULL,NULL,'1','[]',NULL,NULL,'pending_review','2025-12-14 03:11:45','2025-12-14 03:11:45',0),(5,'Z-20251214-005','zoom_meeting','test','1234',5,NULL,NULL,NULL,NULL,'normal',NULL,NULL,NULL,NULL,NULL,'2025-12-15','14:10:00','15:10:00',60,15,'[]',0,NULL,NULL,NULL,'test','1','[]',NULL,NULL,'rejected','2025-12-14 03:23:09','2025-12-14 03:31:21',0),(6,'Z-20251214-006','zoom_meeting','test','1234',5,NULL,NULL,NULL,NULL,'normal',NULL,NULL,NULL,NULL,NULL,'2025-12-15','14:10:00','15:10:00',60,15,'[]',0,NULL,NULL,NULL,'tidak bisa','1','[]',NULL,NULL,'rejected','2025-12-14 03:23:14','2025-12-14 03:30:30',0),(7,'T-20251214-001','perbaikan','booting','test',5,4,'123','1','1','critical',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','waiting_for_submitter','2025-12-14 03:26:31','2025-12-14 03:32:57',0),(8,'Z-20251214-007','zoom_meeting','123','1',5,NULL,NULL,NULL,NULL,'normal',NULL,NULL,NULL,NULL,NULL,'2025-12-15','15:00:00','16:00:00',60,15,'[]',0,'https://zoom.us/j/testtestt124','708297224','132456',NULL,'1','[]',NULL,NULL,'approved','2025-12-14 03:26:56','2025-12-14 03:31:37',0);
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timelines`
--

DROP TABLE IF EXISTS `timelines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timelines` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `work_order_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `timelines_ticket_id_foreign` (`ticket_id`),
  KEY `timelines_user_id_foreign` (`user_id`),
  KEY `timelines_work_order_id_foreign` (`work_order_id`),
  CONSTRAINT `timelines_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `timelines_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `timelines_work_order_id_foreign` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timelines`
--

LOCK TABLES `timelines` WRITE;
/*!40000 ALTER TABLE `timelines` DISABLE KEYS */;
INSERT INTO `timelines` VALUES (1,1,5,'ticket_created','Ticket created: test',NULL,'2025-12-14 03:02:02','2025-12-14 03:02:02',NULL),(2,2,5,'ticket_created','Ticket created: test',NULL,'2025-12-14 03:10:21','2025-12-14 03:10:21',NULL),(3,3,5,'ticket_created','Ticket created: test',NULL,'2025-12-14 03:10:29','2025-12-14 03:10:29',NULL),(4,4,5,'ticket_created','Ticket created: test',NULL,'2025-12-14 03:11:45','2025-12-14 03:11:45',NULL),(5,5,5,'ticket_created','Ticket created: test',NULL,'2025-12-14 03:23:09','2025-12-14 03:23:09',NULL),(6,6,5,'ticket_created','Ticket created: test',NULL,'2025-12-14 03:23:14','2025-12-14 03:23:14',NULL),(7,7,5,'ticket_created','Ticket created: booting',NULL,'2025-12-14 03:26:31','2025-12-14 03:26:31',NULL),(8,8,5,'ticket_created','Ticket created: 123',NULL,'2025-12-14 03:26:56','2025-12-14 03:26:56',NULL),(9,6,2,'status_changed','Status changed from \'pending_review\' to \'rejected\'','{\"new_status\": \"rejected\", \"old_status\": \"pending_review\"}','2025-12-14 03:30:30','2025-12-14 03:30:30',NULL),(10,5,2,'status_changed','Status changed from \'pending_review\' to \'rejected\'','{\"new_status\": \"rejected\", \"old_status\": \"pending_review\"}','2025-12-14 03:31:21','2025-12-14 03:31:21',NULL),(11,8,2,'zoom_approved','Zoom booking approved',NULL,'2025-12-14 03:31:37','2025-12-14 03:31:37',NULL),(12,7,2,'assigned','Ticket assigned to Teknisi','{\"assigned_to_id\": \"4\", \"assigned_to_name\": \"Teknisi\"}','2025-12-14 03:31:55','2025-12-14 03:31:55',NULL),(13,7,2,'status_changed','Status changed from \'submitted\' to \'assigned\'','{\"new_status\": \"assigned\", \"old_status\": \"submitted\"}','2025-12-14 03:31:55','2025-12-14 03:31:55',NULL),(14,7,4,'STATUS_UPDATED','Status changed to in_progress',NULL,'2025-12-14 03:32:54','2025-12-14 03:32:54',NULL),(15,7,4,'DIAGNOSIS_CREATED','Diagnosis completed: Bisa diperbaiki langsung',NULL,'2025-12-14 03:32:55','2025-12-14 03:32:55',NULL),(16,7,4,'STATUS_UPDATED','Status changed to waiting_for_submitter',NULL,'2025-12-14 03:32:57','2025-12-14 03:32:57',NULL);
/*!40000 ALTER TABLE `timelines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jabatan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_kerja` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roles` json DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pegawai',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `failed_login_attempts` int unsigned NOT NULL DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','superadmin@example.com',NULL,'$2y$12$JOZWA93fCB441MhFsUAB..1Jglu2PatXjsQKvwEwj1RuG8EkJZ91S',NULL,'199001011990101001','Kepala Sistem IT','IT & Sistem','081234567890',NULL,'[\"super_admin\"]','super_admin',1,0,NULL,'2025-12-14 02:51:19','2025-12-14 02:51:19'),(2,'Admin Layanan','admin.layanan@example.com',NULL,'$2y$12$UEIID3/YftygVJe/ViG1F.b9IClUubSHZyij.NK8ctloJEge6J45m',NULL,'199102021991021001','Admin Layanan','Bagian Layanan','081234567891',NULL,'[\"admin_layanan\"]','admin_layanan',1,0,NULL,'2025-12-14 02:51:19','2025-12-14 02:51:19'),(3,'Admin Penyedia','admin.penyedia@example.com',NULL,'$2y$12$08fp.qQfBZ/E6z0ILA1Y6Oys6Pcjj7HF5buvz20.Idj7BpkQc7QJW',NULL,'199103031991031001','Admin Penyedia','Bagian Penyedia','081234567892',NULL,'[\"admin_penyedia\"]','admin_penyedia',1,0,NULL,'2025-12-14 02:51:19','2025-12-14 02:51:19'),(4,'Teknisi','teknisi@example.com',NULL,'$2y$12$BtEvwqIl3Sj7ujQcNnou0.x2RsilB/GO3kycD96JSH31KN22Nij06',NULL,'199104041991041001','Teknisi Maintenance','IT & Sistem','081234567893',NULL,'[\"teknisi\"]','teknisi',1,0,NULL,'2025-12-14 02:51:19','2025-12-14 02:51:19'),(5,'Pegawai Biasa','pegawai@example.com',NULL,'$2y$12$BTSKi/pEHyXPkURNB.Dzq.yw8TrT1.xkmqRlt8zgnkUfOZyp0H3A.',NULL,'199105051991051001','Pegawai Statistik','Statistik Produksi','081234567894',NULL,'[\"pegawai\"]','pegawai',1,0,NULL,'2025-12-14 02:51:19','2025-12-14 03:04:12'),(6,'Multi Role User','multirole@example.com',NULL,'$2y$12$gZR8VbpwNkpUnEUIfzN4yeMJO7gabAChawW0uwhTibZvsxM.BHSd2',NULL,'199106061991061001','Admin Penyedia & Teknisi','IT & Penyedia','081234567895',NULL,'[\"admin_penyedia\", \"teknisi\"]','admin_penyedia',1,0,NULL,'2025-12-14 02:51:19','2025-12-14 02:51:19');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint unsigned NOT NULL,
  `ticket_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('sparepart','vendor','license') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('requested','in_procurement','completed','unsuccessful') COLLATE utf8mb4_unicode_ci DEFAULT 'requested',
  `created_by` bigint unsigned NOT NULL,
  `items` json DEFAULT NULL,
  `vendor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_description` text COLLATE utf8mb4_unicode_ci,
  `license_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_description` text COLLATE utf8mb4_unicode_ci,
  `completion_notes` text COLLATE utf8mb4_unicode_ci,
  `completed_at` datetime DEFAULT NULL,
  `failure_reason` text COLLATE utf8mb4_unicode_ci,
  `asset_condition_change` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `work_orders_ticket_id_foreign` (`ticket_id`),
  KEY `work_orders_created_by_foreign` (`created_by`),
  CONSTRAINT `work_orders_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `work_orders_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_orders`
--

LOCK TABLES `work_orders` WRITE;
/*!40000 ALTER TABLE `work_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zoom_accounts`
--

DROP TABLE IF EXISTS `zoom_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zoom_accounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `account_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `host_key` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plan_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pro',
  `max_participants` int NOT NULL DEFAULT '100',
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blue',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `zoom_accounts_account_id_unique` (`account_id`),
  UNIQUE KEY `zoom_accounts_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zoom_accounts`
--

LOCK TABLES `zoom_accounts` WRITE;
/*!40000 ALTER TABLE `zoom_accounts` DISABLE KEYS */;
INSERT INTO `zoom_accounts` VALUES (1,'zoom1765706468754','Slot Zoom 1','zoom1@bps-ntb.go.id','123456','Pro',100,'Slot baru - silakan atur kredensial akun Zoom yang sudah ada','blue',1,'2025-12-14 03:01:15','2025-12-14 03:01:18',NULL);
/*!40000 ALTER TABLE `zoom_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sigap_ti_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-14 17:50:15
