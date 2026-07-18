<?php

use App\Models\Booking;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;

it('keeps bookings when the cashier who created them is deleted', function () {
    $restaurant = Restaurant::factory()->create();
    $table = Table::factory()->for($restaurant)->create();
    $manager = User::factory()->manager($restaurant)->create();
    $cashier = User::factory()->cashier($restaurant)->create();

    $booking = Booking::factory()->for($table)->create(['created_by' => $cashier->id]);

    $this->actingAs($manager)->delete(route('admin.cashiers.destroy', $cashier));

    $this->assertModelMissing($cashier);
    expect(Booking::find($booking->id))->not->toBeNull();
    expect($booking->fresh()->created_by)->toBeNull();
});

it('prevents a manager from deleting a cashier belonging to another restaurant', function () {
    $restaurantA = Restaurant::factory()->create();
    $restaurantB = Restaurant::factory()->create();

    $managerA = User::factory()->manager($restaurantA)->create();
    $cashierB = User::factory()->cashier($restaurantB)->create();

    $response = $this->actingAs($managerA)->delete(route('admin.cashiers.destroy', $cashierB));

    $response->assertForbidden();
    $this->assertModelExists($cashierB);
});
