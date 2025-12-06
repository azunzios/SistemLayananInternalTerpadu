<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        // Ensure roles is always an array with at least one role
        $roles = $this->roles;
        
        // Handle various edge cases:
        // - If roles is null, empty string, or not an array, default to ['pegawai']
        if (!is_array($roles) || empty($roles)) {
            $roles = ['pegawai'];
        }
        
        // Active role is now stored in DB
        // Fallback to first role if not set (legacy/safety)
        $activeRole = $this->role ?? ($roles[0] ?? 'pegawai');

        return [
            'id' => (string) $this->id,
            'email' => (string) $this->email,
            'name' => (string) ($this->name ?? ''),
            'nip' => (string) ($this->nip ?? ''),
            'jabatan' => (string) ($this->jabatan ?? ''),
            'role' => $activeRole, // Primary role for backward compatibility
            'roles' => $roles, // Full roles array
            'unitKerja' => (string) ($this->unit_kerja ?? ''),
            'phone' => (string) ($this->phone ?? ''),
            'avatar' => $this->avatar,
            'createdAt' => optional($this->created_at)->toISOString(),
            'isActive' => (bool) ($this->is_active ?? true),
            'failedLoginAttempts' => (int) ($this->failed_login_attempts ?? 0),
            'lockedUntil' => optional($this->locked_until)->toISOString(),
        ];
    }
}
