<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FriendController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->friends()->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'friend_id' => 'required|integer|exists:users,id',
        ]);

        $user = $request->user();
        $friendId = (int) $data['friend_id'];

        if ((int) $user->id === $friendId) {
            return response()->json(['message' => 'No puedes agregarte a ti mismo como amigo.'], 422);
        }

        if ($user->friends()->where('friend_id', $friendId)->exists()) {
            return response()->json(['message' => 'Este usuario ya es tu amigo.'], 409);
        }

        DB::transaction(function () use ($user, $friendId): void {
            $now = now();

            DB::table('friend_user')->insertOrIgnore([
                [
                    'user_id' => $user->id,
                    'friend_id' => $friendId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'user_id' => $friendId,
                    'friend_id' => $user->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        });

        return response()->json([
            'message' => 'Amigo agregado correctamente.',
            'friend' => User::select('id', 'name', 'email', 'role')->findOrFail($friendId),
        ], 201);
    }

    public function destroy(Request $request, User $friend)
    {
        $user = $request->user();

        DB::table('friend_user')
            ->where(function ($query) use ($user, $friend): void {
                $query->where('user_id', $user->id)
                    ->where('friend_id', $friend->id);
            })
            ->orWhere(function ($query) use ($user, $friend): void {
                $query->where('user_id', $friend->id)
                    ->where('friend_id', $user->id);
            })
            ->delete();

        return response()->json(null, 204);
    }

    public function leaderboard(Request $request)
    {
        $user = $request->user();
        $userIds = $user->friends()->pluck('users.id')
            ->push($user->id)
            ->unique()
            ->values();

        $leaderboard = User::query()
            ->leftJoin('games', 'users.id', '=', 'games.player_id')
            ->whereIn('users.id', $userIds)
            ->select('users.id', 'users.name', 'users.email')
            ->selectRaw('COALESCE(MAX(games.score), 0) as best_score')
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('best_score')
            ->orderBy('users.name')
            ->get()
            ->map(function ($entry) use ($user) {
                return [
                    'id' => $entry->id,
                    'name' => $entry->name,
                    'email' => $entry->email,
                    'best_score' => (int) $entry->best_score,
                    'is_current_user' => (int) $entry->id === (int) $user->id,
                ];
            })
            ->values();

        return response()->json($leaderboard);
    }
}
