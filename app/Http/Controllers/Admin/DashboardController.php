<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Table;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        if (! $request->user()) {
            abort(401);
        }

        $restaurant = $request->user()->restaurant;

        if (! $restaurant) {
            abort(404);
        }
        $restaurantId = $restaurant->id;
        $today = now()->format('Y-m-d');

        $todayBookings = Booking::with('table')
            ->whereHas('table', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->whereDate('start_time', $today)
            ->get();

        $stats = [
            'tables_count' => Table::where('restaurant_id', $restaurantId)->count(),
            'cashiers_count' => User::where('restaurant_id', $restaurantId)->where('role', 'cashier')->count(),
            'bookings_today' => $todayBookings->where('status', '!=', 'cancelled')->count(),
            'guests_today' => (int) $todayBookings->where('status', '!=', 'cancelled')->sum('party_size'),
            'seated_now' => $todayBookings->where('status', 'seated')->count(),
            'arriving_soon' => $todayBookings
                ->where('status', 'confirmed')
                ->filter(fn ($b) => $b->start_time->between(now(), now()->addHour()))
                ->count(),
        ];

        $upcoming = $todayBookings
            ->whereIn('status', ['confirmed', 'seated'])
            ->filter(fn ($b) => $b->end_time->isFuture())
            ->sortBy('start_time')
            ->take(6)
            ->map(fn ($b) => [
                'id' => $b->id,
                'guest_name' => $b->guest_name,
                'party_size' => $b->party_size,
                'start_time' => $b->start_time,
                'status' => $b->status,
                'table_name' => $b->table->name,
            ])
            ->values();

        return Inertia::render('admin/dashboard', [
            'restaurantName' => $restaurant->name,
            'stats' => $stats,
            'upcoming' => $upcoming,
        ]);
    }
}
