<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketDiagnosis;
use App\Models\Timeline;
use App\Models\AuditLog;
use App\Http\Resources\TicketDiagnosisResource;
use App\Services\TicketNotificationService;
use App\Traits\HasRoleHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TicketDiagnosisController extends Controller
{
    use HasRoleHelper;

    /**
     * Get diagnosis for a ticket
     */
    public function show(Ticket $ticket): JsonResponse
    {
        $diagnosis = $ticket->diagnosis()->with('technician')->first();

        if (!$diagnosis) {
            return response()->json([
                'success' => false,
                'message' => 'Diagnosis not found',
            ], 404);
        }

        // Format response dengan semua jawaban
        $diagnosisData = [
            'id' => $diagnosis->id,
            'ticket_id' => $diagnosis->ticket_id,
            'technician_id' => $diagnosis->technician_id,
            'technician' => $diagnosis->technician,
            'problem_description' => $diagnosis->problem_description,
            'problem_category' => $diagnosis->problem_category,
            'repair_type' => $diagnosis->repair_type,
            'repair_description' => $diagnosis->repair_description,
            'unrepairable_reason' => $diagnosis->unrepairable_reason,
            'alternative_solution' => $diagnosis->alternative_solution,
            'technician_notes' => $diagnosis->technician_notes,
            'estimasi_hari' => $diagnosis->estimasi_hari,
            'created_at' => $diagnosis->created_at,
            'updated_at' => $diagnosis->updated_at,
        ];

        return response()->json([
            'success' => true,
            'data' => $diagnosisData,
        ]);
    }

    /**
     * Create or update diagnosis
     */
    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $user = Auth::user();

        // Only teknisi can create diagnosis
        if (!$this->userHasRole($user, 'teknisi')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if ticket is assigned to this teknisi
        if ($ticket->assigned_to !== $user->id) {
            return response()->json(['message' => 'Ticket not assigned to you'], 403);
        }

        $validated = $request->validate([
            'problem_description' => 'required|string',
            'problem_category' => 'required|in:hardware,software,lainnya',
            'repair_type' => 'required|in:direct_repair,need_sparepart,need_vendor,need_license,unrepairable',
            'repair_description' => 'required_if:repair_type,direct_repair|nullable|string',
            'unrepairable_reason' => 'required_if:repair_type,unrepairable|nullable|string',
            'alternative_solution' => 'nullable|string',
            'technician_notes' => 'nullable|string',
            'estimasi_hari' => 'nullable|string',
        ]);

        // Check if diagnosis already exists
        $diagnosis = $ticket->diagnosis;

        if ($diagnosis) {
            $diagnosis->update([
                ...$validated,
                'technician_id' => $user->id,
            ]);
            $message = 'Diagnosis updated successfully';
        } else {
            $diagnosis = TicketDiagnosis::create([
                ...$validated,
                'ticket_id' => $ticket->id,
                'technician_id' => $user->id,
            ]);
            $message = 'Diagnosis saved successfully';
        }

        // If this is the first diagnosis and ticket is in 'assigned' status, change to 'in_progress'
        if ($ticket->status === 'assigned' && !$diagnosis) {
            $ticket->update(['status' => 'in_progress']);
        }

        // Create timeline
        Timeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'action' => 'DIAGNOSIS_CREATED',
            'details' => "Diagnosis completed: {$this->getRepairTypeLabel($validated['repair_type'])}",
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'DIAGNOSIS_CREATED',
            'details' => "Diagnosis for ticket {$ticket->ticket_number}",
            'ip_address' => request()->ip(),
        ]);

        // Send notification
        TicketNotificationService::onDiagnosisCreated($ticket, $validated['repair_type']);

        return response()->json([
            'success' => true,
            'data' => $diagnosis->load('technician'),
            'message' => $message,
        ]);
    }

    /**
     * Delete diagnosis
     */
    public function destroy(Ticket $ticket): JsonResponse
    {
        $user = Auth::user();

        if (!$this->userHasRole($user, 'teknisi') && !$this->userHasRole($user, 'admin_layanan')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $diagnosis = $ticket->diagnosis;

        if (!$diagnosis) {
            return response()->json(['message' => 'Diagnosis not found'], 404);
        }

        $diagnosis->delete();

        Timeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'action' => 'DIAGNOSIS_DELETED',
            'details' => 'Diagnosis deleted',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Diagnosis deleted successfully',
        ]);
    }

    /**
     * Get repair type label
     */
    private function getRepairTypeLabel(string $repairType): string
    {
        return match($repairType) {
            'direct_repair' => 'Bisa diperbaiki langsung',
            'need_sparepart' => 'Butuh sparepart',
            'need_vendor' => 'Butuh vendor',
            'need_license' => 'Butuh lisensi',
            'unrepairable' => 'Tidak dapat diperbaiki',
            default => $repairType,
        };
    }
}
