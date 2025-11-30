<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rename asset_code dan asset_nup ke kode_barang dan nup untuk matching dengan struktur BMN
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->renameColumn('asset_code', 'kode_barang');
            $table->renameColumn('asset_nup', 'nup');
        });
    }

    /**
     * Rollback ke nama field lama
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->renameColumn('kode_barang', 'asset_code');
            $table->renameColumn('nup', 'asset_nup');
        });
    }
};
