<?php

use App\Models\Restaurant;
use App\Models\User;

it('blocks login for a manager whose restaurant is inactive', function () {
    $restaurant = Restaurant::factory()->inactive()->create();
    $manager = User::factory()->manager($restaurant)->create();

    $response = $this->post(route('login'), [
        'email' => $manager->email,
        'password' => 'password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('logs out a user when their restaurant becomes inactive mid-session', function () {
    $restaurant = Restaurant::factory()->create();
    $manager = User::factory()->manager($restaurant)->create();

    $restaurant->update(['is_active' => false]);

    $response = $this->actingAs($manager)->get(route('admin.dashboard'));

    $response->assertRedirect(route('login'));
});

it('allows login again once the restaurant is reactivated', function () {
    $restaurant = Restaurant::factory()->create();
    $manager = User::factory()->manager($restaurant)->create();

    $response = $this->post(route('login'), [
        'email' => $manager->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticatedAs($manager);
});
