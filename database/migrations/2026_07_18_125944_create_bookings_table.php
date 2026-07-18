<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('tables')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('guest_name');
            $table->string('guest_phone')->nullable();
            $table->unsignedTinyInteger('party_size');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->enum('status', ['confirmed', 'seated', 'completed', 'cancelled', 'no_show'])->default('confirmed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
