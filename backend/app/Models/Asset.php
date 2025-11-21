<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_code',
        'asset_nup',
        'asset_name',
        'description',
        'asset_type',
        'manufacturer',
        'model',
        'serial_number',
        'location',
        'user_id',
        'unit_kerja',
        'condition',
        'is_active',
        'acquisition_date',
        'warranty_end_date',
        'acquisition_cost',
        'current_value',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'acquisition_date' => 'date',
        'warranty_end_date' => 'date',
        'acquisition_cost' => 'decimal:2',
        'current_value' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who owns this asset
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get tickets for this asset
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'asset_code', 'asset_code');
    }

    /**
     * Scope to get only active assets
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Find asset by code and NUP
     */
    public static function findByCodeAndNup($code, $nup)
    {
        return self::where('asset_code', $code)
            ->where('asset_nup', $nup)
            ->first();
    }

    /**
     * Check if asset exists by code and NUP
     */
    public static function existsByCodeAndNup($code, $nup)
    {
        return self::where('asset_code', $code)
            ->where('asset_nup', $nup)
            ->exists();
    }
}
