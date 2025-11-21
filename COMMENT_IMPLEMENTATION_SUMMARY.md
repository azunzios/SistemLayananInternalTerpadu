/**
 * RINGKASAN IMPLEMENTASI COMMENT/DISKUSI SYSTEM
 * 
 * ==================== DATABASE ====================
 * 
 * Tabel: comments
 * Columns:
 * - id: primary key
 * - ticket_id: foreign key ke tickets.id (cascade delete)
 * - user_id: foreign key ke users.id (cascade delete)
 * - content: text (max 5000 chars)
 * - user_role: string (pegawai, teknisi, admin_layanan) - captured saat comment dibuat
 * - timestamps: created_at, updated_at
 * - Indexes: ticket_id, created_at untuk performa query
 * 
 * ==================== API ENDPOINTS ====================
 * 
 * GET /api/tickets/{ticketId}/comments
 * - Pagination: per_page=30 (max 100), page=1
 * - Return: Comments dalam urutan DESC (newest first)
 * - Meta: total, per_page, current_page, last_page untuk pagination
 * 
 * POST /api/tickets/{ticketId}/comments
 * - Body: { content: string (required, 1-5000 chars) }
 * - Return: Created comment resource (201)
 * - Auto-captures: user_id, user_role, timestamp
 * 
 * ==================== AUTHORIZATION ====================
 * 
 * Semua endpoint memerlukan auth:sanctum
 * 
 * User bisa akses comment jika:
 * - Super Admin: semua tickets
 * - Admin Layanan: semua tickets
 * - Admin Penyedia: semua tickets
 * - Pegawai: hanya tiket yang dia buat (ticket.user_id == auth.id)
 * - Teknisi: hanya tiket yang ditugaskan (ticket.assigned_to == auth.id)
 * 
 * Unauthorized: return 403 Forbidden
 * 
 * ==================== STRUKTUR RESPONSE ====================
 * 
 * GET /api/tickets/123/comments?page=1&per_page=30
 * 
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "ticket_id": 123,
 *       "user": {
 *         "id": "5",
 *         "name": "John Doe",
 *         "email": "john@example.com",
 *         "avatar": "url/avatar.jpg"
 *       },
 *       "content": "Comment text here",
 *       "user_role": "pegawai",
 *       "created_at": "2025-11-20T10:30:00Z",
 *       "updated_at": "2025-11-20T10:30:00Z"
 *     },
 *     ...
 *   ],
 *   "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
 *   "meta": {
 *     "current_page": 1,
 *     "from": 1,
 *     "last_page": 5,
 *     "per_page": 30,
 *     "to": 30,
 *     "total": 150
 *   }
 * }
 * 
 * ==================== FILES YANG DIBUAT ====================
 * 
 * Backend:
 * - database/migrations/2025_11_20_000000_create_comments_table.php
 * - app/Models/Comment.php
 * - app/Http/Controllers/CommentController.php
 * - app/Http/Resources/CommentResource.php
 * - COMMENT_API_DOCS.php (dokumentasi)
 * 
 * Routes (di routes/api.php):
 * - GET /tickets/{ticket}/comments (CommentController@index)
 * - POST /tickets/{ticket}/comments (CommentController@store)
 * 
 * Modifications:
 * - app/Models/Ticket.php: tambah relationship comments()
 * 
 * Frontend:
 * - src/lib/storage.ts: tambah getTicketComments(), createTicketComment()
 * - src/hooks/useTicketComments.ts: hook untuk manage state
 * - src/COMMENT_IMPLEMENTATION_GUIDE.ts (dokumentasi)
 * 
 * ==================== FITUR YANG DISEDIAKAN ====================
 * 
 * ✓ Pagination dengan limit 30 per halaman
 * ✓ Load more button untuk fetch comments terdahulu (page++)
 * ✓ Newest comments first (DESC order) dari API
 * ✓ Capture user role saat comment dibuat
 * ✓ Authorization per-user per-ticket
 * ✓ Audit logging untuk create comment
 * ✓ Real-time user data (name, email, avatar) via eager loading
 * ✓ Frontend hook untuk state management
 * ✓ Error handling di kedua sisi (API & frontend)
 * 
 * ==================== USAGE FRONTEND ====================
 * 
 * const { comments, loading, hasMore, fetchComments, loadMoreComments, addComment } 
 *   = useTicketComments();
 * 
 * // Fetch initial comments (page 1, 30 per page)
 * useEffect(() => {
 *   fetchComments(ticket.id);
 * }, [ticket.id]);
 * 
 * // Load more
 * onClick={() => loadMoreComments(ticket.id)}
 * 
 * // Add comment
 * onClick={() => addComment(ticket.id, commentText)}
 * 
 * ==================== CATATAN PENTING ====================
 * 
 * 1. Comments di-return DESC (newest first) dari API
 *    Hook auto-reverse untuk display (oldest first)
 * 
 * 2. Untuk 3 role yang bisa akses 1 tiket:
 *    - Pegawai: pembuat tiket
 *    - Teknisi: assigned_to (null untuk zoom_meeting)
 *    - Admin: lihat semua
 *    user_role di comment menyimpan role saat dibuat
 * 
 * 3. Load more append ke existing comments (tidak reset)
 * 
 * 4. New comment langsung add ke awal list
 * 
 * 5. Max content 5000 chars, validated di frontend & backend
 */
