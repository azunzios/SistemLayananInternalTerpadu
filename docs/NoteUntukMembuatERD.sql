-- =====================================================================
--  BPS NTB - Layanan Internal (Ticketing + WO + Kartu Kendali + Zoom)
--  MySQL 8+ | InnoDB | utf8mb4_unicode_ci
--  FINAL - SIAP DIGUNAKAN
--  DIBUAT UNTUK KEPERLUAN DOKUMENTASI SAJA DAN MEMBUAT ERD, JANGAN DI EXECUTE
-- =====================================================================

/* 0) DATABASE */
CREATE DATABASE IF NOT EXISTS layanan_internal_bpsntb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE layanan_internal_bpsntb;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =====================================================================
-- 1) HAPUS SKEMA LAMA (AMAN) - URUTAN TERGANTUNG FK
-- =====================================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS v_asset_repair_history;

DROP TABLE IF EXISTS
  chat_messages,
  chat_participants,
  chat_threads,
  asset_control_card_entry_spareparts,
  asset_control_card_entries,
  asset_control_cards,
  work_order_spareparts,
  work_orders,
  ticket_attachments,
  ticket_diagnoses,
  zoom_bookings,
  zoom_accounts,
  notifications,
  audit_logs,
  tickets,
  assets_bmn,
  bmn_master,
  user_roles,
  users,
  roles,
  units;

