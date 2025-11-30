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
        'kode_satker',
        'nama_satker',
        'kode_barang',
        'nama_barang',
        'nup',
        'kondisi',
        'merek',
        'ruangan',
        'serial_number',
        'pengguna',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get tickets for this asset
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'kode_barang', 'kode_barang');
    }

    /**
     * Find asset by kode barang and NUP
     */
    public static function findByCodeAndNup($code, $nup)
    {
        return self::where('kode_barang', $code)
            ->where('nup', $nup)
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
