<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->nullable()->after('role')->constrained()->cascadeOnDelete();
        });

        // Шаг 1: временно РАСШИРЯЕМ enum, добавляя новые роли, но пока не убирая
        // старую 'admin' — так безопасно переносить данные, не рискуя, что MySQL
        // молча обнулит значение у существующих строк из-за строгого ENUM.
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'super_admin', 'manager', 'cashier') NOT NULL DEFAULT 'cashier'");

        // Шаг 2: если есть тестовые данные под старой ролью — заводим для них
        // ресторан по умолчанию и переносим туда всё существующее.
        $legacyAdmin = DB::table('users')->where('role', 'admin')->first();

        if ($legacyAdmin) {
            $restaurantId = DB::table('restaurants')->insertGetId([
                'name' => 'Мой ресторан',
                'timezone' => 'Europe/Moscow',
                'work_start' => '09:00:00',
                'work_end_hour' => 24,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('users')->whereIn('role', ['admin', 'cashier'])->update(['restaurant_id' => $restaurantId]);
            DB::table('tables')->whereNull('restaurant_id')->update(['restaurant_id' => $restaurantId]);
            DB::table('users')->where('role', 'admin')->update(['role' => 'manager']);
        }

        // Шаг 3: теперь можно окончательно убрать 'admin' из допустимых значений
        DB::statement("ALTER TABLE users MODIFY role ENUM('super_admin', 'manager', 'cashier') NOT NULL DEFAULT 'cashier'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'manager', 'super_admin', 'cashier') NOT NULL DEFAULT 'cashier'");
        DB::table('users')->where('role', 'manager')->update(['role' => 'admin']);
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier'");

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('restaurant_id');
        });
    }
};
