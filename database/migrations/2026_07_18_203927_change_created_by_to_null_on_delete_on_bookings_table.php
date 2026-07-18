<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });

        // Делаем колонку nullable через raw SQL, а не Blueprint::change() —
        // последний требует пакет doctrine/dbal, который в проекте не установлен.
        DB::statement('ALTER TABLE bookings MODIFY created_by BIGINT UNSIGNED NULL');

        Schema::table('bookings', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });

        DB::statement('UPDATE bookings SET created_by = (SELECT id FROM users LIMIT 1) WHERE created_by IS NULL');
        DB::statement('ALTER TABLE bookings MODIFY created_by BIGINT UNSIGNED NOT NULL');

        Schema::table('bookings', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
