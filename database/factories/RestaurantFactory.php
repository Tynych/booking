<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class RestaurantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'timezone' => 'Europe/Moscow',
            'work_start' => '09:00:00',
            'work_end_hour' => 24,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
