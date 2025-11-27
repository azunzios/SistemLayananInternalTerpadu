<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\Asset;
use App\Models\Category;
use App\Models\Timeline;
use App\Models\WorkOrder;
use App\Http\Resources\TicketResource;
use App\Models\AuditLog;
use App\Traits\HasRoleHelper;
use App\Services\ZoomBookingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    use HasRoleHelper;
    /**
     * Get all tickets with filtering
     */
    public function index(Request $request)
    {
        $query = Ticket::with('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount', 'comments', 'diagnosis.technician');

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->has('status')) {
            $status = $request->status;
            
            if ($status === 'pending') {
                $query->whereIn('status', ['submitted', 'pending_review']);
            } elseif ($status === 'in_progress') {
                $query->whereIn('status', ['assigned', 'in_progress', 'on_hold']);
            } elseif ($status === 'completed') {
                $query->whereIn('status', ['closed', 'rejected']);
            } else {
                // Allow comma separated
                $statuses = explode(',', $status);
                if (count($statuses) > 1) {
                    $query->whereIn('status', $statuses);
                } else {
                    $query->where('status', $status);
                }
            }
        }

        // Filter by assigned user (for teknisi)
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Filter by severity (perbaikan only)
        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search by ticket number or title
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%$search%")
                  ->orWhere('title', 'like', "%$search%");
            });
        }

        // Role-based filtering
        $user = auth()->user();
        $scope = $request->get('scope'); // allow forcing limited views even for multi-role users
        
        if ($user) {
            if ($scope === 'my') {
                $query->where(function($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('assigned_to', $user->id);
                });
            } elseif ($scope === 'assigned') {
                $query->where('assigned_to', $user->id);
            } elseif ($scope === 'work_order_needed') {
                // Admin penyedia: tiket yang punya work order atau butuh work order
                $query->whereHas('workOrders');
            } else {
                $userRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
                if (!in_array('admin_layanan', $userRoles) && 
                    !in_array('super_admin', $userRoles) &&
                    !in_array('teknisi', $userRoles)) {
                    // Pegawai can only see their own tickets
                    $query->where('user_id', $user->id);
                } elseif (in_array('teknisi', $userRoles) && !in_array('admin_layanan', $userRoles) && !in_array('super_admin', $userRoles)) {
                    // Teknisi can only see assigned tickets
                    $query->where('assigned_to', $user->id);
                }
            }
        }

        // Always sort by newest first (created_at DESC)
        $query->orderBy('created_at', 'desc');

        $tickets = $query->paginate($request->get('per_page', 15));

        return TicketResource::collection($tickets);
    }

    /**
     * Get single ticket
     */
    public function show(Ticket $ticket)
    {
        // Check authorization
        $this->authorizeTicketAccess($ticket);

        return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount', 'comments.user', 'comments.replies.user', 'diagnosis.technician', 'workOrders'));
    }

    /**
     * Get dashboard statistics for admin (all tickets, no role filtering)
     */
    public function adminDashboardStats(Request $request)
    {
        // Get all tickets (no role-based filtering)
        $allTickets = Ticket::query();

        // Apply type filter if provided
        if ($request->has('type')) {
            $allTickets->where('type', $request->type);
        }

        $total = $allTickets->count();
        
        $pending = (clone $allTickets)->whereIn('status', [
            'submitted', 'pending_review'
        ])->count();
        
        $inProgress = (clone $allTickets)->whereIn('status', [
            'assigned', 'in_progress', 'on_hold', 'waiting_for_pegawai'
        ])->count();
        
        $approved = (clone $allTickets)->where('status', 'approved')->count();
        
        $completed = (clone $allTickets)->whereIn('status', [
            'closed', 'completed'
        ])->count();
        
        $rejected = (clone $allTickets)->whereIn('status', [
            'closed_unrepairable', 'rejected', 'cancelled'
        ])->count();

        // Breakdown by type
        $perbaikan = (clone $allTickets)->where('type', 'perbaikan')->count();
        $zoomMeeting = (clone $allTickets)->where('type', 'zoom_meeting')->count();

        // Count by specific statuses for pending review
        $pendingReview = (clone $allTickets)->where('status', 'pending_review')->count();
        $pendingApproval = (clone $allTickets)->where('status', 'submitted')->count();

        // Completion rate
        $completionRate = $total > 0 ? round(($completed / $total) * 100, 2) : 0;

        return response()->json([
            'total' => $total,
            'pending' => $pending,
            'pendingReview' => $pendingReview,
            'pendingApproval' => $pendingApproval,
            'in_progress' => $inProgress,
            'approved' => $approved,
            'completed' => $completed,
            'rejected' => $rejected,
            'completion_rate' => $completionRate,
            'perbaikan' => $perbaikan,
            'zoom' => $zoomMeeting,
        ]);
    }

    /**
     * Get comprehensive admin layanan dashboard data dengan statistik dan 7-hari trend
     * statistik: total, perbaikan (submitted), zoom (pending_review), closed (dengan %), trend 7 hari
     */
    public function adminLayananDashboardData(Request $request)
    {
        // Total tiket
        $total = Ticket::count();
        
        // Perbaikan submitted
        $perbaikanSubmitted = Ticket::where('type', 'perbaikan')
            ->where('status', 'submitted')
            ->count();
        
        // Zoom pending_review
        $zoomPendingReview = Ticket::where('type', 'zoom_meeting')
            ->where('status', 'pending_review')
            ->count();
        
        // Closed tiket
        $closedCount = Ticket::where('status', 'closed')->count();
        $closureRate = $total > 0 ? round(($closedCount / $total) * 100, 2) : 0;
        
        // Last 7 days trend data
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $dateEnd = $date->copy()->endOfDay();
            $dateStr = $date->format('d M');
            
            $perbaikanCount = Ticket::where('type', 'perbaikan')
                ->whereBetween('created_at', [$date, $dateEnd])
                ->count();
            
            $zoomCount = Ticket::where('type', 'zoom_meeting')
                ->whereBetween('created_at', [$date, $dateEnd])
                ->count();
            
            $last7Days[] = [
                'date' => $dateStr,
                'perbaikan' => $perbaikanCount,
                'zoom' => $zoomCount,
            ];
        }

        return response()->json([
            'statistics' => [
                'total' => $total,
                'perbaikan' => [
                    'count' => $perbaikanSubmitted,
                    'status' => 'submitted',
                ],
                'zoom' => [
                    'count' => $zoomPendingReview,
                    'status' => 'pending_review',
                ],
                'closed' => [
                    'count' => $closedCount,
                    'percentage' => $closureRate,
                    'description' => "{$closureRate}% dari total tiket",
                ],
            ],
            'trend' => $last7Days,
        ]);
    }

    /**
     * Get ticket counts by status for current user
     */
    public function counts(Request $request)
    {
        $query = Ticket::query();

        // Check if admin_view parameter is set (for admin ticket list - see all tickets)
        $adminView = $request->boolean('admin_view', false);
        $scope = $request->get('scope');

        // Apply role-based filtering only if NOT admin view
        if (!$adminView) {
            $user = auth()->user();
            if ($user) {
                if ($scope === 'my') {
                    $query->where(function($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->orWhere('assigned_to', $user->id);
                    });
                } elseif ($scope === 'assigned') {
                    $query->where('assigned_to', $user->id);
                } elseif ($scope === 'work_order_needed') {
                    // Admin penyedia: tiket yang punya work order
                    $query->whereHas('workOrders');
                } else {
                    $userRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
                    if (!in_array('admin_layanan', $userRoles) && 
                        !in_array('super_admin', $userRoles) &&
                        !in_array('teknisi', $userRoles)) {
                        // Pegawai can only see their own tickets
                        $query->where('user_id', $user->id);
                    } elseif (in_array('teknisi', $userRoles) && !in_array('admin_layanan', $userRoles) && !in_array('super_admin', $userRoles)) {
                        // Teknisi can only see assigned tickets
                        $query->where('assigned_to', $user->id);
                    }
                }
            }
        }

        // Apply type filter if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $total = $query->count();
        
        $pending = (clone $query)->whereIn('status', [
            'submitted', 'pending_review'
        ])->count();
        
        $inProgress = (clone $query)->whereIn('status', [
            'assigned', 'in_progress', 'in_diagnosis', 'in_repair', 'on_hold', 'waiting_for_pegawai'
        ])->count();
        
        $approved = (clone $query)->where('status', 'approved')->count();
        
        $completed = (clone $query)->whereIn('status', [
            'closed', 'completed', 'resolved'
        ])->count();
        
        $rejected = (clone $query)->whereIn('status', [
            'closed_unrepairable', 'rejected', 'cancelled'
        ])->count();

        return response()->json([
            'total' => $total,
            'pending' => $pending,
            'in_progress' => $inProgress,
            'approved' => $approved,
            'completed' => $completed,
            'rejected' => $rejected,
        ]);
    }

    /**
     * Get technician statistics (active tickets count)
     */
    public function technicianStats()
    {
        // Get all users with role 'teknisi'
        // Note: Assuming roles is a JSON column or we filter after retrieval if needed
        // For better compatibility, we'll retrieve and filter if whereJsonContains isn't reliable on all DBs
        // But whereJsonContains is standard in Laravel for JSON columns.
        
        $technicians = \App\Models\User::whereJsonContains('roles', 'teknisi')->get();
        
        // Fallback if roles is not JSON or empty result (e.g. stored as string)
        if ($technicians->isEmpty()) {
             $technicians = \App\Models\User::all()->filter(function ($user) {
                $roles = is_string($user->roles) ? json_decode($user->roles, true) : $user->roles;
                return is_array($roles) && in_array('teknisi', $roles);
             });
        }

        $stats = $technicians->map(function ($tech) {
            $activeCount = Ticket::where('assigned_to', $tech->id)
                ->whereIn('status', [
                    'assigned',
                    'in_progress',
                    'on_hold',
                    'waiting_for_pegawai',
                    'diterima_teknisi',
                    'sedang_diagnosa',
                    'dalam_perbaikan',
                    'menunggu_sparepart'
                ])
                ->count();

            return [
                'id' => $tech->id,
                'name' => $tech->name,
                'active_tickets' => $activeCount
            ];
        })->values(); // Reset keys after filter if any

        return response()->json($stats);
    }

    /**
     * Create new ticket (both perbaikan and zoom)
     */
    public function store(Request $request)
    {
        // Decode JSON strings if sent via multipart
        if (is_string($request->form_data)) {
            $decoded = json_decode($request->form_data, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['form_data' => $decoded]);
            }
        }
        if (is_string($request->zoom_co_hosts)) {
            $decoded = json_decode($request->zoom_co_hosts, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['zoom_co_hosts' => $decoded]);
            }
        }

        $validated = $request->validate([
            'type' => 'required|in:perbaikan,zoom_meeting',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            // Perbaikan fields
            'asset_code' => 'required_if:type,perbaikan|string',
            'asset_nup' => 'required_if:type,perbaikan|string',
            'asset_location' => 'nullable|string',
            'severity' => 'required_if:type,perbaikan|in:low,normal,high,critical',
            // Zoom fields - validasi minimal, jumlah peserta & breakout room tidak wajib
            'zoom_date' => 'required_if:type,zoom_meeting|date|after_or_equal:today',
            'zoom_start_time' => 'required_if:type,zoom_meeting|date_format:H:i',
            'zoom_end_time' => 'required_if:type,zoom_meeting|date_format:H:i|after:zoom_start_time',
            'zoom_estimated_participants' => 'nullable|integer|min:0', // Dibebaskan
            'zoom_co_hosts' => 'nullable|array',
            'zoom_co_hosts.*.name' => 'string',
            'zoom_co_hosts.*.email' => 'email',
            'zoom_breakout_rooms' => 'nullable|integer|min:0', // Dibebaskan
            'zoom_attachments' => 'nullable|array',
            'zoom_attachments.*' => 'file|max:' . env('MAX_ZOOM_ATTACHMENT_SIZE', 10240) . '|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png',
            // Dynamic form data
            'form_data' => 'nullable|array',
            // Perbaikan attachments
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:2048|mimes:jpg,jpeg,png,pdf,doc,docx',
        ]);

        $user = auth()->user();

        // Validate asset exists for perbaikan tickets
        if ($validated['type'] === 'perbaikan') {
            $asset = Asset::where('asset_code', $validated['asset_code'])
                ->where('asset_nup', $validated['asset_nup'])
                ->first();

            if (!$asset) {
                throw ValidationException::withMessages([
                    'asset_code' => ['Barang dengan kode dan NUP ini tidak ditemukan di database'],
                ]);
            }

            if (!$asset->is_active) {
                throw ValidationException::withMessages([
                    'asset_code' => ['Barang ini tidak aktif dan tidak bisa diperbaiki'],
                ]);
            }
        }

        // Create ticket
        $ticket = new Ticket();
        $ticket->ticket_number = Ticket::generateTicketNumber($validated['type']);
        $ticket->type = $validated['type'];
        $ticket->title = $validated['title'];
        $ticket->description = $validated['description'];
        $ticket->user_id = $user->id;
        $ticket->form_data = $validated['form_data'] ?? null;

        if ($validated['type'] === 'perbaikan') {
            $ticket->asset_code = $validated['asset_code'];
            $ticket->asset_nup = $validated['asset_nup'];
            $ticket->asset_location = $validated['asset_location'] ?? null;
            $ticket->severity = $validated['severity'];
            $ticket->status = 'submitted';

            // Handle file uploads (attachments)
            $attachmentPaths = [];
            if ($request->hasFile('attachments')) {
                $basePath = env('TICKET_ATTACHMENTS_PATH', 'ticket_attachments');
                foreach ($request->file('attachments') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs($basePath, $filename, 'public');
                    $attachmentPaths[] = [
                        'id' => (string) Str::uuid(),
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'type' => $file->getClientMimeType(),
                        'url' => \Storage::disk('public')->url($path),
                        'uploadedAt' => now()->toIso8601String(),
                    ];
                }
            }
            $ticket->attachments = $attachmentPaths;
        } else if ($validated['type'] === 'zoom_meeting') {
            // Validasi dan assign akun zoom otomatis
            $bookingService = new ZoomBookingService();
            $assignmentResult = $bookingService->validateAndAssignAccount([
                'zoom_date' => $validated['zoom_date'],
                'zoom_start_time' => $validated['zoom_start_time'],
                'zoom_end_time' => $validated['zoom_end_time'],
            ]);

            if (!$assignmentResult['success']) {
                throw ValidationException::withMessages([
                    'zoom_date' => [$assignmentResult['message']],
                ]);
            }

            // Handle file uploads
            $attachmentPaths = [];
            if ($request->hasFile('zoom_attachments')) {
                $basePath = env('ZOOM_ATTACHMENTS_PATH', 'zoom_attachments');
                foreach ($request->file('zoom_attachments') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs($basePath, $filename, 'public');
                    $attachmentPaths[] = [
                        'id' => (string) Str::uuid(),
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'type' => $file->getClientMimeType(),
                        'url' => \Storage::disk('public')->url($path),
                        'uploadedAt' => now()->toIso8601String(),
                    ];
                }
            }

            $ticket->zoom_date = $validated['zoom_date'];
            $ticket->zoom_start_time = $validated['zoom_start_time'];
            $ticket->zoom_end_time = $validated['zoom_end_time'];
            
            // Hitung zoom_duration dari start_time dan end_time jika tidak dikirim dari frontend
            if (isset($validated['zoom_duration'])) {
                $ticket->zoom_duration = $validated['zoom_duration'];
            } else {
                // Hitung otomatis dari selisih waktu
                $start = \Carbon\Carbon::createFromFormat('H:i', $validated['zoom_start_time']);
                $end = \Carbon\Carbon::createFromFormat('H:i', $validated['zoom_end_time']);
                $ticket->zoom_duration = $start->diffInMinutes($end);
            }
            
            $ticket->zoom_estimated_participants = $validated['zoom_estimated_participants'] ?? 0;
            $ticket->zoom_co_hosts = $validated['zoom_co_hosts'] ?? [];
            $ticket->zoom_breakout_rooms = $validated['zoom_breakout_rooms'] ?? 0;
            $ticket->zoom_account_id = $assignmentResult['account_id']; // AUTO-ASSIGN berdasarkan slot kosong
            $ticket->zoom_attachments = $attachmentPaths;
            $ticket->status = 'pending_review';
        }

        $ticket->save();

        // Create timeline entry
        Timeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'action' => 'ticket_created',
            'details' => "Ticket created: {$ticket->title}",
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'TICKET_CREATED',
            'details' => "Ticket created: {$ticket->ticket_number} ({$ticket->title})",
            'ip_address' => request()->ip(),
        ]);

        return response()->json(new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount')), 201);
    }

    /**
     * Update ticket
     */
    public function update(Request $request, Ticket $ticket)
    {
        $this->authorizeTicketAccess($ticket);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'string',
            'form_data' => 'nullable|array',
            'work_orders_ready' => 'nullable|boolean',
        ]);

        $ticket->update($validated);

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'TICKET_UPDATED',
            'details' => "Ticket updated: {$ticket->ticket_number}",
            'ip_address' => request()->ip(),
        ]);

        return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount'));
    }

    /**
     * Assign ticket to teknisi (admin_layanan only)
     */
    public function assign(Request $request, Ticket $ticket)
    {
        // Check if user is admin_layanan
        if (!$this->userHasRole(auth()->user(), 'admin_layanan')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $oldStatus = $ticket->status;
        $ticket->assigned_to = $validated['assigned_to'];
        $ticket->status = 'assigned';
        $ticket->save();

        $assignedUser = $ticket->assignedUser;

        // Create timeline entries
        Timeline::logAssignment($ticket->id, auth()->id(), $validated['assigned_to'], $assignedUser->name);
        Timeline::logStatusChange($ticket->id, auth()->id(), $oldStatus, 'assigned');

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'TICKET_ASSIGNED',
            'details' => "Ticket {$ticket->ticket_number} assigned to {$assignedUser->name}",
            'ip_address' => request()->ip(),
        ]);

        // Notification to assigned technician
        \App\Models\Notification::create([
            'user_id' => $validated['assigned_to'],
            'title' => 'Tiket Baru Ditugaskan',
            'message' => "Anda ditugaskan untuk menangani tiket {$ticket->ticket_number} ({$ticket->title})",
            'type' => 'info',
            'link' => "/tickets/{$ticket->id}",
            'read' => false,
        ]);

        // Notification to user
        \App\Models\Notification::create([
            'user_id' => $ticket->user_id,
            'title' => 'Tiket Sedang Ditangani',
            'message' => "Tiket {$ticket->ticket_number} telah ditugaskan ke teknisi",
            'type' => 'info',
            'link' => "/tickets/{$ticket->id}",
            'read' => false,
        ]);

        return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount'));
    }

    /**
     * Approve perbaikan ticket (admin_layanan only)
     */
    public function approveTicket(Request $request, Ticket $ticket)
    {
        if (!$this->userHasRole(auth()->user(), 'admin_layanan')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validasi tipe tiket
        if ($ticket->type !== 'perbaikan') {
            return response()->json([
                'message' => 'Only perbaikan tickets can be approved using this endpoint'
            ], 400);
        }

        // Validasi status - hanya tiket submitted yang bisa disetujui
        if (!in_array($ticket->status, ['submitted', 'pending_review'])) {
            return response()->json([
                'message' => 'Only submitted or pending review tickets can be approved'
            ], 400);
        }

        $oldStatus = $ticket->status;
        $ticket->status = 'approved';
        $ticket->save();
        $ticket->refresh();

        // Create timeline
        Timeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'action' => 'ticket_approved',
            'details' => 'Tiket perbaikan disetujui oleh admin layanan',
            'metadata' => [
                'old_status' => $oldStatus,
                'new_status' => 'approved',
                'approved_by' => auth()->user()->name,
            ],
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'TICKET_APPROVED',
            'details' => "Ticket {$ticket->ticket_number} (perbaikan) approved",
            'ip_address' => request()->ip(),
        ]);

        // Notifikasi ke user yang mengajukan
        \App\Models\Notification::create([
            'user_id' => $ticket->user_id,
            'type' => 'success',
            'title' => 'Tiket Perbaikan Disetujui',
            'message' => "Tiket perbaikan {$ticket->ticket_number} telah disetujui oleh admin. Teknisi akan segera ditugaskan.",
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
            'data' => [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'notification_type' => 'ticket_approved',
            ],
        ]);

        return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user'));
    }

    /**
     * Update ticket status
     */
    public function updateStatus(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'status' => 'required|string',
            'estimated_schedule' => 'nullable|string',
            'reject_reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'mark_work_orders_ready' => 'nullable|boolean',
            'completion_data' => 'nullable|array', // Data form completion
            'completion_data.tindakan_dilakukan' => 'nullable|string',
            'completion_data.komponen_diganti' => 'nullable|string',
            'completion_data.hasil_perbaikan' => 'nullable|string',
            'completion_data.saran_perawatan' => 'nullable|string',
            'completion_data.catatan_tambahan' => 'nullable|string',
            'completion_data.foto_bukti' => 'nullable|string',
        ]);

        // Check if status transition is valid
        if (!$ticket->canTransitionTo($validated['status'])) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition from '{$ticket->status}' to '{$validated['status']}'"],
            ]);
        }

        // Additional validation for closed transition (completion)
        if ($validated['status'] === 'closed') {
            $diagnosis = $ticket->diagnosis;
            
            // Check if diagnosis exists
            if (!$diagnosis) {
                throw ValidationException::withMessages([
                    'status' => 'Diagnosis must be completed before closing ticket',
                ]);
            }
            
            // If diagnosis needs work order, check work_orders_ready flag
            $repairType = $diagnosis->repair_type;
            $needsWorkOrder = in_array($repairType, ['need_sparepart', 'need_vendor', 'need_license']);
            
            if ($needsWorkOrder && !$ticket->work_orders_ready) {
                throw ValidationException::withMessages([
                    'status' => 'Work orders must be ready. Click "Lanjutkan Perbaikan" first.',
                ]);
            }
        }

        // Additional validation for waiting_for_submitter transition
        if ($validated['status'] === 'waiting_for_submitter') {
            $diagnosis = $ticket->diagnosis;
            
            // Check if diagnosis exists
            if (!$diagnosis) {
                throw ValidationException::withMessages([
                    'status' => 'Diagnosis must be completed before waiting for submitter',
                ]);
            }
            
            // If diagnosis needs work order, check work_orders_ready flag
            $repairType = $diagnosis->repair_type;
            $needsWorkOrder = in_array($repairType, ['need_sparepart', 'need_vendor', 'need_license']);
            
            if ($needsWorkOrder && !$ticket->work_orders_ready) {
                throw ValidationException::withMessages([
                    'status' => 'Work orders must be ready. Click "Lanjutkan Perbaikan" first.',
                ]);
            }
        }

        // Special handling for marking work orders ready (from "Lanjutkan Perbaikan" button)
        if (isset($validated['mark_work_orders_ready']) && $validated['mark_work_orders_ready']) {
            $ticket->work_orders_ready = 1;
            $validated['notes'] = 'Work orders ready, siap melanjutkan perbaikan';
        }

        $oldStatus = $ticket->status;
        $ticket->status = $validated['status'];
        
        // Save completion data if provided
        if (isset($validated['completion_data'])) {
            $formData = $ticket->form_data ?? [];
            if (is_string($formData)) {
                $formData = json_decode($formData, true) ?? [];
            }
            $formData['completion_info'] = $validated['completion_data'];
            $formData['completed_at'] = now()->toIso8601String();
            $formData['completed_by'] = auth()->user()->name;
            $ticket->form_data = $formData;
        }
        
        $ticket->save();

        // Create timeline entry with additional details
        $details = "Status changed to {$validated['status']}";
        if (isset($validated['notes'])) {
            $details .= " - {$validated['notes']}";
        }
        if (isset($validated['estimated_schedule'])) {
            $details .= " - Estimated: {$validated['estimated_schedule']}";
        }
        if (isset($validated['reject_reason'])) {
            $details .= " - Reason: {$validated['reject_reason']}";
        }

        Timeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'action' => 'STATUS_UPDATED',
            'details' => $details,
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'TICKET_STATUS_UPDATED',
            'details' => "Ticket {$ticket->ticket_number} status changed to {$validated['status']}",
            'ip_address' => request()->ip(),
        ]);

        return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount'));
    }

    /**
     * Approve zoom booking (admin_layanan only)
     * Admin dapat memilih akun zoom berbeda dari yang disarankan
     */
    public function approveZoom(Request $request, Ticket $ticket)
    {
        if ($ticket->type !== 'zoom_meeting') {
            return response()->json(['message' => 'This ticket is not a zoom booking'], 400);
        }

        if (!$this->userHasRole(auth()->user(), 'admin_layanan')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'zoom_meeting_link' => 'required|url',
            'zoom_meeting_id' => 'required|string',
            'zoom_passcode' => 'nullable|string',
            'zoom_account_id' => 'required|exists:zoom_accounts,id',
        ]);

        // Validasi bahwa akun yang dipilih tidak konflik dengan booking lain
        $bookingService = new ZoomBookingService();
        $hasConflict = $bookingService->hasConflict(
            $validated['zoom_account_id'],
            $ticket->zoom_date->format('Y-m-d'),
            $ticket->zoom_start_time,
            $ticket->zoom_end_time,
            $ticket->id
        );

        if ($hasConflict) {
            $conflicts = $bookingService->getConflicts(
                $validated['zoom_account_id'],
                $ticket->zoom_date->format('Y-m-d'),
                $ticket->zoom_start_time,
                $ticket->zoom_end_time,
                $ticket->id
            );
            
            return response()->json([
                'message' => 'Akun zoom yang dipilih bentrok dengan booking lain',
                'conflicts' => $conflicts,
            ], 422);
        }

        $oldStatus = $ticket->status;
        $oldAccountId = $ticket->zoom_account_id;
        
        $ticket->zoom_meeting_link = $validated['zoom_meeting_link'];
        $ticket->zoom_meeting_id = $validated['zoom_meeting_id'];
        $ticket->zoom_passcode = $validated['zoom_passcode'] ?? null;
        $ticket->zoom_account_id = $validated['zoom_account_id']; // Admin bebas pilih akun
        $ticket->status = 'approved';
        $ticket->save();
        
        // Refresh dari database untuk ensure data terbaru
        $ticket->refresh();

        // Create timeline - catat jika akun zoom berubah
        $timelineDetails = "Zoom booking approved";
        if ($oldAccountId !== $ticket->zoom_account_id) {
            $oldAccount = \App\Models\ZoomAccount::find($oldAccountId);
            $newAccount = \App\Models\ZoomAccount::find($ticket->zoom_account_id);
            $timelineDetails .= " - Account changed from {$oldAccount->name} to {$newAccount->name}";
        }
        
        Timeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'action' => 'zoom_approved',
            'details' => $timelineDetails,
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ZOOM_APPROVED',
            'details' => "Zoom booking {$ticket->ticket_number} approved with account {$ticket->zoomAccount->name}",
            'ip_address' => request()->ip(),
        ]);

        return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount'));
    }

    /**
     * Reject zoom meeting (admin_layanan only)
     */
    public function rejectZoom(Request $request, Ticket $ticket)
    {
        if ($ticket->type !== 'zoom_meeting') {
            return response()->json(['message' => 'This ticket is not a zoom booking'], 400);
        }

        if (!$this->userHasRole(auth()->user(), 'admin_layanan')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        $oldStatus = $ticket->status;
        $ticket->zoom_rejection_reason = $validated['reason'];
        $ticket->status = 'rejected';
        $ticket->save();
        
        // Refresh dari database untuk ensure data terbaru
        $ticket->refresh();
        
        // Log untuk debugging
        \Log::info('Zoom ticket rejected', [
            'ticket_id' => $ticket->id,
            'old_status' => $oldStatus,
            'new_status' => $ticket->status,
            'db_status' => $ticket->fresh()->status,
        ]);

        // Create timeline
        Timeline::logStatusChange($ticket->id, auth()->id(), $oldStatus, 'rejected');

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ZOOM_REJECTED',
            'details' => "Zoom booking {$ticket->ticket_number} rejected: {$validated['reason']}",
            'ip_address' => request()->ip(),
        ]);

        return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount'));
    }

    /**
     * Reject perbaikan ticket (admin_layanan only)
     */
    public function rejectTicket(Request $request, Ticket $ticket)
    {
        if (!$this->userHasRole(auth()->user(), 'admin_layanan')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validasi status - hanya tiket submitted yang bisa ditolak
        if (!in_array($ticket->status, ['submitted', 'pending_review'])) {
            return response()->json([
                'message' => 'Only submitted or pending review tickets can be rejected'
            ], 400);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $oldStatus = $ticket->status;
        
        // Simpan alasan penolakan di rejection_reason untuk semua tipe tiket
        $ticket->rejection_reason = $validated['reason'];
        $ticket->status = 'rejected';
        $ticket->save();
        $ticket->refresh();

        // Create timeline
        Timeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'action' => 'ticket_rejected',
            'details' => "Tiket ditolak oleh admin: {$validated['reason']}",
            'metadata' => [
                'old_status' => $oldStatus,
                'new_status' => 'rejected',
                'rejection_reason' => $validated['reason'],
            ],
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'TICKET_REJECTED',
            'details' => "Ticket {$ticket->ticket_number} ({$ticket->type}) rejected: {$validated['reason']}",
            'ip_address' => request()->ip(),
        ]);

        // Notifikasi ke user yang mengajukan
        \App\Models\Notification::create([
            'user_id' => $ticket->user_id,
            'title' => 'Tiket Ditolak',
            'message' => "Tiket {$ticket->ticket_number} ditolak: {$validated['reason']}",
            'type' => 'error',
            'link' => "/tickets/{$ticket->id}",
            'read' => false,
        ]);

        return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount'));
    }

    /**
     * Approve ticket (admin_layanan only)
     * Changes status to 'assigned' for repair tickets
     */
    public function approve(Request $request, Ticket $ticket)
    {
        if (!$this->userHasRole(auth()->user(), 'admin_layanan')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($ticket->type === 'perbaikan') {
            $oldStatus = $ticket->status;
            $ticket->status = 'assigned';
            $ticket->save();
            $ticket->refresh();

            // Create timeline
            Timeline::logStatusChange($ticket->id, auth()->id(), $oldStatus, 'assigned');

            // Audit log
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'TICKET_APPROVED',
                'details' => "Ticket {$ticket->ticket_number} approved and status changed to assigned",
                'ip_address' => request()->ip(),
            ]);

            // Notification to user
            \App\Models\Notification::create([
                'user_id' => $ticket->user_id,
                'title' => 'Tiket Disetujui',
                'message' => "Tiket {$ticket->ticket_number} telah disetujui dan sedang menunggu teknisi",
                'type' => 'success',
                'link' => "/tickets/{$ticket->id}",
                'read' => false,
            ]);

            return new TicketResource($ticket->load('user', 'assignedUser', 'category', 'timeline.user', 'zoomAccount'));
        }

        return response()->json(['message' => 'Invalid ticket type for this action'], 400);
    }

    /**
     * Helper method to check ticket access
     */
    private function authorizeTicketAccess(Ticket $ticket)
    {
        $user = auth()->user();
        $userRoles = $user->roles ?? [];

        // Admin can see all
        if (in_array('admin_layanan', $userRoles) || in_array('super_admin', $userRoles)) {
            return true;
        }

        // Admin penyedia can see tickets with work orders
        if (in_array('admin_penyedia', $userRoles)) {
            // Check if ticket has work orders
            if ($ticket->workOrders()->exists()) {
                return true;
            }
        }

        // Teknisi can see assigned tickets
        if (in_array('teknisi', $userRoles) && $ticket->assigned_to === $user->id) {
            return true;
        }

        // Pegawai can only see their own
        if ($ticket->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }
    }

    /**
     * Get calendar grid data for zoom bookings
     * Supports different view modes: daily, weekly, monthly
     */
    public function calendarGrid(Request $request)
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'month' => 'nullable|date_format:Y-m',
            'view' => 'nullable|in:daily,weekly,monthly',
        ]);

        $view = $validated['view'] ?? 'monthly';
        $query = Ticket::where('type', 'zoom_meeting')
            ->whereIn('status', ['approved', 'pending_review'])
            ->with('user', 'zoomAccount');

        // Role-based filtering - untuk calendarGrid, semua user bisa lihat semua booking
        // Tapi detail sensitif (meeting link, passcode) akan disembunyikan untuk booking milik orang lain
        $user = auth()->user();

        // Filter by date/month based on view type
        if ($view === 'daily' && !empty($validated['date'])) {
            $date = $validated['date'];
            $query->whereDate('zoom_date', $date);
        } elseif ($view === 'monthly' && !empty($validated['month'])) {
            $month = $validated['month'];
            $query->whereRaw("DATE_FORMAT(zoom_date, '%Y-%m') = ?", [$month]);
        } elseif ($view === 'weekly' && !empty($validated['date'])) {
            // Get week start (Monday) and end (Sunday)
            $date = \Carbon\Carbon::createFromFormat('Y-m-d', $validated['date']);
            $weekStart = $date->copy()->startOfWeek();
            $weekEnd = $date->copy()->endOfWeek();
            $query->whereBetween('zoom_date', [$weekStart, $weekEnd]);
        }

        $tickets = $query->orderBy('zoom_date', 'asc')->orderBy('zoom_start_time', 'asc')->get();

        // Transform tickets for calendar display
        $calendarData = $tickets->map(function ($ticket) use ($user) {
            $isOwner = $user && $ticket->user_id == $user->id;
            $isAdmin = false;
            
            if ($user) {
                $userRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
                $isAdmin = in_array('admin_layanan', $userRoles) || in_array('super_admin', $userRoles);
            }
            
            // Detail sensitif hanya untuk owner dan admin
            $canSeeDetails = $isOwner || $isAdmin;
            
            return [
                'id' => $ticket->id,
                'ticketNumber' => $ticket->ticket_number,
                'title' => $ticket->title,
                'description' => $canSeeDetails ? $ticket->description : null,
                'date' => $ticket->zoom_date,
                'startTime' => $ticket->zoom_start_time,
                'endTime' => $ticket->zoom_end_time,
                'status' => $ticket->status,
                'userName' => $ticket->user?->name,
                'userId' => $ticket->user_id,
                'type' => $ticket->type,
                'zoomAccountId' => $ticket->zoom_account_id,
                'zoomAccount' => $ticket->zoomAccount ? [
                    'id' => $ticket->zoomAccount->id,
                    'accountId' => $ticket->zoomAccount->account_id,
                    'name' => $ticket->zoomAccount->name,
                    'email' => $ticket->zoomAccount->email,
                    'hostKey' => $canSeeDetails ? $ticket->zoomAccount->host_key : null,
                    'color' => $ticket->zoomAccount->color,
                ] : null,
                'meetingLink' => $canSeeDetails ? $ticket->zoom_meeting_link : null,
                'passcode' => $canSeeDetails ? $ticket->zoom_passcode : null,
                'coHosts' => $canSeeDetails ? ($ticket->zoom_co_hosts ?? []) : [],
                'rejectionReason' => $ticket->zoom_rejection_reason,
                'isOwner' => $isOwner,
                'canSeeDetails' => $canSeeDetails,
            ];
        });

        return response()->json([
            'success' => true,
            'view' => $view,
            'data' => $calendarData,
            'count' => $calendarData->count(),
        ]);
    }

    /**
     * Get dashboard statistics for current user based on role
     */
    public function dashboardStats(Request $request)
    {
        $query = Ticket::query();
        $user = auth()->user();
        
        // Apply role-based filtering
        if ($user) {
            $scope = $request->get('scope');
            if ($scope === 'my') {
                $query->where('user_id', $user->id);
            } elseif ($scope === 'assigned') {
                $query->where('assigned_to', $user->id);
            } else {
                $userRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
                if (!in_array('admin_layanan', $userRoles) && 
                    !in_array('super_admin', $userRoles) &&
                    !in_array('teknisi', $userRoles)) {
                    // Pegawai can only see their own tickets
                    $query->where('user_id', $user->id);
                } elseif (in_array('teknisi', $userRoles) && !in_array('admin_layanan', $userRoles) && !in_array('super_admin', $userRoles)) {
                    // Teknisi can only see assigned tickets
                    $query->where('assigned_to', $user->id);
                }
            }
        }

        $total = $query->count();
        
        // Sedang proses: status != {rejected, cancelled, closed, closed_unrepairable}
        $inProgress = (clone $query)->whereNotIn('status', [
            'rejected', 'dibatalkan', 'cancelled', 'closed', 'selesai', 'closed_unrepairable'
        ])->count();
        
        // Completed: status IN {closed, selesai, approved}
        $completed = (clone $query)->whereIn('status', [
            'closed', 'selesai', 'approved'
        ])->count();
        
        // Rejected: status IN {closed_unrepairable, ditolak, rejected, dibatalkan, cancelled}
        $rejected = (clone $query)->whereIn('status', [
            'closed_unrepairable', 'ditolak', 'rejected', 'dibatalkan', 'cancelled'
        ])->count();
        
        // Completion rate
        $completionRate = $total > 0 ? ($completed / $total) * 100 : 0;
        
        // Count by type
        $perbaikan = (clone $query)->where('type', 'perbaikan')->count();
        $zoom = (clone $query)->where('type', 'zoom_meeting')->count();

        return response()->json([
            'success' => true,
            'stats' => [
                'total' => $total,
                'in_progress' => $inProgress,
                'completed' => $completed,
                'rejected' => $rejected,
                'completion_rate' => round($completionRate, 2),
                'perbaikan' => $perbaikan,
                'zoom' => $zoom,
            ],
        ]);
    }

    /**
     * Get zoom booking statistics (counts by status) for current user
     */
    public function zoomBookingStats(Request $request)
    {
        $query = Ticket::where('type', 'zoom_meeting');
        $user = auth()->user();
        
        // Apply role-based filtering
        if ($user) {
            $userRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
            if (!in_array('admin_layanan', $userRoles) && 
                !in_array('super_admin', $userRoles)) {
                // Pegawai can only see their own bookings
                $query->where('user_id', $user->id);
            }
        }

        $all = $query->count();
        $pending = (clone $query)->where('status', 'pending_review')->count();
        $approved = (clone $query)->where('status', 'approved')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();

        return response()->json([
            'success' => true,
            'stats' => [
                'all' => $all,
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
            ],
        ]);
    }

    /**
     * Get paginated zoom meeting bookings for current user with optional status filter
     */
    public function zoomBookings(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:pending_review,approved,rejected',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Ticket::where('type', 'zoom_meeting')
            ->with('user', 'zoomAccount')
            ->orderBy('created_at', 'desc');

        $user = auth()->user();
        
        // Apply role-based filtering
        if ($user) {
            $userRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
            if (!in_array('admin_layanan', $userRoles) && 
                !in_array('super_admin', $userRoles)) {
                // Pegawai can only see their own bookings
                $query->where('user_id', $user->id);
            }
        }

        // Apply status filter if provided
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $perPage = $validated['per_page'] ?? 15;
        $page = $validated['page'] ?? 1;
        
        $tickets = $query->paginate($perPage, ['*'], 'page', $page);

        // Transform tickets for booking display
        $bookings = $tickets->map(function ($ticket) {
            return [
                'id' => $ticket->id,
                'ticketNumber' => $ticket->ticket_number,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'date' => $ticket->zoom_date,
                'startTime' => $ticket->zoom_start_time,
                'endTime' => $ticket->zoom_end_time,
                'status' => $ticket->status,
                'estimatedParticipants' => $ticket->zoom_estimated_participants,
                'userName' => $ticket->user?->name,
                'userId' => $ticket->user_id,
                'zoomAccountId' => $ticket->zoom_account_id,
                'zoomAccount' => $ticket->zoomAccount ? [
                    'id' => $ticket->zoomAccount->id,
                    'name' => $ticket->zoomAccount->name,
                    'email' => $ticket->zoomAccount->email,
                    'color' => $ticket->zoomAccount->color,
                ] : null,
                'meetingLink' => $ticket->zoom_meeting_link,
                'passcode' => $ticket->zoom_passcode,
                'coHosts' => $ticket->zoom_co_hosts ?? [],
                'rejectionReason' => $ticket->zoom_rejection_reason,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $bookings,
            'pagination' => [
                'total' => $tickets->total(),
                'per_page' => $tickets->perPage(),
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'from' => $tickets->firstItem(),
                'to' => $tickets->lastItem(),
                'has_more' => $tickets->hasMorePages(),
            ],
        ]);
    }
}
