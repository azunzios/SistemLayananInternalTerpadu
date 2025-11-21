/**
 * ENTITY RELATIONSHIP DIAGRAM (ERD) - COMMENTS SYSTEM
 * 
 * ┌──────────────────────────┐
 * │       users              │
 * ├──────────────────────────┤
 * │ id (PK)                  │
 * │ name                     │
 * │ email                    │
 * │ avatar                   │
 * │ role (deprecated)        │
 * │ roles (array)            │
 * │ created_at               │
 * │ updated_at               │
 * └──────────────────────────┘
 *          ▲
 *          │ (1:N)
 *          │ user_id
 *          │
 * ┌────────┴──────────────────┐
 * │     comments              │
 * ├───────────────────────────┤
 * │ id (PK)                   │
 * │ ticket_id (FK)────┐       │
 * │ user_id (FK)──┘   │       │
 * │ content       │   │       │
 * │ user_role     │   │       │
 * │ created_at    │   │       │
 * │ updated_at    │   │       │
 * └───────────────┼───┤───────┘
 *                 │   │
 *                 │   │ (1:N)
 *                 │   │ ticket_id
 *                 │   │
 * ┌───────────────▼───▼──────┐
 * │      tickets             │
 * ├──────────────────────────┤
 * │ id (PK)                  │
 * │ ticket_number            │
 * │ type                     │
 * │ title                    │
 * │ description              │
 * │ user_id (FK) → users.id  │
 * │ assigned_to (FK)         │
 * │ category_id              │
 * │ status                   │
 * │ created_at               │
 * │ updated_at               │
 * └──────────────────────────┘
 * 
 * RELATIONSHIPS:
 * - users (1) ──→ (N) comments [user_id]
 * - tickets (1) ──→ (N) comments [ticket_id]
 * - users (1) ──→ (N) tickets [user_id] (pembuat)
 * - users (1) ──→ (N) tickets [assigned_to] (teknisi)
 * 
 * ==================== AKSES PER ROLE ====================
 * 
 * Untuk 1 tiket, bisa diakses oleh 3 role berbeda:
 * 
 * 1. PEGAWAI (Pembuat Tiket)
 *    - user_id di tickets == current user id
 *    - Bisa create/read comments pada tiket mereka
 * 
 * 2. TEKNISI (Assigned)
 *    - assigned_to di tickets == current user id
 *    - Bisa create/read comments pada tiket yang ditugaskan
 *    - NULL untuk type=zoom_meeting (jika tidak ada teknisi)
 * 
 * 3. ADMIN LAYANAN / ADMIN PENYEDIA / SUPER ADMIN
 *    - Bisa create/read comments pada semua tiket
 *    - User_role di comment mencatat role saat dibuat
 * 
 * ==================== DATA FLOW ====================
 * 
 * CREATE COMMENT:
 * 1. User submit form (content)
 * 2. Frontend: POST /api/tickets/{id}/comments
 * 3. Backend: validate authorization + validate content
 * 4. Backend: capture user_id, user_role (dari authenticated user)
 * 5. Backend: insert ke comments table
 * 6. Backend: return created comment dengan user relationship
 * 7. Frontend: add comment ke list (optimistic update)
 * 
 * GET COMMENTS (PAGINATION):
 * 1. Frontend: GET /api/tickets/{id}/comments?page=1&per_page=30
 * 2. Backend: validate authorization
 * 3. Backend: query comments.ticket_id = ticket.id
 * 4. Backend: order by created_at DESC (newest first)
 * 5. Backend: paginate per 30
 * 6. Backend: eager load user relationship
 * 7. Backend: return paginated collection dengan meta
 * 8. Frontend: reverse comments untuk display (oldest first)
 * 
 * LOAD MORE:
 * 1. User klik "Load More" button
 * 2. Frontend: GET /api/tickets/{id}/comments?page=2&per_page=30
 * 3. Backend: return page 2 comments
 * 4. Frontend: append ke existing list (tidak reset)
 * 
 * ==================== PAGINATION LOGIC ====================
 * 
 * Setiap halaman = 30 comments
 * 
 * Total 150 comments:
 * - Page 1: comments 1-30 (newest 30)
 * - Page 2: comments 31-60
 * - Page 3: comments 61-90
 * - Page 4: comments 91-120
 * - Page 5: comments 121-150 (oldest 30)
 * 
 * API return DESC order (newest first):
 * - Page 1: id 150, 149, ..., 121
 * - Page 2: id 120, 119, ..., 91
 * - etc...
 * 
 * Frontend auto-reverse untuk display ASC order (oldest first):
 * - Display: id 1, 2, ..., 30 (page 1)
 *           id 31, 32, ..., 60 (page 2)
 *           etc...
 * 
 * ==================== INDEXES ====================
 * 
 * CREATE INDEX comments_ticket_id_index ON comments(ticket_id);
 * CREATE INDEX comments_created_at_index ON comments(created_at);
 * 
 * Alasan:
 * - ticket_id: query comments per ticket (frequent)
 * - created_at: sorting DESC (frequent)
 * 
 * Kombinasi buat efficient: 
 * SELECT * FROM comments 
 * WHERE ticket_id = ? 
 * ORDER BY created_at DESC 
 * LIMIT 30 OFFSET 0
 */
?>
