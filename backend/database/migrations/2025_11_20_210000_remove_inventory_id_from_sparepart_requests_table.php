<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sparepart_requests', function (Blueprint $table) {
            $table->dropForeign('sparepart_requests_inventory_id_foreign');
            $table->dropColumn('inventory_id');
        });
    }

    public function down(): void
    {
        Schema::table('sparepart_requests', function (Blueprint $table) {
            $table->foreignId('inventory_id')->nullable()->constrained('inventory')->onDelete('restrict');
        });
    }
};
