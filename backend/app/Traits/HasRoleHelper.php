<?php

namespace App\Traits;

/**
 * Helper trait untuk handling roles yang mungkin string atau array
 */
trait HasRoleHelper
{
    /**
     * Parse user roles menjadi array
     * Menangani kasus dimana roles adalah string JSON atau array
     */
    /**
     * Get the active role for the user
     */
    protected function getUserRole($user)
    {
        if (!$user) {
            return null;
        }

        return $user->role;
    }

    /**
     * Check apakah user memiliki role tertentu (Active Role Only)
     */
    protected function userHasRole($user, $role)
    {
        return $this->getUserRole($user) === $role;
    }

    /**
     * Check apakah user memiliki salah satu dari beberapa roles (Active Role Only)
     */
    protected function userHasAnyRole($user, $rolesArray)
    {
        $activeRole = $this->getUserRole($user);
        return in_array($activeRole, $rolesArray);
    }

    /**
     * Check apakah user memiliki semua dari beberapa roles
     * Since user only has ONE active role, this only returns true if rolesArray has exactly 1 item matching active role
     */
    protected function userHasAllRoles($user, $rolesArray)
    {
        if (count($rolesArray) > 1) {
            return false; // Impossible to have multiple active roles at once
        }
        
        $activeRole = $this->getUserRole($user);
        return in_array($activeRole, $rolesArray);
    }
}
