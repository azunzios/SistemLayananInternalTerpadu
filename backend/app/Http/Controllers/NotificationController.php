<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get user's notifications
     * GET /notifications?page=1&per_page=15&unread_only=false
     */
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', auth()->id());

        // Filter by unread only
        if ($request->boolean('unread_only')) {
            $query->unread();
        }

        // Filter by type
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        $perPage = $request->input('per_page', 15);
        $notifications = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully',
            'data' => $notifications,
            'unread_count' => Notification::where('user_id', auth()->id())->unread()->count(),
        ], 200);
    }

    /**
     * Mark notification as read
     * PATCH /notifications/{id}/read
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        // Verify user owns notification
        if ($notification->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $notification,
        ], 200);
    }

    /**
     * Mark all notifications as read
     * PATCH /notifications/read-all
     */
    public function markAllAsRead(): JsonResponse
    {
        Notification::where('user_id', auth()->id())
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ], 200);
    }

    /**
     * Delete notification
     * DELETE /notifications/{id}
     */
    public function destroy(Notification $notification): JsonResponse
    {
        // Verify user owns notification
        if ($notification->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ], 200);
    }

    /**
     * Get unread count
     * GET /notifications/unread-count
     */
    public function getUnreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', auth()->id())->unread()->count();

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $count],
        ], 200);
    }
}
