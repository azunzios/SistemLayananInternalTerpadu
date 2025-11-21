<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory');
        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Jika rollback, tidak ada cara untuk restore data yang sudah dihapus
        // Migration ini bersifat destructive
    }
};
