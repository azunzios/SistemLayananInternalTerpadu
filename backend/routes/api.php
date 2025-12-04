<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\BmnAssetController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\WorkOrderController;
use App\Http\Controllers\SparepartRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ZoomAccountController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\TicketDiagnosisController;

Route::post('/login', [AuthController::class, 'login'])->name('login');

// Password Reset routes (public)
Route::post('/password/forgot', [PasswordResetController::class, 'sendResetLink']);
Route::post('/password/verify-token', [PasswordResetController::class, 'verifyToken']);
Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);

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
    
    // Category Management Routes (Disabled - not used, categories table doesn't exist)
    // Route::apiResource('categories', CategoryController::class);
    
    // Asset Management Routes (Legacy - keep for backward compatibility)
    Route::get('/assets/search/by-code-nup', [AssetController::class, 'searchByCodeAndNup']);
    
    // BMN Asset Management Routes (Super Admin only)
    Route::prefix('bmn-assets')->group(function () {
        Route::get('/', [BmnAssetController::class, 'index']);
        Route::get('/kondisi-options', [BmnAssetController::class, 'getKondisiOptions']);
        Route::get('/template', [\App\Http\Controllers\BmnAssetImportController::class, 'downloadTemplate']);
        Route::get('/export/all', [\App\Http\Controllers\BmnAssetImportController::class, 'exportAll']);
        Route::post('/import', [\App\Http\Controllers\BmnAssetImportController::class, 'importExcel']);
        Route::get('/{asset}', [BmnAssetController::class, 'show']);
        Route::post('/', [BmnAssetController::class, 'store']);
        Route::put('/{asset}', [BmnAssetController::class, 'update']);
        Route::delete('/{asset}', [BmnAssetController::class, 'destroy']);
    });
    
    // Ticket Management Routes - Specific routes FIRST (before apiResource)
    Route::get('/tickets-counts', [TicketController::class, 'counts']);
    Route::get('/tickets/stats/dashboard', [TicketController::class, 'dashboardStats']);
    Route::get('/tickets/stats/admin-dashboard', [TicketController::class, 'adminDashboardStats']);
    Route::get('/tickets/stats/super-admin-dashboard', [TicketController::class, 'superAdminDashboardStats']);
    Route::get('/tickets/stats/admin-layanan-dashboard', [TicketController::class, 'adminLayananDashboardData']);
    Route::get('/tickets/stats/zoom-bookings', [TicketController::class, 'zoomBookingStats']);
    Route::get('/tickets/zoom-bookings', [TicketController::class, 'zoomBookings']);
    Route::get('/tickets/calendar/grid', [TicketController::class, 'calendarGrid']);
    Route::get('/tickets/export/zoom', [TicketController::class, 'exportZoom']);
    Route::get('/tickets/export/all', [TicketController::class, 'exportAll']);
    
    // Generic resource routes AFTER specific routes
    Route::apiResource('tickets', TicketController::class);
    Route::patch('/tickets/{ticket}/assign', [TicketController::class, 'assign']);
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::patch('/tickets/{ticket}/approve', [TicketController::class, 'approveTicket']);
    Route::patch('/tickets/{ticket}/approve-zoom', [TicketController::class, 'approveZoom']);
    Route::patch('/tickets/{ticket}/reject-zoom', [TicketController::class, 'rejectZoom']);
    Route::patch('/tickets/{ticket}/reject', [TicketController::class, 'rejectTicket']);
    Route::get('/technician-stats', [TicketController::class, 'technicianStats']);
    Route::patch('/tickets/{ticket}/approve', [TicketController::class, 'approve']);

    // Comment Management Routes (Diskusi/Percakapan)
    Route::get('/tickets/{ticket}/comments', [CommentController::class, 'index']);
    Route::post('/tickets/{ticket}/comments', [CommentController::class, 'store']);

    // Ticket Diagnosis Routes
    Route::get('/tickets/{ticket}/diagnosis', [TicketDiagnosisController::class, 'show']);
    Route::post('/tickets/{ticket}/diagnosis', [TicketDiagnosisController::class, 'store']);
    Route::delete('/tickets/{ticket}/diagnosis', [TicketDiagnosisController::class, 'destroy']);

    // Ticket Work Orders Routes
    Route::get('/tickets/{ticket}/work-orders', [WorkOrderController::class, 'listByTicket']);

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
    
    // Kartu Kendali - data from completed work orders (grouped by ticket)
    Route::get('/kartu-kendali', [WorkOrderController::class, 'kartuKendali']);
    Route::get('/kartu-kendali/{ticket}', [WorkOrderController::class, 'kartuKendaliDetail']);
    Route::get('/kartu-kendali/export', [WorkOrderController::class, 'exportKartuKendali']);
    
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
