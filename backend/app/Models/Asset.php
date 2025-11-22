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
        'merk_tipe',
        'spesifikasi',
        'tahun_perolehan',
        'tanggal_perolehan',
        'sumber_dana',
        'nomor_bukti_perolehan',
        'nilai_perolehan',
        'nilai_buku',
        'satuan',
        'jumlah',
        'location',
        'unit_pengguna',
        'penanggung_jawab_user_id',
        'condition',
        'status_penggunaan',
        'is_active',
        'keterangan',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tanggal_perolehan' => 'date',
        'nilai_perolehan' => 'decimal:2',
        'nilai_buku' => 'decimal:2',
        'jumlah' => 'integer',
        'tahun_perolehan' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who owns this asset
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'penanggung_jawab_user_id');
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
