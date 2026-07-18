<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantController extends Controller
{
    public function index(): Response
    {
        $restaurants = Restaurant::withCount('tables')
            ->with(['users' => fn ($q) => $q->where('role', 'manager')->select('id', 'name', 'email', 'restaurant_id')])
            ->orderBy('name')
            ->get()
            ->map(fn ($restaurant) => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'timezone' => $restaurant->timezone,
                'is_active' => $restaurant->is_active,
                'tables_count' => $restaurant->tables_count,
                'manager' => $restaurant->users->first(),
                'created_at' => $restaurant->created_at,
            ]);

        return Inertia::render('super-admin/dashboard', [
            'restaurants' => $restaurants,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'restaurant_name' => 'required|string|max:255',
            'timezone' => 'required|string|max:255',
            'manager_name' => 'required|string|max:255',
            'manager_email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'manager_password' => 'required|string|min:8',
        ]);

        DB::transaction(function () use ($validated) {
            $restaurant = Restaurant::create([
                'name' => $validated['restaurant_name'],
                'timezone' => $validated['timezone'],
            ]);

            User::create([
                'name' => $validated['manager_name'],
                'email' => $validated['manager_email'],
                'password' => Hash::make($validated['manager_password']),
                'role' => 'manager',
                'restaurant_id' => $restaurant->id,
            ]);
        });

        return redirect()->back();
    }

    public function update(Request $request, Restaurant $restaurant): RedirectResponse
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $restaurant->update($validated);

        return redirect()->back();
    }
}
