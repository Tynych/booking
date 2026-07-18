<?php

namespace Database\Factories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

class TableFactory extends Factory
{
    public function definition(): array
    {
        return [
            'restaurant_id' => Restaurant::factory(),
            'name' => 'Стол ' . fake()->unique()->numberBetween(1, 500),
            'capacity' => fake()->numberBetween(2, 8),
            'zone' => fake()->randomElement(['Зал', 'Терраса', null]),
        ];
    }
}
