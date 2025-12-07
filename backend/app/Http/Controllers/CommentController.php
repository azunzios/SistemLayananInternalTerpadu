<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Ticket;
use App\Http\Resources\CommentResource;
use App\Models\AuditLog;
use App\Services\TicketNotificationService;
use App\Traits\HasRoleHelper;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    use HasRoleHelper;

    /**
     * Get comments for a ticket dengan pagination
     * GET /tickets/{ticketId}/comments?page=1&per_page=30
     * 
     * Mengembalikan comments dalam urutan DESC (terbaru di atas)
     * dengan eager load replies (max 2 level)
     */
    public function index(Request $request, Ticket $ticket)
    {
        // Authorize: user harus bisa akses ticket ini
        $this->authorizeTicketAccess($ticket);

        $perPage = min((int)$request->get('per_page', 30), 100); // max 100 per page
        
        // Ambil comments dengan pagination, ordered by DESC (terbaru first)
        // Eager load user dan replies dengan user mereka
        $comments = $ticket->comments()
            ->with(['user', 'replies.user'])
            ->whereNull('parent_comment_id') // hanya top-level comments
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return CommentResource::collection($comments);
    }

    /**
     * Create a new comment on a ticket
     * POST /tickets/{ticketId}/comments
     * Body: {
     *   "content": "...",
     *   "parent_comment_id": null (optional, untuk reply)
     * }
     */
    public function store(Request $request, Ticket $ticket)
    {
        // Authorize: user harus bisa akses ticket ini
        $this->authorizeTicketAccess($ticket);

        $validated = $request->validate([
            'content' => 'required|string|min:1|max:5000',
            'parent_comment_id' => 'nullable|exists:comments,id',
        ]);

        $user = auth()->user();

        // Get user's active role
        $userRole = $user->role ?? 'pegawai';

        // Jika ini reply, check parent comment berada di ticket yang sama
        // dan max 2 level (parent tidak boleh punya parent sendiri)
        if ($validated['parent_comment_id'] ?? null) {
            $parentComment = Comment::find($validated['parent_comment_id']);
            if ($parentComment->ticket_id !== $ticket->id) {
                return response()->json(['error' => 'Parent comment not in this ticket'], 400);
            }
            if ($parentComment->parent_comment_id !== null) {
                return response()->json(['error' => 'Cannot reply to a reply (max 2 levels)'], 400);
            }
        }

        // Create comment
        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'parent_comment_id' => $validated['parent_comment_id'] ?? null,
            'content' => $validated['content'],
            'user_role' => $userRole,
        ]);

        // Load user relationship untuk response
        $comment->load('user');

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'CREATE_COMMENT',
            'entity_type' => 'Comment',
            'entity_id' => $comment->id,
            'details' => "Comment created on ticket #{$ticket->ticket_number}",
            'ip_address' => request()->ip(),
        ]);

        // Send notification
        $parentCommentUserId = null;
        if ($validated['parent_comment_id'] ?? null) {
            $parentComment = Comment::find($validated['parent_comment_id']);
            $parentCommentUserId = $parentComment?->user_id;
        }
        TicketNotificationService::onCommentCreated($ticket, $user->id, $parentCommentUserId);

        return response()->json(new CommentResource($comment), 201);

    }

    /**
     * Authorize ticket access
     * User bisa access ticket jika:
     * - User adalah pegawai yang membuat ticket
     * - User adalah teknisi yang ditugaskan
     * - User adalah admin_layanan atau super_admin
     */
    private function authorizeTicketAccess(Ticket $ticket)
    {
        $user = auth()->user();
        
        // Super admin bisa akses semua
        if ($this->userHasRole($user, 'super_admin')) {
            return;
        }

        // Admin layanan bisa akses semua
        if ($this->userHasRole($user, 'admin_layanan')) {
            return;
        }

        // Pegawai hanya bisa akses tiketnya sendiri
        if ($this->userHasRole($user, 'pegawai') && $ticket->user_id === $user->id) {
            return;
        }

        // Teknisi bisa akses ticket yang ditugaskan ke dia
        if ($this->userHasRole($user, 'teknisi') && $ticket->assigned_to === $user->id) {
            return;
        }

        // Admin t bisa akses
        if ($this->userHasRole($user, 'admin_penyedia')) {
            return;
        }

        abort(403, 'Unauthorized to access this ticket');
    }
}
