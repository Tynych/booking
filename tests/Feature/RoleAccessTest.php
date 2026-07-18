<?php

use App\Models\Restaurant;
use App\Models\User;

it('forbids a cashier from accessing the manager admin panel', function () {
    $restaurant = Restaurant::factory()->create();
    $cashier = User::factory()->cashier($restaurant)->create();

    $this->actingAs($cashier)->get(route('admin.dashboard'))->assertForbidden();
});

it('forbids a manager from accessing the super-admin panel', function () {
    $restaurant = Restaurant::factory()->create();
    $manager = User::factory()->manager($restaurant)->create();

    $this->actingAs($manager)->get(route('super-admin.dashboard'))->assertForbidden();
});

it('allows both manager and cashier to access the bookings calendar', function () {
    $restaurant = Restaurant::factory()->create();
    $manager = User::factory()->manager($restaurant)->create();
    $cashier = User::factory()->cashier($restaurant)->create();

    $this->actingAs($manager)->get(route('bookings.index'))->assertOk();
    $this->actingAs($cashier)->get(route('bookings.index'))->assertOk();
});

it('redirects a guest trying to access the admin panel to login', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});
