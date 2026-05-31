@extends('admin.layout')

@section('title', 'Dashboard')
@section('subtitle', 'Resumen general del proyecto')

@section('content')
    <section class="grid cards">
        <div class="card">
            <div class="muted">Jugadores</div>
            <div class="stat">{{ $stats['players'] }}</div>
        </div>
        <div class="card">
            <div class="muted">Activos últimos 30 días</div>
            <div class="stat">{{ $stats['active_players'] }}</div>
        </div>
        <div class="card">
            <div class="muted">Bolas</div>
            <div class="stat">{{ $stats['balls'] }}</div>
        </div>
        <div class="card">
            <div class="muted">Partidas</div>
            <div class="stat">{{ $stats['games'] }}</div>
        </div>
    </section>

    <section class="grid two">
        <div class="card">
            <h2>Top puntuaciones</h2>
            <table>
                <thead>
                    <tr>
                        <th>Jugador</th>
                        <th>Puntos</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($topPlayers as $player)
                        <tr>
                            <td>{{ $player->player_name }}</td>
                            <td>{{ number_format((int) $player->best_score, 0, ',', '.') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="2">Todavía no hay partidas.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Bolas más compradas</h2>
            <table>
                <thead>
                    <tr>
                        <th>Bola</th>
                        <th>Compras</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($popularBalls as $ball)
                        <tr>
                            <td>{{ $ball->name }}</td>
                            <td>{{ $ball->users_count }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="2">No hay bolas creadas.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <section class="card" style="margin-top: 16px;">
        <h2>Últimas partidas</h2>
        <table>
            <thead>
                <tr>
                    <th>Jugador</th>
                    <th>Puntos</th>
                    <th>Duración</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($recentGames as $game)
                    <tr>
                        <td>{{ $game->user?->name ?? $game->guest_name ?? 'INV' }}</td>
                        <td>{{ number_format($game->score, 0, ',', '.') }}</td>
                        <td>{{ $game->duration }}s</td>
                        <td>{{ $game->played_at?->format('d/m/Y H:i') }}</td>
                    </tr>
                @empty
                    <tr><td colspan="4">Todavía no hay partidas.</td></tr>
                @endforelse
            </tbody>
        </table>
    </section>
@endsection
