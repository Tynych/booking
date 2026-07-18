<?php

namespace Database\Factories;

use App\Models\Table;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    public function definition(): array
    {
        $start = now()->addDay()->setTime(19, 0);

        return [
            'table_id' => Table::factory(),
            'created_by' => User::factory(),
            'guest_name' => fake()->name(),
            'guest_phone' => fake()->phoneNumber(),
            'party_size' => fake()->numberBetween(1, 6),
            'start_time' => $start,
            'end_time' => $start->copy()->addHours(2),
            'status' => 'confirmed',
        ];
    }
}
