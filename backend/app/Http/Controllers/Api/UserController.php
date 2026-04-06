<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'sometimes|in:admin,player',
            'available_at' => 'sometimes|integer',
        ]);

        $now = now()->timestamp;
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] ?? 'player',
            'available_at' => $data['available_at'] ?? $now,
            'created_at' => $now,
        ]);

        return response()->json($user, 201);
    }

    public function show(Request $request, User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $auth = $request->user();
        if ($auth->role !== 'admin' && (int) $auth->id !== (int) $user->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,'.$user->id,
            'password' => 'sometimes|string|min:6',
            'role' => 'sometimes|in:admin,player',
            'available_at' => 'sometimes|integer',
        ]);

        if ($auth->role !== 'admin' && array_key_exists('role', $data)) {
            unset($data['role']);
        }

        $user->fill($data);
        $user->save();

        return response()->json($user);
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ((int) $user->id === (int) $request->user()->id) {
            return response()->json(['message' => 'No puedes eliminarte a ti mismo.'], 422);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    public function userBalls(User $user)
    {
        $user->load('balls');

        return response()->json($user->balls);
    }

    public function buyBall(Request $request)
    {
        $request->validate([
            'ball_id' => 'required|exists:balls,id',
        ]);

        $user = $request->user();

        if ($user->balls()->where('ball_id', $request->ball_id)->exists()) {
            return response()->json([
                'message' => 'Ya tienes esta bola',
            ], 400);
        }

        $user->balls()->attach($request->ball_id);

        return response()->json([
            'message' => 'Bola comprada correctamente',
        ]);
    }
}
