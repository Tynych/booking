<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $restaurantId = $request->user()->restaurant_id;

        $to = $request->query('to') ? Carbon::parse($request->query('to')) : now();
        $from = $request->query('from') ? Carbon::parse($request->query('from')) : $to->copy()->subDays(6);

        // На случай, если from случайно оказался позже to — не роняем страницу, а просто меняем местами
        if ($from->gt($to)) {
            [$from, $to] = [$to, $from];
        }

        $baseQuery = fn () => Booking::whereHas('table', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->whereBetween('start_time', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);

        // Броней и гостей по дням — для гистограммы
        $byDayRaw = $baseQuery()
            ->selectRaw('DATE(start_time) as day, COUNT(*) as bookings_count, COALESCE(SUM(party_size), 0) as guests_count')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy(fn ($row) => $row->day);

        $dayStats = [];
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $key = $cursor->format('Y-m-d');
            $row = $byDayRaw->get($key);
            $dayStats[] = [
                'day' => $key,
                'bookings_count' => $row->bookings_count ?? 0,
                'guests_count' => (int) ($row->guests_count ?? 0),
            ];
            $cursor->addDay();
        }

        // Разбивка по статусам
        $statusBreakdown = $baseQuery()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Загрузка по столам
        $tableStats = Table::where('restaurant_id', $restaurantId)
            ->withCount(['bookings as bookings_count' => function ($q) use ($from, $to) {
                $q->whereBetween('start_time', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
                    ->where('status', '!=', 'cancelled');
            }])
            ->withSum(['bookings as guests_sum' => function ($q) use ($from, $to) {
                $q->whereBetween('start_time', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
                    ->where('status', '!=', 'cancelled');
            }], 'party_size')
            ->orderByDesc('bookings_count')
            ->get(['id', 'name']);

        $totalBookings = $statusBreakdown->sum();
        $noShowCount = $statusBreakdown->get('no_show', 0);
        $cancelledCount = $statusBreakdown->get('cancelled', 0);

        $totals = [
            'total_bookings' => $totalBookings,
            'total_guests' => (int) $baseQuery()->where('status', '!=', 'cancelled')->sum('party_size'),
            'total_deposit' => (float) $baseQuery()->where('status', '!=', 'cancelled')->sum('deposit'),
            'no_show_count' => $noShowCount,
            'no_show_rate' => $totalBookings > 0 ? round($noShowCount / $totalBookings * 100, 1) : 0,
            'cancelled_count' => $cancelledCount,
            'cancellation_rate' => $totalBookings > 0 ? round($cancelledCount / $totalBookings * 100, 1) : 0,
        ];

        return Inertia::render('admin/reports', [
            'from' => $from->format('Y-m-d'),
            'to' => $to->format('Y-m-d'),
            'dayStats' => $dayStats,
            'statusBreakdown' => $statusBreakdown,
            'tableStats' => $tableStats,
            'totals' => $totals,
        ]);
    }
}
