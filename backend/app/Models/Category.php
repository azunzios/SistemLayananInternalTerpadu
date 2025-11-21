<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'description',
        'assigned_roles',
        'is_active',
    ];

    protected $casts = [
        'assigned_roles' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the default assigned_roles value
     */
    public function getAssignedRolesAttribute($value)
    {
        if ($value === null) {
            return ['admin_layanan'];
        }
        return is_array($value) ? $value : json_decode($value, true);
    }

    /**
     * Get the fields for this category
     */
    public function fields(): HasMany
    {
        return $this->hasMany(CategoryField::class)->orderBy('order');
    }

    /**
     * Scope to get only active categories
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get categories by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Check if a role can handle this category
     */
    public function canBeHandledBy($role)
    {
        return in_array($role, $this->assigned_roles ?? []);
    }

    /**
     * Get all available types
     */
    public static function getTypes()
    {
        return ['perbaikan', 'zoom_meeting'];
    }
}
