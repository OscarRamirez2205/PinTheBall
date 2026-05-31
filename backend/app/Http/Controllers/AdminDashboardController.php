<?php

namespace App\Http\Controllers;

use App\Models\Ball;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

class AdminDashboardController extends Controller
{
    public function index(): View
    {
        $stats = [
            'players' => User::where('role', 'player')->count(),
            'active_players' => User::whereHas('games', fn ($query) => $query->where('played_at', '>=', now()->subDays(30)))->count(),
            'balls' => Ball::count(),
            'games' => Game::count(),
        ];

        $topPlayers = Game::query()
            ->leftJoin('users', 'users.id', '=', 'games.player_id')
            ->selectRaw("COALESCE(users.name, UPPER(games.guest_name), 'INV') as player_name")
            ->selectRaw('MAX(games.score) as best_score')
            ->groupBy(DB::raw("COALESCE(users.name, UPPER(games.guest_name), 'INV')"))
            ->orderByDesc('best_score')
            ->limit(5)
            ->get();

        $popularBalls = Ball::withCount('users')
            ->orderByDesc('users_count')
            ->orderBy('name')
            ->limit(5)
            ->get();

        $recentGames = Game::with('user:id,name')
            ->orderByDesc('played_at')
            ->limit(8)
            ->get();

        return view('admin.dashboard', compact('stats', 'topPlayers', 'popularBalls', 'recentGames'));
    }

    public function players(Request $request): View
    {
        $search = trim((string) $request->query('q', ''));
        $players = User::query()
            ->withCount(['games', 'balls'])
            ->withMax('games', 'score')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('role')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        return view('admin.players.index', compact('players', 'search'));
    }

    public function editPlayer(User $user): View
    {
        $user->loadCount(['games', 'balls']);

        return view('admin.players.edit', compact('user'));
    }

    public function updatePlayer(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'regex:/^[A-Za-z]{3}$/'],
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
            'role' => 'required|in:admin,player',
            'wallet' => 'required|integer|min:0',
            'password' => 'nullable|string|min:6',
        ]);

        $data['name'] = Str::upper($data['name']);
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->fill($data);
        $user->save();

        return redirect()->route('admin.players.edit', $user)->with('status', 'Jugador actualizado.');
    }

    public function destroyPlayer(Request $request, User $user): RedirectResponse
    {
        if ((int) $request->user()->id === (int) $user->id) {
            return back()->withErrors(['player' => 'No puedes borrar el administrador con el que has iniciado sesión.']);
        }

        $user->delete();

        return redirect()->route('admin.players')->with('status', 'Jugador eliminado.');
    }

    public function balls(Request $request): View
    {
        $search = trim((string) $request->query('q', ''));
        $balls = Ball::query()
            ->withCount('users')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('subname', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        $mostSold = Ball::withCount('users')->orderByDesc('users_count')->orderBy('name')->first();
        $leastSold = Ball::withCount('users')->orderBy('users_count')->orderBy('name')->first();

        return view('admin.balls.index', compact('balls', 'search', 'mostSold', 'leastSold'));
    }

    public function createBall(): View
    {
        return view('admin.balls.create');
    }

    public function storeBall(Request $request): RedirectResponse
    {
        $data = $this->validateBall($request);
        Ball::create($data);

        return redirect()->route('admin.balls')->with('status', 'Bola añadida.');
    }

    public function editBall(Ball $ball): View
    {
        $ball->loadCount('users');

        return view('admin.balls.edit', compact('ball'));
    }

    public function updateBall(Request $request, Ball $ball): RedirectResponse
    {
        $ball->fill($this->validateBall($request));
        $ball->save();

        return redirect()->route('admin.balls.edit', $ball)->with('status', 'Bola actualizada.');
    }

    public function destroyBall(Ball $ball): RedirectResponse
    {
        $ball->delete();

        return redirect()->route('admin.balls')->with('status', 'Bola eliminada.');
    }

    public function games(Request $request): View
    {
        $day = trim((string) $request->query('day', ''));
        $player = trim((string) $request->query('player', ''));
        $minScore = $request->query('min_score');

        $games = Game::query()
            ->with('user:id,name')
            ->when($day !== '', fn ($query) => $query->whereDate('played_at', $day))
            ->when($player !== '', function ($query) use ($player): void {
                $query->where(function ($inner) use ($player): void {
                    $inner->where('guest_name', 'like', "%{$player}%")
                        ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$player}%"));
                });
            })
            ->when(is_numeric($minScore), fn ($query) => $query->where('score', '>=', (int) $minScore))
            ->orderByDesc('played_at')
            ->paginate(15)
            ->withQueryString();

        return view('admin.games.index', compact('games', 'day', 'player', 'minScore'));
    }

    public function destroyGame(Game $game): RedirectResponse
    {
        $game->delete();

        return redirect()->route('admin.games')->with('status', 'Partida eliminada.');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->user()?->tokens()->delete();

        return redirect('/')->withoutCookie('ptb_admin_token', '/');
    }

    private function validateBall(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'subname' => 'nullable|string|max:255',
            'texture_slug' => 'nullable|string|max:64',
            'price' => 'required|integer|min:0',
            'deal_price' => 'nullable|integer|min:0',
        ]);
    }
}