-- (Bersih-bersih tabel lama yang mungkin ada)
DROP TABLE IF EXISTS zoom_licenses;
DROP TABLE IF EXISTS zoom_types;
DROP TABLE IF EXISTS sla_plans;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 2) RBAC & ORGANISASI
-- =====================================================================
CREATE TABLE roles (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE TABLE units (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  unit_id CHAR(36) NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  status ENUM('active','suspended') DEFAULT 'active',
  avatar_url VARCHAR(255),
  created_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE TABLE user_roles (
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =====================================================================
-- 3) BMN MASTER (read-only) & ASET OPERASIONAL
-- =====================================================================
CREATE TABLE bmn_master (
  id CHAR(36) PRIMARY KEY,
  kode_barang VARCHAR(20) NOT NULL,
  nup VARCHAR(20) NOT NULL,
  nama_barang VARCHAR(150) NOT NULL,
  merk VARCHAR(100),
  tipe_barang VARCHAR(100),
  ruangan VARCHAR(150),
  kondisi VARCHAR(50),
  status_operasional VARCHAR(50),
  sisa_umur_semester INT,
  UNIQUE (kode_barang, nup)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_bmn_master_kb_nup ON bmn_master (kode_barang, nup);

CREATE TABLE assets_bmn (
  id CHAR(36) PRIMARY KEY,
  bmn_master_id CHAR(36) NULL,
  kode_barang VARCHAR(20) NOT NULL,
  nup VARCHAR(20) NOT NULL,
  nama_barang VARCHAR(150) NOT NULL,
  merk VARCHAR(100),
  tipe_barang VARCHAR(100),
  lokasi VARCHAR(150),
  status_operasional VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (kode_barang, nup),
  CONSTRAINT fk_assets_bmn_master FOREIGN KEY (bmn_master_id) REFERENCES bmn_master(id) ON DELETE SET NULL
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_assets_bmn_kb_nup ON assets_bmn (kode_barang, nup);

-- =====================================================================
-- 4) TICKETS (repair & zoom) + ATTACHMENTS + DIAGNOSES
--   * Tanpa PRIORITY & SLA sesuai keputusan akhir
-- =====================================================================
CREATE TABLE tickets (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('repair','zoom') NOT NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,

  status ENUM(
    'Submitted','Assigned','In Progress','On Hold',
    'Resolved','Waiting for User','Closed','Closed Unrepairable'
  ) DEFAULT 'Submitted',

  requester_id CHAR(36) NOT NULL,
  assignee_id CHAR(36) NULL,
  provider_admin_id CHAR(36) NULL,

  -- khusus repair (WAJIB oleh pegawai)
  kode_barang VARCHAR(20) NULL,
  nup VARCHAR(20) NULL,
  location VARCHAR(150) NULL,
  merk_snapshot VARCHAR(100) NULL,
  final_problem_type ENUM('hardware','software','lainnya') DEFAULT NULL,
  repairable BOOLEAN DEFAULT TRUE,
  unrepairable_reason VARCHAR(255),
  asset_id CHAR(36) NULL,

  -- timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  closed_at DATETIME NULL,

  CONSTRAINT fk_tickets_requester FOREIGN KEY (requester_id) REFERENCES users(id),
  CONSTRAINT fk_tickets_assignee FOREIGN KEY (assignee_id) REFERENCES users(id),
  CONSTRAINT fk_tickets_provider FOREIGN KEY (provider_admin_id) REFERENCES users(id),
  CONSTRAINT fk_tickets_asset FOREIGN KEY (asset_id) REFERENCES assets_bmn(id)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_tickets_type_status ON tickets(type, status);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_asset ON tickets(asset_id);

CREATE TABLE ticket_attachments (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  mime_type VARCHAR(100),
  size_bytes INT,
  uploaded_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attach_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- Diagnosa teknisi (riwayat)
CREATE TABLE ticket_diagnoses (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  technician_id CHAR(36) NOT NULL,

  inspection_note TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  condition_level ENUM('normal','ringan','sedang','berat') DEFAULT 'ringan',

  final_problem_type ENUM('hardware','software','lainnya') NOT NULL,
  problem_note TEXT NULL,

  can_repair_directly BOOLEAN DEFAULT FALSE,
  repair_action TEXT NULL,
  repair_result ENUM('berhasil','masih_bermasalah') NULL,

  next_action ENUM('sparepart','vendor','license','none') DEFAULT 'none',
  next_action_note TEXT NULL,

  repairable BOOLEAN DEFAULT TRUE,
  unrepairable_reason TEXT NULL,

  diagnosed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_diag_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_diag_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_diag_ticket ON ticket_diagnoses(ticket_id);

-- =====================================================================
-- 5) WORK ORDERS (sparepart/vendor/license) + DETAIL SPAREPART
-- =====================================================================
CREATE TABLE work_orders (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  type ENUM('sparepart','vendor','license') NOT NULL,
  status ENUM('requested','in_procurement','delivered','completed','failed','cancelled') DEFAULT 'requested',
  provider_admin_id CHAR(36) NULL,
  vendor_name VARCHAR(150),
  vendor_ref VARCHAR(100),
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_wo_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_wo_provider FOREIGN KEY (provider_admin_id) REFERENCES users(id)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_wo_ticket ON work_orders(ticket_id);
CREATE INDEX idx_wo_status ON work_orders(status);

CREATE TABLE work_order_spareparts (
  id CHAR(36) PRIMARY KEY,
  work_order_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  quantity INT DEFAULT 1,
  unit ENUM('unit','paket','lisensi') NOT NULL DEFAULT 'unit',
  remarks VARCHAR(255),
  received_qty INT DEFAULT 0,
  received_at DATETIME NULL,
  CONSTRAINT fk_wosp_wo FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_wosp_wo ON work_order_spareparts(work_order_id);

-- =====================================================================
-- 6) KARTU KENDALI (1 aset = 1 kartu) + ENTRIES + ITEMS
-- =====================================================================
CREATE TABLE asset_control_cards (
  id CHAR(36) PRIMARY KEY,
  asset_id CHAR(36) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cc_asset FOREIGN KEY (asset_id) REFERENCES assets_bmn(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE TABLE asset_control_card_entries (
  id CHAR(36) PRIMARY KEY,
  card_id CHAR(36) NOT NULL,
  ticket_id CHAR(36) NOT NULL,
  vendor_name VARCHAR(150),
  vendor_ref VARCHAR(100),
  created_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cce_card FOREIGN KEY (card_id) REFERENCES asset_control_cards(id) ON DELETE CASCADE,
  CONSTRAINT fk_cce_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_cce_card ON asset_control_card_entries(card_id);
CREATE INDEX idx_cce_ticket ON asset_control_card_entries(ticket_id);

CREATE TABLE asset_control_card_entry_spareparts (
  id CHAR(36) PRIMARY KEY,
  entry_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  quantity INT DEFAULT 1,
  unit ENUM('unit','paket','lisensi') NOT NULL DEFAULT 'unit',
  remarks VARCHAR(255),
  CONSTRAINT fk_ccs_entry FOREIGN KEY (entry_id) REFERENCES asset_control_card_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_ccs_entry ON asset_control_card_entry_spareparts(entry_id);

-- =====================================================================
-- 7) CHAT (1 thread per tiket) + PARTICIPANTS + MESSAGES
-- =====================================================================
CREATE TABLE chat_threads (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_thread_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE TABLE chat_participants (
  id CHAR(36) PRIMARY KEY,
  thread_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  can_send BOOLEAN DEFAULT TRUE,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cpart_thread FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_cpart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE UNIQUE INDEX uq_cpart_thread_user ON chat_participants(thread_id, user_id);

CREATE TABLE chat_messages (
  id CHAR(36) PRIMARY KEY,
  thread_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  body TEXT,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cmsg_thread FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_cmsg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =====================================================================
-- 8) ZOOM (3 akun tetap) + BOOKING DETAIL TERBARU
-- =====================================================================
CREATE TABLE zoom_accounts (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,            -- "Akun Zoom 1"
  email VARCHAR(150) NOT NULL UNIQUE,    -- email akun Zoom
  account_type ENUM('PRO','LARGE','WEBINAR') NOT NULL DEFAULT 'PRO',
  capacity INT NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  host_key_enc VARCHAR(255) NULL,        -- opsional: simpan terenkripsi
  host_key_last4 VARCHAR(10) NULL,       -- untuk masking di UI
  note VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE TABLE zoom_bookings (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NULL,               -- jika diajukan via tiket
  zoom_account_id CHAR(36) NULL,         -- diisi saat APPROVE
  requester_id CHAR(36) NOT NULL,        -- siapa yang mengajukan

  status ENUM('pending','approved','rejected','completed','closed') DEFAULT 'pending',

  -- Detail booking (diisi pegawai saat membuat)
  start_at DATETIME,                     -- tanggal + jam mulai
  end_at   DATETIME,                     -- tanggal + jam selesai
  cohost_name VARCHAR(150) NULL,
  breakout_rooms INT DEFAULT 0,
  participants_est INT NULL,
  supporting_file_path VARCHAR(255) NULL,

  -- Informasi meeting (diisi saat approve)
  meeting_link VARCHAR(255),
  passcode VARCHAR(50),
  rejection_reason VARCHAR(255),

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_zb_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
  CONSTRAINT fk_zb_account FOREIGN KEY (zoom_account_id) REFERENCES zoom_accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_zb_requester FOREIGN KEY (requester_id) REFERENCES users(id)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_zb_status ON zoom_bookings(status);
CREATE INDEX idx_zb_time ON zoom_bookings(start_at, end_at);

-- =====================================================================
-- 9) NOTIFIKASI & AUDIT
-- =====================================================================
CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  title VARCHAR(150),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  actor_id CHAR(36),
  action VARCHAR(100),
  target_type VARCHAR(100),
  target_id CHAR(36),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

-- =====================================================================
-- 10) TRIGGERS (Business Guards)
-- =====================================================================
DELIMITER //

/* 10.1 VALIDASI TIKET REPAIR (INSERT)
   - kode_barang, nup, location wajib
   - (kb,nup) harus ada di assets_bmn ATAU bmn_master
   - merk_snapshot diisi otomatis dari assets_bmn.merk -> fallback bmn_master.merk
*/
CREATE TRIGGER trg_ticket_repair_validate_bi
BEFORE INSERT ON tickets
FOR EACH ROW
BEGIN
  IF NEW.type = 'repair' THEN
    IF NEW.kode_barang IS NULL OR NEW.nup IS NULL OR NEW.location IS NULL THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Untuk tiket perbaikan: kode_barang, nup, dan location wajib diisi.';
    END IF;

    DECLARE v_cnt_assets INT DEFAULT 0;
    DECLARE v_cnt_master INT DEFAULT 0;
    DECLARE v_merk VARCHAR(100);

    SELECT COUNT(*) INTO v_cnt_assets
      FROM assets_bmn
     WHERE kode_barang = NEW.kode_barang AND nup = NEW.nup;

    SELECT COUNT(*) INTO v_cnt_master
      FROM bmn_master
     WHERE kode_barang = NEW.kode_barang AND nup = NEW.nup;

    IF v_cnt_assets = 0 AND v_cnt_master = 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validasi gagal: Kode Barang + NUP tidak ditemukan pada assets_bmn maupun bmn_master.';
    END IF;

    SELECT a.merk INTO v_merk
      FROM assets_bmn a
     WHERE a.kode_barang = NEW.kode_barang AND a.nup = NEW.nup
     LIMIT 1;

    IF v_merk IS NULL THEN
      SELECT m.merk INTO v_merk
        FROM bmn_master m
       WHERE m.kode_barang = NEW.kode_barang AND m.nup = NEW.nup
       LIMIT 1;
    END IF;

    SET NEW.merk_snapshot = v_merk;
  END IF;
END;
//

/* 10.2 VALIDASI TIKET REPAIR (UPDATE) */
CREATE TRIGGER trg_ticket_repair_validate_bu
BEFORE UPDATE ON tickets
FOR EACH ROW
BEGIN
  IF NEW.type = 'repair' THEN
    IF NEW.kode_barang IS NULL OR NEW.nup IS NULL OR NEW.location IS NULL THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Untuk tiket perbaikan: kode_barang, nup, dan location wajib diisi.';
    END IF;

    IF (NEW.kode_barang <> OLD.kode_barang) OR (NEW.nup <> OLD.nup) THEN
      DECLARE v_cnt_assets2 INT DEFAULT 0;
      DECLARE v_cnt_master2 INT DEFAULT 0;
      DECLARE v_merk2 VARCHAR(100);

      SELECT COUNT(*) INTO v_cnt_assets2
        FROM assets_bmn
       WHERE kode_barang = NEW.kode_barang AND nup = NEW.nup;

      SELECT COUNT(*) INTO v_cnt_master2
        FROM bmn_master
       WHERE kode_barang = NEW.kode_barang AND nup = NEW.nup;

      IF v_cnt_assets2 = 0 AND v_cnt_master2 = 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Validasi gagal (UPDATE): Kode Barang + NUP tidak ditemukan pada assets_bmn maupun bmn_master.';
      END IF;

      SELECT a.merk INTO v_merk2
        FROM assets_bmn a
       WHERE a.kode_barang = NEW.kode_barang AND a.nup = NEW.nup
       LIMIT 1;

      IF v_merk2 IS NULL THEN
        SELECT m.merk INTO v_merk2
          FROM bmn_master m
         WHERE m.kode_barang = NEW.kode_barang AND m.nup = NEW.nup
         LIMIT 1;
      END IF;

      SET NEW.merk_snapshot = v_merk2;
    END IF;
  END IF;
END;
//

/* 10.3 Auto-create chat thread setelah tiket dibuat */
CREATE TRIGGER trg_ticket_create_thread_ai
AFTER INSERT ON tickets
FOR EACH ROW
BEGIN
  INSERT INTO chat_threads (id, ticket_id)
  VALUES (UUID(), NEW.id);
END;
//

/* 10.4 Auto-create header kartu kendali saat entri pertama;
       sekaligus set NEW.card_id sesuai asset tiket */
CREATE TRIGGER trg_auto_card_header_bi
BEFORE INSERT ON asset_control_card_entries
FOR EACH ROW
BEGIN
  DECLARE v_card_id CHAR(36);
  DECLARE v_asset_id CHAR(36);

  SELECT asset_id INTO v_asset_id
    FROM tickets
   WHERE id = NEW.ticket_id
   LIMIT 1;

  IF v_asset_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tidak dapat membuat entri kartu kendali: tiket belum terhubung ke aset (asset_id NULL).';
  END IF;

  SELECT id INTO v_card_id
    FROM asset_control_cards
   WHERE asset_id = v_asset_id
   LIMIT 1;

  IF v_card_id IS NULL THEN
    SET v_card_id = UUID();
    INSERT INTO asset_control_cards (id, asset_id) VALUES (v_card_id, v_asset_id);
  END IF;

  SET NEW.card_id = v_card_id;
END;
//

/* 10.5 Guard: Entri kartu kendali hanya bila ada WO final
       - sparepart: delivered
       - vendor/license: completed
*/
CREATE TRIGGER trg_acc_entries_require_wo_bi
BEFORE INSERT ON asset_control_card_entries
FOR EACH ROW
BEGIN
  DECLARE v_has_wo INT DEFAULT 0;

  SELECT COUNT(*) INTO v_has_wo
    FROM work_orders w
   WHERE w.ticket_id = NEW.ticket_id
     AND w.type IN ('sparepart','vendor','license')
     AND (
           (w.type = 'sparepart' AND w.status = 'delivered')
        OR (w.type IN ('vendor','license') AND w.status = 'completed')
     );

  IF v_has_wo = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tidak boleh membuat entri kartu kendali: belum ada WO final (delivered/completed).';
  END IF;
END;
//

DELIMITER ;

-- =====================================================================
-- 11) VIEW Ringkasan Riwayat Perbaikan per Aset (opsional)
-- =====================================================================
CREATE OR REPLACE VIEW v_asset_repair_history AS
SELECT
  a.id AS asset_id,
  a.kode_barang,
  a.nup,
  a.nama_barang,
  a.merk AS asset_merk,
  a.lokasi,
  t.id AS ticket_id,
  t.code AS ticket_code,
  t.status AS ticket_status,
  t.final_problem_type,
  t.created_at AS ticket_created_at,
  t.resolved_at,
  t.closed_at,
  w.id AS wo_id,
  w.type AS wo_type,
  w.status AS wo_status,
  w.vendor_name,
  w.vendor_ref,
  w.completed_at AS wo_completed_at
FROM assets_bmn a
LEFT JOIN tickets t
  ON t.asset_id = a.id AND t.type = 'repair'
LEFT JOIN work_orders w
  ON w.ticket_id = t.id
ORDER BY a.kode_barang, a.nup, t.created_at DESC;

-- =====================================================================
-- 12) STORED PROCEDURE (opsional) - Opsi A
--     Promote aset dari bmn_master -> assets_bmn
-- =====================================================================
DELIMITER //
CREATE PROCEDURE sp_promote_asset_from_master(
  IN p_kode_barang VARCHAR(20),
  IN p_nup VARCHAR(20),
  IN p_lokasi VARCHAR(150),
  OUT p_asset_id CHAR(36)
)
BEGIN
  DECLARE v_master_id CHAR(36);
  DECLARE v_nama VARCHAR(150);
  DECLARE v_merk VARCHAR(100);
  DECLARE v_tipe VARCHAR(100);

  SET p_asset_id = NULL;

  SELECT id, nama_barang, merk, tipe_barang
    INTO v_master_id, v_nama, v_merk, v_tipe
  FROM bmn_master
  WHERE kode_barang = p_kode_barang AND nup = p_nup
  LIMIT 1;

  IF v_master_id IS NOT NULL THEN
    SELECT id INTO p_asset_id
    FROM assets_bmn
    WHERE kode_barang = p_kode_barang AND nup = p_nup
    LIMIT 1;

    IF p_asset_id IS NULL THEN
      SET p_asset_id = UUID();
      INSERT INTO assets_bmn (
        id, bmn_master_id, kode_barang, nup,
        nama_barang, merk, tipe_barang, lokasi,
        status_operasional, created_at
      ) VALUES (
        p_asset_id, v_master_id, p_kode_barang, p_nup,
        v_nama, v_merk, v_tipe, p_lokasi,
        'Aktif', NOW()
      );
    END IF;
  END IF;
END;
//
DELIMITER ;

-- =====================================================================
-- 13) SEED MINIMAL (ROLES + ZOOM ACCOUNTS + SAMPLE BMN)
-- =====================================================================
INSERT INTO roles (id,name,description) VALUES
(UUID(),'super_admin','Pengelola sistem utama'),
(UUID(),'admin_layanan','Pengelola tiket layanan'),
(UUID(),'admin_penyedia','Pengelola WO & Kartu Kendali'),
(UUID(),'teknisi','Pelaksana perbaikan'),
(UUID(),'pegawai','Pemohon layanan');

-- 3 akun Zoom default
INSERT INTO zoom_accounts (id, name, email, account_type, capacity, is_active, note)
VALUES
(UUID(),'Akun Zoom 1','zoom1@bps-ntb.go.id','PRO',100,TRUE,'Akun utama untuk meeting rutin'),
(UUID(),'Akun Zoom 2','zoom2@bps-ntb.go.id','LARGE',500,TRUE,'Akun kapasitas besar'),
(UUID(),'Akun Zoom 3','zoom3@bps-ntb.go.id','WEBINAR',1000,TRUE,'Akun khusus webinar');

-- Contoh master & aset untuk validasi dan auto-merk_snapshot
INSERT INTO bmn_master (
  id,kode_barang,nup,nama_barang,merk,tipe_barang,ruangan,kondisi,status_operasional
) VALUES (
  UUID(),'3100102001','244','PC Unit','ThinkCentre M720t','PC','Ruang Statistik Sosial','Baik','Aktif'
);

INSERT INTO assets_bmn (
  id,bmn_master_id,kode_barang,nup,nama_barang,merk,tipe_barang,lokasi,status_operasional,created_at
) VALUES (
  UUID(), (SELECT id FROM bmn_master WHERE kode_barang='3100102001' AND nup='244' LIMIT 1),
  '3100102001','244','PC Unit','ThinkCentre M720t','PC','Ruang Statistik Sosial','Aktif', NOW()
);