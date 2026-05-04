<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ball;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
            'name' => ['required', 'string', 'regex:/^[A-Za-z]{3}$/'],
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'sometimes|in:admin,player',
            'wallet' => 'sometimes|integer|min:0',
            'available_at' => 'sometimes|integer',
        ], [
            'name.regex' => 'El nombre debe ser exactamente 3 letras (A-Z), estilo marcador arcade.',
        ]);

        $data['name'] = Str::upper($data['name']);

        $now = now()->timestamp;
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] ?? 'player',
            'wallet' => $data['wallet'] ?? 0,
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
            'name' => ['sometimes', 'required', 'string', 'regex:/^[A-Za-z]{3}$/'],
            'email' => 'sometimes|email|max:255|unique:users,email,'.$user->id,
            'password' => 'sometimes|string|min:6',
            'role' => 'sometimes|in:admin,player',
            'wallet' => 'sometimes|integer|min:0',
            'available_at' => 'sometimes|integer',
        ], [
            'name.regex' => 'El nombre debe ser exactamente 3 letras (A-Z), estilo marcador arcade.',
        ]);

        if (array_key_exists('name', $data)) {
            $data['name'] = Str::upper($data['name']);
        }

        if ($auth->role !== 'admin' && array_key_exists('role', $data)) {
            unset($data['role']);
        }

        if ($auth->role !== 'admin' && array_key_exists('wallet', $data)) {
            unset($data['wallet']);
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
        $ball = Ball::query()->findOrFail($request->ball_id);

        if ($user->balls()->where('balls.id', $ball->id)->exists()) {
            return response()->json([
                'message' => 'Ya tienes esta bola',
            ], 400);
        }

        $cost = $this->purchasePriceFor($ball);

        if ($cost > 0 && $user->wallet < $cost) {
            return response()->json([
                'message' => 'Saldo insuficiente',
            ], 400);
        }

        DB::transaction(function () use ($user, $ball, $cost) {
            if ($cost > 0) {
                $user->wallet -= $cost;
                $user->save();
            }
            $user->balls()->attach($ball->id);
        });

        return response()->json([
            'message' => 'Bola comprada correctamente',
            'user' => $user->fresh(),
        ]);
    }

    private function purchasePriceFor(Ball $ball): int
    {
        $featuredId = $this->featuredBallId();
        if ($featuredId !== null && (int) $ball->id === $featuredId) {
            if ($ball->deal_price !== null) {
                return (int) $ball->deal_price;
            }
            if ((int) $ball->price > 0) {
                return max(99, (int) floor($ball->price * 0.55));
            }
        }

        return (int) $ball->price;
    }

    private function featuredBallId(): ?int
    {
        $ids = Ball::query()->orderBy('id')->pluck('id')->all();
        if ($ids === []) {
            return null;
        }
        $epochDay = intdiv(now()->timestamp, 86400);

        return (int) $ids[$epochDay % count($ids)];
    }
}
