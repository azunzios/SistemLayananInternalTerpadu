<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\Asset;
use App\Models\Timeline;
use App\Models\WorkOrder;
use App\Http\Resources\TicketResource;
use App\Models\AuditLog;
use App\Traits\HasRoleHelper;
use App\Services\ZoomBookingService;
use App\Services\TicketNotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class TicketController extends Controller
{
    use HasRoleHelper;
    /**
     * Get all tickets with filtering
     */
    public function index(Request $request)
    {
        $query = Ticket::with('user', 'assignedUser', 'timeline.user', 'zoomAccount', 'comments', 'diagnosis.technician');

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
                // Explicit "my tickets": tiket yang dibuat oleh user (bukan yang di-assign)
                $query->where('user_id', $user->id);
            } elseif ($scope === 'assigned') {
                // Explicit "assigned": tiket yang di-assign ke user
                $query->where('assigned_to', $user->id);
            } elseif ($scope === 'perbaikan_tickets') {
                // Admin penyedia: semua tiket perbaikan
                $query->where('type', 'perbaikan');
            } else {
                // Use active role (single column) for filtering, not roles array
                $activeRole = $user->role ?? 'pegawai';
                
                if ($activeRole === 'pegawai') {
                    // Pegawai can only see their own tickets
                    $query->where('user_id', $user->id);
                } elseif ($activeRole === 'teknisi') {
                    // Teknisi can only see assigned tickets
                    $query->where('assigned_to', $user->id);
                }
                // admin_layanan, admin_penyedia, super_admin can see all tickets
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

        return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount', 'comments.user', 'comments.replies.user', 'diagnosis.technician', 'workOrders', 'feedback.user'));
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
        
        // Completed: tiket closed, completed, rejected (perbaikan & zoom), dan approved (zoom)
        $completed = (clone $allTickets)->where(function ($q) {
            $q->whereIn('status', ['closed', 'completed'])
              ->orWhere(function ($q2) {
                  // Tiket perbaikan yang rejected dianggap completed
                  $q2->where('type', 'perbaikan')->where('status', 'rejected');
              })
              ->orWhere(function ($q3) {
                  // Tiket zoom yang approved dianggap completed
                  $q3->where('type', 'zoom_meeting')->where('status', 'approved');
              })
              ->orWhere(function ($q4) {
                  // Tiket zoom yang rejected dianggap completed
                  $q4->where('type', 'zoom_meeting')->where('status', 'rejected');
              });
        })->count();
        
        $rejected = (clone $allTickets)->whereIn('status', [
            'closed_unrepairable', 'cancelled'
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
     * Get super admin dashboard statistics
     * Returns: stats, ticketsByType, usersByRole
     */
    public function superAdminDashboardStats(Request $request)
    {
        // Total users
        $totalUsers = \App\Models\User::count();
        // Active users = users who are not soft-deleted (simplified since last_login_at doesn't exist)
        $activeUsers = $totalUsers;

        // Total BMN assets
        $totalAssets = \App\Models\Asset::count();

        // Total tickets
        $totalTickets = Ticket::count();
        
        // Tickets by status
        $pendingTickets = Ticket::whereIn('status', [
            'submitted', 'pending_review'
        ])->count();
        
        $completedTickets = Ticket::whereIn('status', [
            'closed', 'selesai', 'approved'
        ])->count();
        
        $rejectedTickets = Ticket::whereIn('status', [
            'closed_unrepairable', 'ditolak', 'rejected', 'dibatalkan', 'cancelled'
        ])->count();

        // Tickets last 7 days
        $ticketsLast7Days = Ticket::where('created_at', '>=', now()->subDays(7))->count();
        
        // Tickets last 30 days
        $ticketsLast30Days = Ticket::where('created_at', '>=', now()->subDays(30))->count();

        // Average resolution time (in hours) - for closed tickets only
        $closedTickets = Ticket::whereIn('status', ['closed', 'selesai'])->get();
        $avgResolutionTime = 0;
        if ($closedTickets->count() > 0) {
            $totalHours = 0;
            foreach ($closedTickets as $ticket) {
                $createdAt = \Carbon\Carbon::parse($ticket->created_at);
                $updatedAt = \Carbon\Carbon::parse($ticket->updated_at);
                $totalHours += $createdAt->diffInHours($updatedAt);
            }
            $avgResolutionTime = round($totalHours / $closedTickets->count(), 1);
        }

        // Tickets by type
        $ticketsByType = [
            [
                'name' => 'Perbaikan',
                'value' => Ticket::where('type', 'perbaikan')->count()
            ],
            [
                'name' => 'Zoom Meeting',
                'value' => Ticket::where('type', 'zoom_meeting')->count()
            ],
        ];

        // Users by role - count from roles array (JSON column)
        // Each user can have multiple roles, so we count each role occurrence
        $usersByRole = [];
        $roleLabels = [
            'super_admin' => 'Super Admin',
            'admin_layanan' => 'Admin Layanan',
            'admin_penyedia' => 'Admin Penyedia',
            'teknisi' => 'Teknisi',
            'pegawai' => 'Pegawai',
        ];
        
        $rolesList = ['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai'];
        
        foreach ($rolesList as $role) {
            // Count users who have this role in their roles array
            $count = \App\Models\User::whereJsonContains('roles', $role)->count();
            
            // Fallback for non-JSON or if whereJsonContains doesn't work
            if ($count === 0) {
                $allUsers = \App\Models\User::all();
                foreach ($allUsers as $user) {
                    $userRoles = is_string($user->roles) ? json_decode($user->roles, true) : $user->roles;
                    if (is_array($userRoles) && in_array($role, $userRoles)) {
                        $count++;
                    }
                }
            }
            
            if ($count > 0) {
                $usersByRole[] = [
                    'name' => $roleLabels[$role] ?? ucfirst($role),
                    'value' => $count
                ];
            }
        }

        return response()->json([
            'stats' => [
                'totalUsers' => $totalUsers,
                'activeUsers' => $activeUsers,
                'totalAssets' => $totalAssets,
                'totalTickets' => $totalTickets,
                'pendingTickets' => $pendingTickets,
                'completedTickets' => $completedTickets,
                'rejectedTickets' => $rejectedTickets,
                'ticketsLast7Days' => $ticketsLast7Days,
                'ticketsLast30Days' => $ticketsLast30Days,
                'avgResolutionTime' => $avgResolutionTime,
            ],
            'ticketsByType' => $ticketsByType,
            'usersByRole' => $usersByRole,
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
        
        // Closed tiket: status closed + perbaikan rejected + zoom approved + zoom rejected
        $closedCount = Ticket::where(function ($q) {
            $q->where('status', 'closed')
              ->orWhere(function ($q2) {
                  // Tiket perbaikan yang rejected dianggap closed
                  $q2->where('type', 'perbaikan')->where('status', 'rejected');
              })
              ->orWhere(function ($q3) {
                  // Tiket zoom yang approved dianggap closed
                  $q3->where('type', 'zoom_meeting')->where('status', 'approved');
              })
              ->orWhere(function ($q4) {
                  // Tiket zoom yang rejected dianggap closed
                  $q4->where('type', 'zoom_meeting')->where('status', 'rejected');
              });
        })->count();
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
                    // "my tickets": tiket yang dibuat user
                    $query->where('user_id', $user->id);
                } elseif ($scope === 'assigned') {
                    // "assigned": tiket yang di-assign ke user
                    $query->where('assigned_to', $user->id);
                } elseif ($scope === 'perbaikan_tickets') {
                    // Admin penyedia: semua tiket perbaikan
                    $query->where('type', 'perbaikan');
                } else {
                    // Use active role (single column) for filtering
                    $activeRole = $user->role ?? 'pegawai';
                    
                    if ($activeRole === 'pegawai') {
                        // Pegawai can only see their own tickets
                        $query->where('user_id', $user->id);
                    } elseif ($activeRole === 'teknisi') {
                        // Teknisi can only see assigned tickets
                        $query->where('assigned_to', $user->id);
                    }
                    // admin_layanan, admin_penyedia, super_admin can see all tickets
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
        // Get all users with active role 'teknisi' OR have 'teknisi' in their roles array
        // We fetch based on roles array since this is for admin to see all potential technicians
        $technicians = \App\Models\User::whereJsonContains('roles', 'teknisi')->get();
        
        // Fallback if roles is not JSON or empty result
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
            'kode_barang' => 'required_if:type,perbaikan|string',
            'nup' => 'required_if:type,perbaikan|string',
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
            $asset = Asset::where('kode_barang', $validated['kode_barang'])
                ->where('nup', $validated['nup'])
                ->first();

            if (!$asset) {
                throw ValidationException::withMessages([
                    'kode_barang' => ['Barang dengan kode dan NUP ini tidak ditemukan di database'],
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
            $ticket->kode_barang = $validated['kode_barang'];
            $ticket->nup = $validated['nup'];
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

        // Notifikasi ke admin_layanan
        TicketNotificationService::onTicketCreated($ticket);

        return response()->json(new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount')), 201);
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

        return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount'));
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

        // Notifikasi ke teknisi dan pelapor
        TicketNotificationService::onTicketAssigned($ticket);

        return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount'));
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

        // Notifikasi ke pelapor
        TicketNotificationService::onStatusChanged($ticket, $oldStatus, 'approved');

        return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user'));
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

        // Notifikasi perubahan status
        if ($validated['status'] === 'closed') {
            TicketNotificationService::onTicketClosed($ticket);
        } else {
            TicketNotificationService::onStatusChanged($ticket, $oldStatus, $validated['status']);
        }

        return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount'));
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

        // Notifikasi ke pelapor
        TicketNotificationService::onZoomApproved($ticket);

        return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount'));
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

        // Notifikasi ke pelapor
        TicketNotificationService::onZoomRejected($ticket, $validated['reason']);

        return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount'));
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
        // Status tetap rejected agar jelas, tapi diperlakukan sebagai closed (tidak bisa diubah)
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

        // Notifikasi ke pelapor
        TicketNotificationService::onStatusChanged($ticket, $oldStatus, 'rejected');

        return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount'));
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

            // Notifikasi ke pelapor
            TicketNotificationService::onStatusChanged($ticket, $oldStatus, 'assigned');

            return new TicketResource($ticket->load('user', 'assignedUser', 'timeline.user', 'zoomAccount'));
        }

        return response()->json(['message' => 'Invalid ticket type for this action'], 400);
    }

    /**
     * Helper method to check ticket access
     */
    private function authorizeTicketAccess(Ticket $ticket)
    {
        $user = auth()->user();
        $activeRole = $user->role ?? 'pegawai';

        // Admin can see all
        if (in_array($activeRole, ['admin_layanan', 'super_admin'])) {
            return true;
        }

        // Admin penyedia can see tickets with work orders
        if ($activeRole === 'admin_penyedia') {
            // Check if ticket has work orders
            if ($ticket->workOrders()->exists()) {
                return true;
            }
        }

        // Teknisi can see assigned tickets
        if ($activeRole === 'teknisi' && $ticket->assigned_to === $user->id) {
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

        // Calendar grid: SEMUA user bisa lihat SEMUA booking (untuk tahu slot terpakai)
        // Tapi detail sensitif (meeting link, passcode) hanya untuk owner dan admin
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
            $activeRole = $user->role ?? 'pegawai';
            $isAdmin = in_array($activeRole, ['admin_layanan', 'super_admin']);
            
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
                'duration' => $ticket->zoom_duration,
                'estimatedParticipants' => $ticket->zoom_estimated_participants,
                'breakoutRooms' => $ticket->zoom_breakout_rooms,
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
                // Use active role for filtering
                $activeRole = $user->role ?? 'pegawai';
                
                if ($activeRole === 'pegawai') {
                    // Pegawai can only see their own tickets
                    $query->where('user_id', $user->id);
                } elseif ($activeRole === 'teknisi') {
                    // Teknisi can only see assigned tickets
                    $query->where('assigned_to', $user->id);
                }
                // admin_layanan, admin_penyedia, super_admin can see all
            }
        }

        $total = $query->count();
        
        // Completed: status IN {closed, selesai, approved, rejected, closed_unrepairable, ditolak, dibatalkan, cancelled}
        // Untuk zoom meeting: approved/rejected = selesai
        // Untuk perbaikan: closed/selesai/rejected = selesai
        $completed = (clone $query)->whereIn('status', [
            'closed', 'selesai', 'approved', 'rejected', 'closed_unrepairable', 'ditolak', 'dibatalkan', 'cancelled'
        ])->count();
        
        // Rejected: status IN {closed_unrepairable, ditolak, rejected, dibatalkan, cancelled}
        $rejected = (clone $query)->whereIn('status', [
            'closed_unrepairable', 'ditolak', 'rejected', 'dibatalkan', 'cancelled'
        ])->count();
        
        // Sedang proses: total - completed
        $inProgress = $total - $completed;
        
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
            $activeRole = $user->role ?? 'pegawai';
            
            // Pegawai can only see their own bookings
            if ($activeRole === 'pegawai') {
                $query->where('user_id', $user->id);
            }
            // admin_layanan, admin_penyedia, super_admin, teknisi can see all
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
            $activeRole = $user->role ?? 'pegawai';
            
            // Pegawai can only see their own bookings
            if ($activeRole === 'pegawai') {
                $query->where('user_id', $user->id);
            }
            // admin_layanan, admin_penyedia, super_admin, teknisi can see all
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
                'duration' => $ticket->zoom_duration,
                'status' => $ticket->status,
                'estimatedParticipants' => $ticket->zoom_estimated_participants,
                'breakoutRooms' => $ticket->zoom_breakout_rooms,
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

    /**
     * Export zoom tickets to Excel
     * GET /tickets/export/zoom
     */
    public function exportZoom(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Check role - hanya admin_layanan dan super_admin
        $activeRole = $user->role ?? 'pegawai';
        if (!in_array($activeRole, ['super_admin', 'admin_layanan'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Get all zoom tickets with relations
        $tickets = Ticket::where('type', 'zoom_meeting')
            ->with(['user', 'zoomAccount'])
            ->orderBy('created_at', 'desc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Tiket Zoom Meeting');

        // Header columns
        $headers = [
            'A1' => 'No',
            'B1' => 'Nomor Tiket',
            'C1' => 'Judul Meeting',
            'D1' => 'Deskripsi',
            'E1' => 'Tanggal Meeting',
            'F1' => 'Waktu Mulai',
            'G1' => 'Waktu Selesai',
            'H1' => 'Durasi (menit)',
            'I1' => 'Estimasi Peserta',
            'J1' => 'Co-Hosts',
            'K1' => 'Breakout Rooms',
            'L1' => 'Status',
            'M1' => 'Nama Pemohon',
            'N1' => 'Email Pemohon',
            'O1' => 'Unit Kerja',
            'P1' => 'Akun Zoom (ID)',
            'Q1' => 'Nama Akun Zoom',
            'R1' => 'Email Akun Zoom',
            'S1' => 'Link Meeting',
            'T1' => 'Passcode',
            'U1' => 'Alasan Penolakan',
            'V1' => 'Tanggal Dibuat',
            'W1' => 'Tanggal Diupdate',
        ];

        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }

        // Bold header
        $sheet->getStyle('A1:W1')->getFont()->setBold(true);
        $sheet->getStyle('A1:W1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE0E0E0');

        // Status label mapping
        $statusLabels = [
            'pending_review' => 'Menunggu Review',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'cancelled' => 'Dibatalkan',
            'completed' => 'Selesai',
        ];

        // Data rows
        $row = 2;
        $no = 1;
        foreach ($tickets as $ticket) {
            // Format co-hosts
            $coHosts = '';
            if ($ticket->zoom_co_hosts) {
                $hosts = is_string($ticket->zoom_co_hosts) 
                    ? json_decode($ticket->zoom_co_hosts, true) 
                    : $ticket->zoom_co_hosts;
                if (is_array($hosts)) {
                    $coHosts = implode(', ', array_map(function($h) {
                        return ($h['name'] ?? '') . ' (' . ($h['email'] ?? '') . ')';
                    }, $hosts));
                }
            }

            $sheet->setCellValue('A' . $row, $no);
            $sheet->setCellValue('B' . $row, $ticket->ticket_number);
            $sheet->setCellValue('C' . $row, $ticket->title);
            $sheet->setCellValue('D' . $row, $ticket->description);
            $sheet->setCellValue('E' . $row, $ticket->zoom_date ? $ticket->zoom_date->format('Y-m-d') : '');
            $sheet->setCellValue('F' . $row, $ticket->zoom_start_time);
            $sheet->setCellValue('G' . $row, $ticket->zoom_end_time);
            $sheet->setCellValue('H' . $row, $ticket->zoom_duration);
            $sheet->setCellValue('I' . $row, $ticket->zoom_estimated_participants);
            $sheet->setCellValue('J' . $row, $coHosts);
            $sheet->setCellValue('K' . $row, $ticket->zoom_breakout_rooms ?? 0);
            $sheet->setCellValue('L' . $row, $statusLabels[$ticket->status] ?? $ticket->status);
            $sheet->setCellValue('M' . $row, $ticket->user?->name ?? '-');
            $sheet->setCellValue('N' . $row, $ticket->user?->email ?? '-');
            $sheet->setCellValue('O' . $row, $ticket->user?->unit_kerja ?? '-');
            $sheet->setCellValue('P' . $row, $ticket->zoom_account_id ?? '-');
            $sheet->setCellValue('Q' . $row, $ticket->zoomAccount?->name ?? '-');
            $sheet->setCellValue('R' . $row, $ticket->zoomAccount?->email ?? '-');
            $sheet->setCellValue('S' . $row, $ticket->zoom_meeting_link ?? '-');
            $sheet->setCellValue('T' . $row, $ticket->zoom_passcode ?? '-');
            $sheet->setCellValue('U' . $row, $ticket->zoom_rejection_reason ?? '-');
            $sheet->setCellValue('V' . $row, $ticket->created_at?->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'));
            $sheet->setCellValue('W' . $row, $ticket->updated_at?->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'));

            $row++;
            $no++;
        }

        // Auto-size columns
        foreach (range('A', 'W') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Generate file
        $filename = 'tiket_zoom_' . date('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        
        $tempFile = tempnam(sys_get_temp_dir(), 'zoom_export_');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Export all tickets to Excel
     * GET /tickets/export/all
     */
    public function exportAll(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Get all tickets with relations
        $tickets = Ticket::with(['user', 'assignedUser', 'zoomAccount', 'diagnosis'])
            ->orderBy('created_at', 'desc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Semua Tiket');

        // Header columns
        $headers = [
            'No', 'Nomor Tiket', 'Tipe', 'Judul', 'Deskripsi', 'Status',
            'Nama Pemohon', 'Email Pemohon', 'Unit Kerja',
            'Teknisi Ditugaskan', 'Kode Aset', 'NUP', 'Nama Aset',
            'Kondisi Fisik', 'Dapat Diperbaiki', 'Rekomendasi Perbaikan',
            'Tanggal Zoom', 'Waktu Mulai', 'Waktu Selesai', 'Link Meeting',
            'Tanggal Dibuat', 'Tanggal Diupdate'
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('4472C4');
            $sheet->getStyle($col . '1')->getFont()->getColor()->setRGB('FFFFFF');
            $col++;
        }

        // Status labels
        $statusLabels = [
            'submitted' => 'Diajukan',
            'pending_review' => 'Menunggu Review',
            'assigned' => 'Ditugaskan',
            'in_progress' => 'Dalam Proses',
            'on_hold' => 'Ditunda',
            'waiting_for_submitter' => 'Menunggu Pelapor',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'cancelled' => 'Dibatalkan',
            'closed' => 'Selesai',
            'completed' => 'Selesai',
        ];

        $typeLabels = [
            'perbaikan' => 'Perbaikan',
            'zoom_meeting' => 'Zoom Meeting',
        ];

        // Data rows
        $row = 2;
        $no = 1;
        foreach ($tickets as $ticket) {
            $formData = is_string($ticket->form_data) 
                ? json_decode($ticket->form_data, true) 
                : ($ticket->form_data ?? []);
            
            $diagnosis = $ticket->diagnosis;

            // Get asset info - prioritas dari kolom ticket, fallback ke form_data
            $kodeBarang = $ticket->kode_barang ?? $formData['asset_code'] ?? $formData['kode_barang'] ?? '-';
            $nup = $ticket->nup ?? $formData['nup'] ?? $formData['asset_nup'] ?? '-';
            $namaBarang = $formData['asset_name'] ?? $formData['nama_barang'] ?? '-';

            $sheet->setCellValue('A' . $row, $no);
            $sheet->setCellValue('B' . $row, $ticket->ticket_number);
            $sheet->setCellValue('C' . $row, $typeLabels[$ticket->type] ?? $ticket->type);
            $sheet->setCellValue('D' . $row, $ticket->title);
            $sheet->setCellValue('E' . $row, $ticket->description);
            $sheet->setCellValue('F' . $row, $statusLabels[$ticket->status] ?? $ticket->status);
            $sheet->setCellValue('G' . $row, $ticket->user?->name ?? '-');
            $sheet->setCellValue('H' . $row, $ticket->user?->email ?? '-');
            $sheet->setCellValue('I' . $row, $ticket->user?->unit_kerja ?? '-');
            $sheet->setCellValue('J' . $row, $ticket->assignedUser?->name ?? '-');
            $sheet->setCellValue('K' . $row, $kodeBarang);
            $sheet->setCellValue('L' . $row, $nup);
            $sheet->setCellValue('M' . $row, $namaBarang);
            $sheet->setCellValue('N' . $row, $diagnosis?->physical_condition ?? '-');
            $sheet->setCellValue('O' . $row, $diagnosis ? ($diagnosis->is_repairable ? 'Ya' : 'Tidak') : '-');
            $sheet->setCellValue('P' . $row, $diagnosis?->repair_recommendation ?? '-');
            $sheet->setCellValue('Q' . $row, $ticket->zoom_date ? $ticket->zoom_date->format('Y-m-d') : '-');
            $sheet->setCellValue('R' . $row, $ticket->zoom_start_time ?? '-');
            $sheet->setCellValue('S' . $row, $ticket->zoom_end_time ?? '-');
            $sheet->setCellValue('T' . $row, $ticket->zoom_meeting_link ?? '-');
            $sheet->setCellValue('U' . $row, $ticket->created_at?->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'));
            $sheet->setCellValue('V' . $row, $ticket->updated_at?->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'));

            $row++;
            $no++;
        }

        // Auto-size columns
        foreach (range('A', 'V') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Generate file
        $filename = 'laporan_tiket_' . date('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        
        $tempFile = tempnam(sys_get_temp_dir(), 'ticket_export_');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Store feedback for a ticket
     * POST /tickets/{ticket}/feedback
     */
    public function storeFeedback(Request $request, Ticket $ticket)
    {
        // Validate request
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback_text' => 'nullable|string|max:1000',
        ]);

        // Check if user is the ticket creator
        if ($ticket->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk memberikan feedback pada tiket ini',
            ], 403);
        }

        // Check if ticket is closed
        if (!in_array($ticket->status, ['closed', 'selesai', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback hanya dapat diberikan untuk tiket yang sudah selesai',
            ], 400);
        }

        // Check if feedback already exists
        if ($ticket->feedback) {
            // Update existing feedback
            $ticket->feedback->update([
                'rating' => $validated['rating'],
                'feedback_text' => $validated['feedback_text'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Feedback berhasil diperbarui',
                'data' => $ticket->feedback,
            ], 200);
        }

        // Create new feedback
        $feedback = $ticket->feedback()->create([
            'user_id' => auth()->id(),
            'rating' => $validated['rating'],
            'feedback_text' => $validated['feedback_text'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih atas feedback Anda',
            'data' => $feedback,
        ], 201);
    }

    /**
     * Get feedback for a ticket
     * GET /tickets/{ticket}/feedback
     */
    public function getFeedback(Ticket $ticket)
    {
        $feedback = $ticket->feedback()->with('user')->first();

        if (!$feedback) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback tidak ditemukan',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $feedback->id,
                'ticket_id' => $feedback->ticket_id,
                'user_id' => $feedback->user_id,
                'user_name' => $feedback->user->name,
                'rating' => $feedback->rating,
                'feedback_text' => $feedback->feedback_text,
                'created_at' => $feedback->created_at?->toISOString(),
                'updated_at' => $feedback->updated_at?->toISOString(),
            ],
        ], 200);
    }
}
