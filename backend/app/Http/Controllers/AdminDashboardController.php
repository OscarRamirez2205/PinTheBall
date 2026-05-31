<?php

namespace App\Http\Controllers;

use App\Models\Ball;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\View\View;
use Illuminate\Validation\ValidationException;

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
        $data = $this->validateBall($request, true);
        $data = array_merge($data, $this->storeTextureFiles($request, $data['texture_slug'] ?? null, $data['name']));

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
        $data = $this->validateBall($request, false);

        if ($request->hasFile('texture_files')) {
            $data = array_merge($data, $this->storeTextureFiles($request, $data['texture_slug'] ?? $ball->texture_slug, $data['name']));
        }

        $ball->fill($data);
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

    private function validateBall(Request $request, bool $requiresTextures): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'subname' => 'nullable|string|max:255',
            'texture_slug' => ['nullable', 'string', 'max:64', 'regex:/^[a-z0-9-]+$/'],
            'price' => 'required|integer|min:0',
            'deal_price' => 'nullable|integer|min:0',
            'texture_files' => [$requiresTextures ? 'required' : 'sometimes', 'array'],
            'texture_files.*' => 'file|max:102400',
        ], [
            'texture_slug.regex' => 'El slug de textura solo puede usar minúsculas, números y guiones.',
            'texture_files.required' => 'Debes subir la carpeta de texturas de la bola.',
        ]);

        unset($data['texture_files']);

        return $data;
    }

    private function storeTextureFiles(Request $request, ?string $requestedSlug, string $ballName): array
    {
        $files = $request->file('texture_files', []);
        if (! is_array($files) || $files === []) {
            throw ValidationException::withMessages([
                'texture_files' => 'Debes subir la carpeta completa de texturas.',
            ]);
        }

        $slug = $requestedSlug ?: Str::lower(Str::slug($ballName, ''));
        if ($slug === '') {
            throw ValidationException::withMessages([
                'texture_slug' => 'No se ha podido generar el slug de textura.',
            ]);
        }

        $targetRoot = $this->textureStorageRoot().DIRECTORY_SEPARATOR.$slug;
        File::ensureDirectoryExists($targetRoot);

        $previewPrefix = null;
        $mapPrefix = null;
        $maps = [
            'BaseColor' => false,
            'Normal' => false,
            'Metallic' => false,
            'Roughness' => false,
            'AmbientOcclusion' => false,
        ];

        foreach ($files as $file) {
            if (! $file instanceof UploadedFile || ! $file->isValid()) {
                continue;
            }

            $relativePath = $this->normalizeTextureUploadPath($file);
            if ($relativePath === null) {
                continue;
            }

            $filename = basename($relativePath);
            $destination = $targetRoot.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, dirname($relativePath));
            if ($destination === $targetRoot.DIRECTORY_SEPARATOR.'.') {
                $destination = $targetRoot;
            }
            File::ensureDirectoryExists($destination);
            $file->move($destination, $filename);

            if (preg_match('/^(.+)_Preview\d+\.(png|jpe?g|webp)$/i', $filename, $match) === 1) {
                $previewPrefix = $match[1];
            }

            if (str_starts_with(strtolower($relativePath), '2k/')) {
                foreach (array_keys($maps) as $mapName) {
                    if (preg_match('/^(.+)_'.$mapName.'\.(png|jpe?g|tiff?|webp)$/i', $filename, $match) === 1) {
                        if ($mapPrefix !== null && $mapPrefix !== $match[1]) {
                            throw ValidationException::withMessages([
                                'texture_files' => 'Todos los mapas de 2K deben usar el mismo prefijo de archivo.',
                            ]);
                        }
                        $maps[$mapName] = true;
                        $mapPrefix = $mapPrefix ?? $match[1];
                    }
                }
            }
        }

        $missingMaps = array_keys(array_filter($maps, fn (bool $found): bool => ! $found));
        if ($previewPrefix === null || $mapPrefix === null || $missingMaps !== [] || $previewPrefix !== $mapPrefix) {
            throw ValidationException::withMessages([
                'texture_files' => 'La carpeta debe incluir una imagen *_Preview1.* y en 2K los mapas *_BaseColor, *_Normal, *_Metallic, *_Roughness y *_AmbientOcclusion con el mismo prefijo.',
            ]);
        }

        return [
            'texture_slug' => $slug,
            'texture_asset_prefix' => $mapPrefix,
        ];
    }

    private function normalizeTextureUploadPath(UploadedFile $file): ?string
    {
        $path = method_exists($file, 'getClientOriginalPath')
            ? $file->getClientOriginalPath()
            : $file->getClientOriginalName();
        $parts = array_values(array_filter(explode('/', str_replace('\\', '/', $path)), fn (string $part): bool => $part !== '' && $part !== '.' && $part !== '..'));
        if ($parts === []) {
            return null;
        }

        $twoKIndex = null;
        foreach ($parts as $index => $part) {
            if (strtolower($part) === '2k') {
                $twoKIndex = $index;
                break;
            }
        }

        if ($twoKIndex !== null) {
            return '2K/'.implode('/', array_slice($parts, $twoKIndex + 1));
        }

        return basename(end($parts));
    }

    private function textureStorageRoot(): string
    {
        return rtrim((string) env('ADMIN_TEXTURES_PATH', base_path('../frontend/public/resources/balls-textures')), "\\/");
    }
}
