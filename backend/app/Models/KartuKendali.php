<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KartuKendali extends Model
{
    protected $table = 'kartu_kendali';

    protected $fillable = [
        'asset_code',
        'asset_nup',
        'asset_name',
        'asset_merk',
        'asset_description',
        'condition',
        'condition_notes',
        'location',
        'responsible_user_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all maintenance entries for this asset
     */
    public function entries(): HasMany
    {
        return $this->hasMany(KartuKendaliEntry::class);
    }

    /**
     * Get responsible user
     */
    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    /**
     * Get latest maintenance entry
     */
    public function latestEntry()
    {
        return $this->entries()->latest('maintenance_date')->first();
    }

    /**
     * Get maintenance count
     */
    public function getMaintenanceCountAttribute(): int
    {
        return $this->entries()->count();
    }

    /**
     * Scope: get by asset code
     */
    public function scopeByAssetCode($query, $assetCode)
    {
        return $query->where('asset_code', $assetCode);
    }

    /**
     * Scope: get by condition
     */
    public function scopeByCondition($query, $condition)
    {
        return $query->where('condition', $condition);
    }

    /**
     * Scope: get active assets
     */
    public function scopeActive($query)
    {
        return $query->whereIn('condition', ['baik', 'rusak_ringan']);
    }
}
