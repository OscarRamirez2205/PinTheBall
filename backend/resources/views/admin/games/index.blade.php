@extends('admin.layout')

@section('title', 'Games')
@section('subtitle', 'Partidas registradas')

@section('content')
    <form class="toolbar" method="get" action="{{ route('admin.games') }}">
        <label>
            Día
            <input type="date" name="day" value="{{ $day }}">
        </label>
        <label>
            Usuario
            <input name="player" value="{{ $player }}" placeholder="Ej: PLY">
        </label>
        <label>
            Puntuación mínima
            <input type="number" name="min_score" min="0" value="{{ $minScore }}">
        </label>
        <button class="button" type="submit">Filtrar</button>
        <a class="button secondary" href="{{ route('admin.games') }}">Limpiar</a>
    </form>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Jugador</th>
                <th>Puntos</th>
                <th>Duración</th>
                <th>Fecha</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($games as $game)
                <tr>
                    <td>{{ $game->id }}</td>
                    <td>{{ $game->user?->name ?? $game->guest_name ?? 'INV' }}</td>
                    <td>{{ number_format($game->score, 0, ',', '.') }}</td>
                    <td>{{ $game->duration }}s</td>
                    <td>{{ $game->played_at?->format('d/m/Y H:i') }}</td>
                    <td>
                        <form class="inline-form" method="post" action="{{ route('admin.games.destroy', $game) }}" onsubmit="return confirm('¿Borrar esta partida?')">
                            @csrf
                            @method('DELETE')
                            <button class="button danger" type="submit">Borrar</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr><td colspan="6">No se han encontrado partidas.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="pagination">
        @if ($games->previousPageUrl())
            <a class="button secondary" href="{{ $games->previousPageUrl() }}">Anterior</a>
        @endif
        <span class="muted">Página {{ $games->currentPage() }} de {{ $games->lastPage() }}</span>
        @if ($games->nextPageUrl())
            <a class="button secondary" href="{{ $games->nextPageUrl() }}">Siguiente</a>
        @endif
    </div>
@endsection
