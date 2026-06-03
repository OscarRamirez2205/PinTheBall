@extends('admin.layout')

@section('title', 'Balls')
@section('subtitle', 'Catálogo de bolas y ventas')

@section('top-actions')
    <a class="button" href="{{ route('admin.balls.create') }}">Añadir bola</a>
@endsection

@section('content')
    <section class="grid two" style="margin-bottom: 16px;">
        <div class="card">
            <div class="muted">Bola más vendida</div>
            <div class="stat">{{ $mostSold?->name ?? 'N/A' }}</div>
            <div class="muted">{{ $mostSold?->users_count ?? 0 }} compras</div>
        </div>
        <div class="card">
            <div class="muted">Bola menos vendida</div>
            <div class="stat">{{ $leastSold?->name ?? 'N/A' }}</div>
            <div class="muted">{{ $leastSold?->users_count ?? 0 }} compras</div>
        </div>
    </section>

    <form class="toolbar" method="get" action="{{ route('admin.balls') }}">
        <label>
            Buscar por nombre
            <input name="q" value="{{ $search }}" placeholder="Ej: metal">
        </label>
        <button class="button" type="submit">Buscar</button>
        <a class="button secondary" href="{{ route('admin.balls') }}">Limpiar</a>
    </form>

    <table>
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Oferta</th>
                <th>Textura</th>
                <th>Archivos</th>
                <th>Compras</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($balls as $ball)
                <tr>
                    <td>{{ $ball->name }}</td>
                    <td>{{ $ball->price }}</td>
                    <td>{{ $ball->deal_price ?? '-' }}</td>
                    <td>{{ $ball->texture_slug ?? '-' }}</td>
                    <td>{{ $ball->texture_asset_prefix ? 'OK' : '-' }}</td>
                    <td>{{ $ball->users_count }}</td>
                    <td><a href="{{ route('admin.balls.edit', $ball) }}">Editar</a></td>
                </tr>
            @empty
                <tr><td colspan="7">No se han encontrado bolas.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="pagination">
        @if ($balls->previousPageUrl())
            <a class="button secondary" href="{{ $balls->previousPageUrl() }}">Anterior</a>
        @endif
        <span class="muted">Página {{ $balls->currentPage() }} de {{ $balls->lastPage() }}</span>
        @if ($balls->nextPageUrl())
            <a class="button secondary" href="{{ $balls->nextPageUrl() }}">Siguiente</a>
        @endif
    </div>
@endsection
