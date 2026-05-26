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
            'friend_id' => 'nullable|integer|exists:users,id|required_without:friend_email',
            'friend_email' => 'nullable|email|exists:users,email|required_without:friend_id',
        ]);

        $user = $request->user();
        $friend = null;
        if (array_key_exists('friend_id', $data) && $data['friend_id'] !== null) {
            $friend = User::select('id', 'name', 'email', 'role')->find($data['friend_id']);
        } elseif (array_key_exists('friend_email', $data) && $data['friend_email'] !== null) {
            $friend = User::select('id', 'name', 'email', 'role')
                ->where('email', $data['friend_email'])
                ->first();
        }

        if (!$friend) {
            return response()->json(['message' => 'No se encontro el usuario amigo.'], 404);
        }
        $friendId = (int) $friend->id;

        if ((int) $user->id === $friendId) {
            return response()->json(['message' => 'No puedes agregarte a ti mismo como amigo.'], 422);
        }

        $existing = DB::table('friends')
            ->where(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $user->id)
                    ->where('friend_id', $friendId);
            })
            ->orWhere(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $friendId)
                    ->where('friend_id', $user->id);
            })
            ->get();

        if ($existing->contains(fn ($row) => $row->status === 'accepted')) {
            return response()->json(['message' => 'Este usuario ya es tu amigo.'], 409);
        }

        if ($existing->contains(fn ($row) => (int) $row->user_id === (int) $user->id && $row->status === 'pending')) {
            return response()->json(['message' => 'Ya enviaste una solicitud a este usuario.'], 409);
        }

        $hasInversePending = $existing->contains(
            fn ($row) => (int) $row->user_id === $friendId && $row->status === 'pending'
        );

        DB::transaction(function () use ($user, $friendId, $hasInversePending): void {
            $now = now();

            if ($hasInversePending) {
                DB::table('friends')
                    ->where('user_id', $friendId)
                    ->where('friend_id', $user->id)
                    ->update([
                        'status' => 'accepted',
                        'updated_at' => $now,
                    ]);

                DB::table('friends')->updateOrInsert(
                    [
                        'user_id' => $user->id,
                        'friend_id' => $friendId,
                    ],
                    [
                        'status' => 'accepted',
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
            } else {
                DB::table('friends')->updateOrInsert(
                    [
                        'user_id' => $user->id,
                        'friend_id' => $friendId,
                    ],
                    [
                        'status' => 'pending',
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
            }
        });

        return response()->json([
            'message' => $hasInversePending
                ? 'Solicitud aceptada automaticamente. Ya sois amigos.'
                : 'Solicitud de amistad enviada.',
            'friend' => $friend,
        ], $hasInversePending ? 200 : 201);
    }

    public function destroy(Request $request, User $friend)
    {
        $user = $request->user();

        DB::table('friends')
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

    public function notifications(Request $request)
    {
        $user = $request->user();

        $notifications = DB::table('friends')
            ->join('users', 'friends.user_id', '=', 'users.id')
            ->where('friends.friend_id', $user->id)
            ->where('friends.status', 'pending')
            ->select(
                'users.id as from_user_id',
                'users.name as from_user_name',
                'users.email as from_user_email',
                'friends.created_at'
            )
            ->orderByDesc('friends.created_at')
            ->get();

        return response()->json($notifications);
    }

    public function respond(Request $request, User $friend)
    {
        $data = $request->validate([
            'status' => 'required|in:accepted,rejected',
        ]);

        $user = $request->user();
        $requestedByFriend = DB::table('friends')
            ->where('user_id', $friend->id)
            ->where('friend_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if (!$requestedByFriend) {
            return response()->json(['message' => 'No existe una solicitud pendiente de este usuario.'], 404);
        }

        DB::transaction(function () use ($user, $friend, $data): void {
            $now = now();
            DB::table('friends')
                ->where('user_id', $friend->id)
                ->where('friend_id', $user->id)
                ->update([
                    'status' => $data['status'],
                    'updated_at' => $now,
                ]);

            if ($data['status'] === 'accepted') {
                DB::table('friends')->updateOrInsert(
                    [
                        'user_id' => $user->id,
                        'friend_id' => $friend->id,
                    ],
                    [
                        'status' => 'accepted',
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
            }
        });

        return response()->json([
            'message' => $data['status'] === 'accepted'
                ? 'Solicitud aceptada.'
                : 'Solicitud rechazada.',
        ]);
    }
}
