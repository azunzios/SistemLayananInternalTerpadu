<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketDiagnosis;
use App\Models\Timeline;
use App\Models\AuditLog;
use App\Models\Asset;
use App\Models\Notification;
use App\Models\User;
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
            'asset_condition_change' => $diagnosis->asset_condition_change,
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
            'asset_condition_change' => 'nullable|in:Baik,Rusak Ringan,Rusak Berat',
            'alternative_solution' => 'nullable|string',
            'technician_notes' => 'nullable|string',
            'estimasi_hari' => 'nullable|string',
        ]);

        // Check if diagnosis already exists
        $diagnosis = $ticket->diagnosis;

        // Store old asset condition if updating diagnosis
        $oldAssetCondition = null;
        if ($diagnosis && isset($validated['asset_condition_change'])) {
            $asset = Asset::findByCodeAndNup($ticket->kode_barang, $ticket->nup);
            if ($asset) {
                $oldAssetCondition = $asset->kondisi;
            }
        }

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

        // If repair_type is unrepairable, update asset condition
        if ($validated['repair_type'] === 'unrepairable' && isset($validated['asset_condition_change'])) {
            $asset = Asset::findByCodeAndNup($ticket->kode_barang, $ticket->nup);
            
            if ($asset) {
                $oldCondition = $asset->kondisi;
                $newCondition = $validated['asset_condition_change'];
                
                // Update asset condition
                $asset->update(['kondisi' => $newCondition]);

                // Create audit log for asset condition change
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'ASSET_CONDITION_CHANGED',
                    'details' => "Asset {$asset->kode_barang} NUP {$asset->nup} condition changed from {$oldCondition} to {$newCondition}",
                    'ip_address' => request()->ip(),
                ]);

                // Send notification to all superadmins
                $superAdmins = User::where('role', 'super_admin')->get();
                
                foreach ($superAdmins as $admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'type' => 'warning',
                        'title' => 'Perubahan Kondisi Asset BMN',
                        'message' => "Kondisi barang BMN telah diubah:\n\nKode Barang: {$asset->kode_barang}\nNUP: {$asset->nup}\nNama Barang: {$asset->nama_barang}\nMerek/Tipe: {$asset->merek}\n\nKondisi Lama: " . ucwords(str_replace('_', ' ', $oldCondition)) . "\nKondisi Baru: " . ucwords(str_replace('_', ' ', $newCondition)) . "\n\nDiubah oleh: {$user->name}\nTiket: {$ticket->ticket_number}",
                        'reference_type' => 'asset',
                        'reference_id' => $asset->id,
                        'action_url' => "/tickets/{$ticket->id}",
                        'data' => json_encode([
                            'ticket_id' => $ticket->id,
                            'asset_id' => $asset->id,
                            'kode_barang' => $asset->kode_barang,
                            'nup' => $asset->nup,
                            'old_condition' => $oldCondition,
                            'new_condition' => $newCondition,
                        ]),
                    ]);
                }

                // Create timeline entry for asset condition change
                Timeline::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id,
                    'action' => 'ASSET_CONDITION_CHANGED',
                    'details' => "Asset condition changed from {$oldCondition} to {$newCondition}",
                ]);
            }
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
