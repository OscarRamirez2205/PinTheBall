@extends('admin.layout')

@section('title', 'Players')
@section('subtitle', 'Listado y búsqueda de usuarios')

@section('content')
    <form class="toolbar" method="get" action="{{ route('admin.players') }}">
        <label>
            Buscar por nombre o email
            <input name="q" value="{{ $search }}" placeholder="Ej: ADM">
        </label>
        <button class="button" type="submit">Buscar</button>
        <a class="button secondary" href="{{ route('admin.players') }}">Limpiar</a>
    </form>

    <table>
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Monedas</th>
                <th>Mejor puntuación</th>
                <th>Partidas</th>
                <th>Bolas</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($players as $player)
                <tr>
                    <td>{{ $player->name }}</td>
                    <td>{{ $player->email }}</td>
                    <td>{{ $player->role }}</td>
                    <td>{{ $player->wallet ?? 0 }}</td>
                    <td>{{ number_format((int) ($player->games_max_score ?? 0), 0, ',', '.') }}</td>
                    <td>{{ $player->games_count }}</td>
                    <td>{{ $player->balls_count }}</td>
                    <td><a href="{{ route('admin.players.edit', $player) }}">Editar</a></td>
                </tr>
            @empty
                <tr><td colspan="8">No se han encontrado usuarios.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="pagination">
        @if ($players->previousPageUrl())
            <a class="button secondary" href="{{ $players->previousPageUrl() }}">Anterior</a>
        @endif
        <span class="muted">Página {{ $players->currentPage() }} de {{ $players->lastPage() }}</span>
        @if ($players->nextPageUrl())
            <a class="button secondary" href="{{ $players->nextPageUrl() }}">Siguiente</a>
        @endif
    </div>
@endsection
