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
    protected function getUserRoles($user)
    {
        if (!$user) {
            return [];
        }

        if (is_array($user->roles)) {
            return $user->roles;
        }

        return json_decode($user->roles ?? '[]', true) ?? [];
    }

    /**
     * Check apakah user memiliki role tertentu
     */
    protected function userHasRole($user, $role)
    {
        $roles = $this->getUserRoles($user);
        return in_array($role, $roles ?? []);
    }

    /**
     * Check apakah user memiliki salah satu dari beberapa roles
     */
    protected function userHasAnyRole($user, $rolesArray)
    {
        $userRoles = $this->getUserRoles($user);
        foreach ($rolesArray as $role) {
            if (in_array($role, $userRoles)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check apakah user memiliki semua dari beberapa roles
     */
    protected function userHasAllRoles($user, $rolesArray)
    {
        $userRoles = $this->getUserRoles($user);
        foreach ($rolesArray as $role) {
            if (!in_array($role, $userRoles)) {
                return false;
            }
        }
        return true;
    }
}
