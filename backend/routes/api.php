<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\WorkOrderController;
use App\Http\Controllers\SparepartRequestController;
use App\Http\Controllers\KartuKendaliController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ZoomAccountController;
use App\Http\Controllers\CommentController;

Route::post('/login', [AuthController::class, 'login']);

// Public endpoints (no auth required)
Route::get('/categories/by-type/{type}', [CategoryController::class, 'getByType']);
Route::get('/categories/meta/field-types', [CategoryController::class, 'getFieldTypes']);
Route::get('/categories/meta/category-types', [CategoryController::class, 'getCategoryTypes']);

Route::middleware('auth:sanctum')->group(function () {
    // Profile routes
    Route::get('/profile', [UserController::class, 'getCurrentUser']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::post('/change-password', [UserController::class, 'changePassword']);
    Route::post('/upload-avatar', [UserController::class, 'uploadAvatar']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // User Management Routes (admin only - will add middleware)
    Route::apiResource('users', UserController::class);
    Route::patch('/users/{user}/roles', [UserController::class, 'updateRoles']);
    Route::post('/users/bulk/update', [UserController::class, 'bulkUpdate']);
    
    // Category Management Routes
    Route::apiResource('categories', CategoryController::class);
    
    // Asset Management Routes
    Route::apiResource('assets', AssetController::class);
    Route::get('/assets/search/by-code-nup', [AssetController::class, 'searchByCodeAndNup']);
    Route::get('/assets/meta/types', [AssetController::class, 'getTypes']);
    Route::get('/assets/meta/conditions', [AssetController::class, 'getConditions']);
    
    // Ticket Management Routes - Specific routes FIRST (before apiResource)
    Route::get('/tickets-counts', [TicketController::class, 'counts']);
    Route::get('/tickets/stats/dashboard', [TicketController::class, 'dashboardStats']);
    Route::get('/tickets/stats/admin-dashboard', [TicketController::class, 'adminDashboardStats']);
    Route::get('/tickets/stats/zoom-bookings', [TicketController::class, 'zoomBookingStats']);
    Route::get('/tickets/zoom-bookings', [TicketController::class, 'zoomBookings']);
    Route::get('/tickets/calendar/grid', [TicketController::class, 'calendarGrid']);
    
    // Generic resource routes AFTER specific routes
    Route::apiResource('tickets', TicketController::class);
    Route::patch('/tickets/{ticket}/assign', [TicketController::class, 'assign']);
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::patch('/tickets/{ticket}/approve-zoom', [TicketController::class, 'approveZoom']);
    Route::patch('/tickets/{ticket}/reject-zoom', [TicketController::class, 'rejectZoom']);
    Route::patch('/tickets/{ticket}/reject', [TicketController::class, 'rejectTicket']);
    Route::get('/technician-stats', [TicketController::class, 'technicianStats']);
    Route::patch('/tickets/{ticket}/approve', [TicketController::class, 'approve']);

    // Comment Management Routes (Diskusi/Percakapan)
    Route::get('/tickets/{ticket}/comments', [CommentController::class, 'index']);
    Route::post('/tickets/{ticket}/comments', [CommentController::class, 'store']);

    // Work Order Management Routes
    Route::apiResource('work-orders', WorkOrderController::class);
    Route::patch('/work-orders/{workOrder}/status', [WorkOrderController::class, 'updateStatus']);
    Route::get('/work-orders/stats/summary', [WorkOrderController::class, 'stats']);
    
    // Sparepart Request Management Routes
    Route::apiResource('sparepart-requests', SparepartRequestController::class);
    Route::patch('/sparepart-requests/{sparepartRequest}/approve', [SparepartRequestController::class, 'approve']);
    Route::patch('/sparepart-requests/{sparepartRequest}/reject', [SparepartRequestController::class, 'reject']);
    Route::patch('/sparepart-requests/{sparepartRequest}/fulfill', [SparepartRequestController::class, 'fulfill']);
    Route::get('/sparepart-requests/stats/summary', [SparepartRequestController::class, 'stats']);
    
    // Kartu Kendali (Maintenance Control Card) Routes
    Route::apiResource('kartu-kendali', KartuKendaliController::class);
    Route::post('/kartu-kendali/{kartuKendali}/entries', [KartuKendaliController::class, 'addEntry']);
    Route::get('/kartu-kendali/{kartuKendali}/entries', [KartuKendaliController::class, 'getEntries']);
    Route::get('/kartu-kendali/stats/summary', [KartuKendaliController::class, 'stats']);
    
    // Notification Routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    
    // Zoom Account Management Routes
    Route::apiResource('zoom/accounts', ZoomAccountController::class);
    Route::put('/zoom/accounts', [ZoomAccountController::class, 'updateAll']); // For bulk update
    Route::post('/zoom/accounts/check-availability', [ZoomAccountController::class, 'checkAvailability']);
    Route::get('/zoom/accounts/{accountId}/conflicts', [ZoomAccountController::class, 'getConflicts']);
    
    // Audit Logs Routes
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::post('/audit-logs', [AuditLogController::class, 'store']);
    Route::get('/audit-logs/my-logs', [AuditLogController::class, 'myLogs']);
    Route::get('/audit-logs/{id}', [AuditLogController::class, 'show']);
    Route::delete('/audit-logs/{id}', [AuditLogController::class, 'destroy']);
});
