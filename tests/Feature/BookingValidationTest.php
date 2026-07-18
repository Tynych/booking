<?php

use App\Models\Booking;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;

it('rejects creating a booking in the past', function () {
    $restaurant = Restaurant::factory()->create();
    $table = Table::factory()->for($restaurant)->create();
    $manager = User::factory()->manager($restaurant)->create();

    $response = $this->actingAs($manager)->post(route('bookings.store'), [
        'table_id' => $table->id,
        'guest_name' => 'Гость',
        'party_size' => 2,
        'start_time' => now()->subHour()->toDateTimeString(),
        'end_time' => now()->addHour()->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors('start_time');
});

it('rejects a booking outside the restaurant working hours', function () {
    $restaurant = Restaurant::factory()->create([
        'work_start' => '11:00:00',
        'work_end_hour' => 23,
    ]);
    $table = Table::factory()->for($restaurant)->create();
    $manager = User::factory()->manager($restaurant)->create();

    $start = now()->addDay()->setTime(9, 0);

    $response = $this->actingAs($manager)->post(route('bookings.store'), [
        'table_id' => $table->id,
        'guest_name' => 'Гость',
        'party_size' => 2,
        'start_time' => $start->toDateTimeString(),
        'end_time' => $start->copy()->addHour()->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors('start_time');
});

it('allows a booking within the restaurant working hours', function () {
    $restaurant = Restaurant::factory()->create([
        'work_start' => '11:00:00',
        'work_end_hour' => 23,
    ]);
    $table = Table::factory()->for($restaurant)->create();
    $manager = User::factory()->manager($restaurant)->create();

    $start = now()->addDay()->setTime(19, 0);

    $response = $this->actingAs($manager)->post(route('bookings.store'), [
        'table_id' => $table->id,
        'guest_name' => 'Гость',
        'party_size' => 2,
        'start_time' => $start->toDateTimeString(),
        'end_time' => $start->copy()->addHours(2)->toDateTimeString(),
    ]);

    $response->assertSessionDoesntHaveErrors();
});

it('allows extending the end time of a booking that has already started', function () {
    $restaurant = Restaurant::factory()->create();
    $table = Table::factory()->for($restaurant)->create();
    $manager = User::factory()->manager($restaurant)->create();

    $booking = Booking::factory()->for($table)->create([
        'created_by' => $manager->id,
        'start_time' => now()->subMinutes(30),
        'end_time' => now()->addMinutes(30),
        'status' => 'seated',
    ]);

    $response = $this->actingAs($manager)->patch(route('bookings.update', $booking), [
        'end_time' => now()->addHours(2)->toDateTimeString(),
    ]);

    $response->assertSessionDoesntHaveErrors();
    expect($booking->fresh()->end_time->greaterThan(now()->addHour()))->toBeTrue();
});
