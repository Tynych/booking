<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Restaurant;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;







class BookingController extends Controller
{
    public function index(Request $request): Response
    {
        $date = $request->query('date', now()->format('Y-m-d'));
        $restaurantId = $request->user()->restaurant_id;
        $restaurant = Restaurant::findOrFail($restaurantId);

        return Inertia::render('bookings/index', [
            'tables' => Table::where('restaurant_id', $restaurantId)->orderBy('name')->get(),
            'bookings' => Booking::whereHas('table', fn ($q) => $q->where('restaurant_id', $restaurantId))
                ->whereDate('start_time', $date)
                ->get(),
            'date' => $date,
            'workStart' => substr($restaurant->work_start, 0, 5),
            'workEndHour' => $restaurant->work_end_hour,
        ]);
    }
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'required|string|min:1|max:255',
        ]);

        $restaurantId = $request->user()->restaurant_id;
        $query = trim($validated['q']);

        $bookings = Booking::with('table')
            ->whereHas('table', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->where(function ($q) use ($query) {
                $q->where('guest_name', 'like', "%{$query}%")
                    ->orWhere('guest_phone', 'like', "%{$query}%");
            })
            ->where('start_time', '>=', now()->subDays(7))
            ->orderBy('start_time')
            ->limit(15)
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'guest_name' => $b->guest_name,
                'guest_phone' => $b->guest_phone,
                'party_size' => $b->party_size,
                'start_time' => $b->start_time,
                'end_time' => $b->end_time,
                'status' => $b->status,
                'table_id' => $b->table_id,
                'table_name' => $b->table->name,
            ]);

        return response()->json(['results' => $bookings]);
    }

    public function store(Request $request): RedirectResponse
    {
        $restaurantId = $request->user()->restaurant_id;
        $restaurant = Restaurant::findOrFail($restaurantId);

        $validated = $request->validate([
            'table_id' => ['required', Rule::exists('tables', 'id')->where('restaurant_id', $restaurantId)],
            'guest_name' => 'required|string|max:255',
            'guest_phone' => 'nullable|string|max:50',
            'party_size' => 'required|integer|min:1|max:50',
            'deposit' => 'nullable|numeric|min:0|max:99999999.99',
            'notes' => 'nullable|string|max:2000',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        $this->assertNotPast($validated['start_time']);
        $this->assertWithinWorkingHours($validated['start_time'], $validated['end_time'], $restaurant);
        $this->assertNoConflict($validated['table_id'], $validated['start_time'], $validated['end_time']);

        Booking::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'status' => 'confirmed',
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Booking $booking): RedirectResponse
    {
        $restaurantId = $request->user()->restaurant_id;
        abort_if($booking->table->restaurant_id !== $restaurantId, 403);

        $restaurant = Restaurant::findOrFail($restaurantId);

        $validated = $request->validate([
            'table_id' => ['sometimes', 'required', Rule::exists('tables', 'id')->where('restaurant_id', $restaurantId)],
            'guest_name' => 'sometimes|required|string|max:255',
            'guest_phone' => 'nullable|string|max:50',
            'party_size' => 'sometimes|required|integer|min:1|max:50',
            'deposit' => 'sometimes|nullable|numeric|min:0|max:99999999.99',
            'notes' => 'sometimes|nullable|string|max:2000',
            'start_time' => 'sometimes|required|date',
            'end_time' => 'sometimes|required|date|after:start_time',
            'status' => ['sometimes', Rule::in(['confirmed', 'seated', 'completed', 'cancelled', 'no_show'])],
        ]);

        $tableId = $validated['table_id'] ?? $booking->table_id;
        $start = $validated['start_time'] ?? $booking->start_time->toDateTimeString();
        $end = $validated['end_time'] ?? $booking->end_time->toDateTimeString();

        if (isset($validated['start_time'])) {
            $this->assertNotPast($validated['start_time']);
        }

        if (isset($validated['start_time']) || isset($validated['end_time'])) {
            $this->assertWithinWorkingHours($start, $end, $restaurant);
        }

        $this->assertNoConflict($tableId, $start, $end, excludeBookingId: $booking->id);

        $booking->update($validated);

        return redirect()->back();
    }

    public function destroy(Request $request, Booking $booking): RedirectResponse
    {
        abort_if($booking->table->restaurant_id !== $request->user()->restaurant_id, 403);

        $booking->delete();

        return redirect()->back();
    }

    private function assertNotPast(string $start): void
    {
        if (Carbon::parse($start)->isPast()) {
            throw ValidationException::withMessages([
                'start_time' => 'Нельзя создать или перенести бронь на прошедшее время.',
            ]);
        }
    }

    private function assertWithinWorkingHours(string $start, string $end, Restaurant $restaurant): void
    {
        $startAt = Carbon::parse($start);
        $endAt = Carbon::parse($end);

        $workStart = $startAt->copy()->setTimeFromTimeString($restaurant->work_start);
        $workEnd = $restaurant->work_end_hour >= 24
            ? $startAt->copy()->addDay()->startOfDay()
            : $startAt->copy()->setTime($restaurant->work_end_hour, 0);

        if ($startAt->lt($workStart) || $endAt->gt($workEnd)) {
            $endLabel = $restaurant->work_end_hour >= 24 ? '24:00' : sprintf('%02d:00', $restaurant->work_end_hour);

            throw ValidationException::withMessages([
                'start_time' => "Бронь можно ставить только на рабочее время ресторана (" . substr($restaurant->work_start, 0, 5) . "–{$endLabel}).",
            ]);
        }
    }

    private function assertNoConflict(int $tableId, string $start, string $end, ?int $excludeBookingId = null): void
    {
        DB::transaction(function () use ($tableId, $start, $end, $excludeBookingId) {
            $conflict = Booking::where('table_id', $tableId)
                ->where('status', '!=', 'cancelled')
                ->when($excludeBookingId, fn ($q) => $q->where('id', '!=', $excludeBookingId))
                ->where('start_time', '<', $end)
                ->where('end_time', '>', $start)
                ->lockForUpdate()
                ->exists();

            if ($conflict) {
                throw ValidationException::withMessages([
                    'table_id' => 'Этот стол уже занят в выбранное время.',
                ]);
            }
        });
    }
}
