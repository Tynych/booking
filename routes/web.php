<?php

use App\Http\Controllers\Admin\CashierController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\RestaurantSettingsController;
use App\Http\Controllers\Admin\TableController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\SuperAdmin\RestaurantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'role:manager', 'restaurant.active'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('tables', TableController::class)->except(['create', 'edit', 'show']);

    Route::get('cashiers', [CashierController::class, 'index'])->name('cashiers.index');
    Route::post('cashiers', [CashierController::class, 'store'])->name('cashiers.store');
    Route::delete('cashiers/{cashier}', [CashierController::class, 'destroy'])->name('cashiers.destroy');

    Route::get('restaurant-settings', [RestaurantSettingsController::class, 'edit'])->name('restaurant-settings.edit');
    Route::patch('restaurant-settings', [RestaurantSettingsController::class, 'update'])->name('restaurant-settings.update');

    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
});

Route::middleware(['auth', 'role:manager,cashier', 'restaurant.active'])->group(function () {
    Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::get('bookings/search', [BookingController::class, 'search'])->name('bookings.search');
    Route::post('bookings', [BookingController::class, 'store'])->name('bookings.store');
    Route::patch('bookings/{booking}', [BookingController::class, 'update'])->name('bookings.update');
    Route::delete('bookings/{booking}', [BookingController::class, 'destroy'])->name('bookings.destroy');
});

Route::middleware(['auth', 'role:super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    Route::get('/', [RestaurantController::class, 'index'])->name('dashboard');
    Route::post('restaurants', [RestaurantController::class, 'store'])->name('restaurants.store');
    Route::patch('restaurants/{restaurant}', [RestaurantController::class, 'update'])->name('restaurants.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
