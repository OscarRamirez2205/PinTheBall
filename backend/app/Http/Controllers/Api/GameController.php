<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    public function index()
    {
        return response()->json(Game::with('user:id,name')->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'player_id' => 'nullable|exists:users,id',
            'guest_name' => ['nullable', 'string', 'regex:/^[A-Za-z]{3}$/'],
            'score' => 'required|integer',
            'duration' => 'required|integer',
            'played_at' => 'sometimes|date',
        ], [
            'guest_name.regex' => 'El nombre de invitado debe ser exactamente 3 letras (A-Z).',
        ]);

        $game = Game::create([
            'player_id' => $data['player_id'] ?? null,
            'guest_name' => isset($data['guest_name']) ? strtoupper($data['guest_name']) : null,
            'score' => $data['score'],
            'duration' => $data['duration'],
            'played_at' => $data['played_at'] ?? now(),
        ]);

        $coinsEarned = 0;
        $wallet = null;
        if (! empty($data['player_id'])) {
            $player = User::query()->find($data['player_id']);
            if ($player !== null) {
                $coinsEarned = intdiv(max(0, (int) $data['score']), 1000);
                if ($coinsEarned > 0) {
                    $player->wallet = (int) $player->wallet + $coinsEarned;
                    $player->save();
                }
                $wallet = (int) $player->wallet;
            }
        }

        $payload = $game->load('user:id,name')->toArray();
        $payload['coins_earned'] = $coinsEarned;
        if ($wallet !== null) {
            $payload['wallet'] = $wallet;
        }

        return response()->json($payload, 201);
    }

    public function show(Game $game)
    {
        return response()->json($game->load('user:id,name'));
    }

    public function update(Request $request, Game $game)
    {
        $data = $request->validate([
            'player_id' => 'sometimes|nullable|exists:users,id',
            'guest_name' => ['sometimes', 'nullable', 'string', 'regex:/^[A-Za-z]{3}$/'],
            'score' => 'sometimes|integer',
            'duration' => 'sometimes|integer',
            'played_at' => 'sometimes|date',
        ], [
            'guest_name.regex' => 'El nombre de invitado debe ser exactamente 3 letras (A-Z).',
        ]);

        if (array_key_exists('guest_name', $data) && $data['guest_name'] !== null) {
            $data['guest_name'] = strtoupper($data['guest_name']);
        }

        $game->fill($data);
        $game->save();

        return response()->json($game->load('user:id,name'));
    }

    public function destroy(Game $game)
    {
        $game->delete();

        return response()->json(null, 204);
    }

    public function ranking()
    {
        $ranking = $this->buildRankingQuery()
            ->orderByDesc('best_score')
            ->orderBy('player_name')
            ->get()
            ->map(function ($row) {
                return [
                    'player_id' => $row->player_id !== null ? (int) $row->player_id : null,
                    'player_name' => (string) $row->player_name,
                    'best_score' => (int) $row->best_score,
                ];
            })
            ->values();

        return response()->json($ranking);
    }

    public function weeklyRanking()
    {
        $start = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $end = Carbon::now()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $ranking = $this->buildRankingQuery($start, $end)
            ->orderByDesc('best_score')
            ->orderBy('player_name')
            ->get()
            ->map(function ($row) {
                return [
                    'player_id' => $row->player_id !== null ? (int) $row->player_id : null,
                    'player_name' => (string) $row->player_name,
                    'best_score' => (int) $row->best_score,
                ];
            })
            ->values();

        return response()->json($ranking);
    }

    public function userGames(int $id)
    {
        $games = Game::where('player_id', $id)
            ->orderByDesc('score')
            ->get();

        return response()->json($games);
    }

    private function buildRankingQuery(?Carbon $from = null, ?Carbon $to = null)
    {
        $keyExpr = "COALESCE(CONCAT('u:', users.id), CONCAT('g:', UPPER(games.guest_name)))";
        $nameExpr = "COALESCE(users.name, UPPER(games.guest_name), 'INV')";

        $query = Game::query()
            ->leftJoin('users', 'users.id', '=', 'games.player_id')
            ->where(function ($builder): void {
                $builder
                    ->whereNotNull('games.player_id')
                    ->orWhereNotNull('games.guest_name');
            })
            ->selectRaw("$keyExpr as entry_key")
            ->selectRaw("$nameExpr as player_name")
            ->selectRaw('MAX(games.score) as best_score')
            ->selectRaw('MAX(users.id) as player_id')
            ->groupBy(DB::raw($keyExpr), DB::raw($nameExpr));

        if ($from !== null && $to !== null) {
            $query->whereBetween('games.played_at', [$from, $to]);
        }

        return $query;
    }
}
