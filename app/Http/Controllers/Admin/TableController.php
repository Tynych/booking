<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Table;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TableController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/tables/index', [
            'tables' => Table::where('restaurant_id', $request->user()->restaurant_id)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1|max:50',
            'zone' => 'nullable|string|max:255',
        ]);

        Table::create([
            ...$validated,
            'restaurant_id' => $request->user()->restaurant_id,
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Table $table): RedirectResponse
    {
        abort_if($table->restaurant_id !== $request->user()->restaurant_id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1|max:50',
            'zone' => 'nullable|string|max:255',
        ]);

        $table->update($validated);

        return redirect()->back();
    }

    public function destroy(Request $request, Table $table): RedirectResponse
    {
        abort_if($table->restaurant_id !== $request->user()->restaurant_id, 403);

        $table->delete();

        return redirect()->back();
    }
}
