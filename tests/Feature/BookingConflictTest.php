<?php

use App\Models\Booking;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;

it('prevents double-booking the same table with overlapping times', function () {
    $restaurant = Restaurant::factory()->create();
    $table = Table::factory()->for($restaurant)->create();
    $manager = User::factory()->manager($restaurant)->create();

    $start = now()->addDay()->setTime(19, 0);
    $end = $start->copy()->addHours(2);

    Booking::factory()->for($table)->create([
        'created_by' => $manager->id,
        'start_time' => $start,
        'end_time' => $end,
    ]);

    $response = $this->actingAs($manager)->post(route('bookings.store'), [
        'table_id' => $table->id,
        'guest_name' => 'Новый гость',
        'party_size' => 2,
        'start_time' => $start->copy()->addMinutes(30)->toDateTimeString(),
        'end_time' => $end->copy()->addMinutes(30)->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors('table_id');
    expect(Booking::count())->toBe(1);
});

it('allows booking the same table for a non-overlapping time slot', function () {
    $restaurant = Restaurant::factory()->create();
    $table = Table::factory()->for($restaurant)->create();
    $manager = User::factory()->manager($restaurant)->create();

    $start = now()->addDay()->setTime(19, 0);
    $end = $start->copy()->addHours(2);

    Booking::factory()->for($table)->create([
        'created_by' => $manager->id,
        'start_time' => $start,
        'end_time' => $end,
    ]);

    $response = $this->actingAs($manager)->post(route('bookings.store'), [
        'table_id' => $table->id,
        'guest_name' => 'Другой гость',
        'party_size' => 2,
        'start_time' => $end->toDateTimeString(),
        'end_time' => $end->copy()->addHour()->toDateTimeString(),
    ]);

    $response->assertSessionDoesntHaveErrors();
    expect(Booking::count())->toBe(2);
});

it('ignores cancelled bookings when checking for conflicts', function () {
    $restaurant = Restaurant::factory()->create();
    $table = Table::factory()->for($restaurant)->create();
    $manager = User::factory()->manager($restaurant)->create();

    $start = now()->addDay()->setTime(19, 0);
    $end = $start->copy()->addHours(2);

    Booking::factory()->for($table)->create([
        'created_by' => $manager->id,
        'start_time' => $start,
        'end_time' => $end,
        'status' => 'cancelled',
    ]);

    $response = $this->actingAs($manager)->post(route('bookings.store'), [
        'table_id' => $table->id,
        'guest_name' => 'Гость',
        'party_size' => 2,
        'start_time' => $start->toDateTimeString(),
        'end_time' => $end->toDateTimeString(),
    ]);

    $response->assertSessionDoesntHaveErrors();
});
