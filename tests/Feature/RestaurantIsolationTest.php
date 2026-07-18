<?php

use App\Models\Booking;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;

it('does not show another restaurant\'s tables', function () {
    $restaurantA = Restaurant::factory()->create();
    $restaurantB = Restaurant::factory()->create();

    Table::factory()->for($restaurantA)->create(['name' => 'Стол A1']);
    Table::factory()->for($restaurantB)->create(['name' => 'Стол B1']);

    $managerA = User::factory()->manager($restaurantA)->create();

    $response = $this->actingAs($managerA)->get(route('admin.tables.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('admin/tables/index')
        ->has('tables', 1)
        ->where('tables.0.name', 'Стол A1')
    );
});

it('prevents a manager from updating another restaurant\'s table', function () {
    $restaurantA = Restaurant::factory()->create();
    $restaurantB = Restaurant::factory()->create();

    $tableB = Table::factory()->for($restaurantB)->create();
    $managerA = User::factory()->manager($restaurantA)->create();

    $response = $this->actingAs($managerA)->patch(route('admin.tables.update', $tableB), [
        'name' => 'Взломанное имя',
        'capacity' => 4,
    ]);

    $response->assertForbidden();
    expect($tableB->fresh()->name)->not->toBe('Взломанное имя');
});

it('does not show another restaurant\'s bookings in the calendar', function () {
    $restaurantA = Restaurant::factory()->create();
    $restaurantB = Restaurant::factory()->create();

    $tableA = Table::factory()->for($restaurantA)->create();
    $tableB = Table::factory()->for($restaurantB)->create();

    $managerA = User::factory()->manager($restaurantA)->create();
    $managerB = User::factory()->manager($restaurantB)->create();

    $day = now()->addDay()->setTime(19, 0);

    Booking::factory()->for($tableA)->create([
        'created_by' => $managerA->id,
        'guest_name' => 'Гость A',
        'start_time' => $day,
        'end_time' => $day->copy()->addHours(2),
    ]);
    Booking::factory()->for($tableB)->create([
        'created_by' => $managerB->id,
        'guest_name' => 'Гость B',
        'start_time' => $day,
        'end_time' => $day->copy()->addHours(2),
    ]);

    $response = $this->actingAs($managerA)->get(route('bookings.index', ['date' => $day->format('Y-m-d')]));

    $response->assertInertia(fn ($page) => $page
        ->has('bookings', 1)
        ->where('bookings.0.guest_name', 'Гость A')
    );
});

it('does not leak search results from another restaurant', function () {
    $restaurantA = Restaurant::factory()->create();
    $restaurantB = Restaurant::factory()->create();

    $tableB = Table::factory()->for($restaurantB)->create();
    $managerA = User::factory()->manager($restaurantA)->create();
    $managerB = User::factory()->manager($restaurantB)->create();

    Booking::factory()->for($tableB)->create([
        'created_by' => $managerB->id,
        'guest_name' => 'Уникальный Гость',
    ]);

    $response = $this->actingAs($managerA)->getJson(route('bookings.search', ['q' => 'Уникальный']));

    $response->assertJson(['results' => []]);
});
