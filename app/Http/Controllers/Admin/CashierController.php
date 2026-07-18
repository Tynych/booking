<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CashierController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/cashiers/index', [
            'cashiers' => User::where('role', 'cashier')
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'created_at']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => 'required|string|min:8',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'cashier',
            'restaurant_id' => $request->user()->restaurant_id,
        ]);

        return redirect()->back();
    }

    public function destroy(Request $request, User $cashier): RedirectResponse
    {
        abort_if($cashier->role !== 'cashier', 403);
        abort_if($cashier->restaurant_id !== $request->user()->restaurant_id, 403);

        $cashier->delete();

        return redirect()->back();
    }
}
