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

        if ($this->hasTextureUploads($request)) {
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
            'texture_preview' => [$requiresTextures ? 'required' : 'sometimes', 'file', 'mimes:png', 'max:102400'],
            'texture_base_color' => [$requiresTextures ? 'required' : 'sometimes', 'file', 'mimes:jpg,jpeg', 'max:102400'],
            'texture_normal' => [$requiresTextures ? 'required' : 'sometimes', 'file', 'mimes:png', 'max:102400'],
            'texture_metallic' => [$requiresTextures ? 'required' : 'sometimes', 'file', 'mimes:jpg,jpeg', 'max:102400'],
            'texture_roughness' => [$requiresTextures ? 'required' : 'sometimes', 'file', 'mimes:jpg,jpeg', 'max:102400'],
            'texture_ambient_occlusion' => [$requiresTextures ? 'required' : 'sometimes', 'file', 'mimes:jpg,jpeg', 'max:102400'],
        ], [
            'texture_slug.regex' => 'El slug de textura solo puede usar minúsculas, números y guiones.',
            'texture_preview.required' => 'Debes subir la imagen preview de la bola.',
            'texture_base_color.required' => 'Debes subir la textura BaseColor.',
            'texture_normal.required' => 'Debes subir la textura Normal.',
            'texture_metallic.required' => 'Debes subir la textura Metallic.',
            'texture_roughness.required' => 'Debes subir la textura Roughness.',
            'texture_ambient_occlusion.required' => 'Debes subir la textura AmbientOcclusion.',
        ]);

        unset(
            $data['texture_preview'],
            $data['texture_base_color'],
            $data['texture_normal'],
            $data['texture_metallic'],
            $data['texture_roughness'],
            $data['texture_ambient_occlusion'],
        );

        return $data;
    }

    private function storeTextureFiles(Request $request, ?string $requestedSlug, string $ballName): array
    {
        $slug = $requestedSlug ?: Str::lower(Str::slug($ballName, ''));
        if ($slug === '') {
            throw ValidationException::withMessages([
                'texture_slug' => 'No se ha podido generar el slug de textura.',
            ]);
        }

        $files = $this->textureUploadFiles($request);

        $targetRoot = $this->textureStorageRoot().DIRECTORY_SEPARATOR.$slug;
        $twoKRoot = $targetRoot.DIRECTORY_SEPARATOR.'2K';

        File::ensureDirectoryExists($targetRoot);
        File::cleanDirectory($targetRoot);
        File::ensureDirectoryExists($twoKRoot);

        $standardFiles = [
            [$files['texture_preview'], $targetRoot.DIRECTORY_SEPARATOR.$slug.'_Preview1.png'],
            [$files['texture_base_color'], $twoKRoot.DIRECTORY_SEPARATOR.$slug.'_BaseColor.jpg'],
            [$files['texture_normal'], $twoKRoot.DIRECTORY_SEPARATOR.$slug.'_Normal.png'],
            [$files['texture_metallic'], $twoKRoot.DIRECTORY_SEPARATOR.$slug.'_Metallic.jpg'],
            [$files['texture_roughness'], $twoKRoot.DIRECTORY_SEPARATOR.$slug.'_Roughness.jpg'],
            [$files['texture_ambient_occlusion'], $twoKRoot.DIRECTORY_SEPARATOR.$slug.'_AmbientOcclusion.jpg'],
        ];

        foreach ($standardFiles as [$file, $path]) {
            File::copy($file->getRealPath(), $path);
        }

        return [
            'texture_slug' => $slug,
            'texture_asset_prefix' => $slug,
        ];
    }

    private function hasTextureUploads(Request $request): bool
    {
        foreach (array_keys($this->textureFileFields()) as $field) {
            if ($request->hasFile($field)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<string, UploadedFile>
     */
    private function textureUploadFiles(Request $request): array
    {
        $files = [];
        foreach ($this->textureFileFields() as $field => $label) {
            $file = $request->file($field);
            if (! $file instanceof UploadedFile || ! $file->isValid()) {
                throw ValidationException::withMessages([
                    $field => "Debes subir el archivo {$label}.",
                ]);
            }
            $files[$field] = $file;
        }

        return $files;
    }

    private function textureFileFields(): array
    {
        return [
            'texture_preview' => 'Preview',
            'texture_base_color' => 'BaseColor',
            'texture_normal' => 'Normal',
            'texture_metallic' => 'Metallic',
            'texture_roughness' => 'Roughness',
            'texture_ambient_occlusion' => 'AmbientOcclusion',
        ];
    }

    private function textureStorageRoot(): string
    {
        return rtrim((string) env('ADMIN_TEXTURES_PATH', base_path('../frontend/public/resources/balls-textures')), "\\/");
    }
}
