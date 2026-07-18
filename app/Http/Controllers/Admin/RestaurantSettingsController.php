<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('admin/restaurant-settings', [
            'restaurant' => $request->user()->restaurant,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'timezone' => 'required|string|max:255',
            'work_start' => 'required|date_format:H:i',
            'work_end_hour' => 'required|integer|min:1|max:24',
        ]);

        $request->user()->restaurant->update($validated);

        return redirect()->back();
    }
}
