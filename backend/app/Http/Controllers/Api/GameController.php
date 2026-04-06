<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\Request;

class GameController extends Controller
{
    public function index()
    {
        return response()->json(Game::with('user:id,name')->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'player_id' => 'required|exists:users,id',
            'score' => 'required|integer',
            'duration' => 'required|integer',
            'played_at' => 'sometimes|date',
        ]);

        $game = Game::create([
            'player_id' => $data['player_id'],
            'score' => $data['score'],
            'duration' => $data['duration'],
            'played_at' => $data['played_at'] ?? now(),
        ]);

        return response()->json($game->load('user:id,name'), 201);
    }

    public function show(Game $game)
    {
        return response()->json($game->load('user:id,name'));
    }

    public function update(Request $request, Game $game)
    {
        $data = $request->validate([
            'player_id' => 'sometimes|exists:users,id',
            'score' => 'sometimes|integer',
            'duration' => 'sometimes|integer',
            'played_at' => 'sometimes|date',
        ]);

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
        $ranking = Game::query()
            ->select('player_id')
            ->selectRaw('MAX(score) as best_score')
            ->with('user:id,name')
            ->groupBy('player_id')
            ->orderByDesc('best_score')
            ->get();

        return response()->json($ranking);
    }

    public function userGames(int $id)
    {
        $games = Game::where('player_id', $id)
            ->orderByDesc('score')
            ->get();

        return response()->json($games);
    }
}
