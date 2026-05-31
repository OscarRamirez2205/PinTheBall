@extends('admin.layout')

@section('title', 'Editar player')
@section('subtitle', $user->name.' · '.$user->email)

@section('content')
    <div class="card">
        <form method="post" action="{{ route('admin.players.update', $user) }}">
            @csrf
            @method('PUT')

            <div class="form-grid">
                <label>
                    Nombre
                    <input name="name" maxlength="3" value="{{ old('name', $user->name) }}" required>
                </label>
                <label>
                    Email
                    <input type="email" name="email" value="{{ old('email', $user->email) }}" required>
                </label>
                <label>
                    Rol
                    <select name="role" required>
                        <option value="player" @selected(old('role', $user->role) === 'player')>player</option>
                        <option value="admin" @selected(old('role', $user->role) === 'admin')>admin</option>
                    </select>
                </label>
                <label>
                    Monedas
                    <input type="number" name="wallet" min="0" value="{{ old('wallet', $user->wallet ?? 0) }}" required>
                </label>
                <label>
                    Nueva contraseña
                    <input type="password" name="password" placeholder="Dejar vacío para no cambiar">
                </label>
            </div>

            <div class="actions">
                <button class="button" type="submit">Guardar cambios</button>
                <a class="button secondary" href="{{ route('admin.players') }}">Volver</a>
            </div>
        </form>
    </div>

    <div class="card" style="margin-top: 16px;">
        <h2>Datos rápidos</h2>
        <p>Partidas jugadas: <strong>{{ $user->games_count }}</strong></p>
        <p>Bolas en cuenta: <strong>{{ $user->balls_count }}</strong></p>

        <form method="post" action="{{ route('admin.players.destroy', $user) }}" onsubmit="return confirm('¿Borrar este jugador?')">
            @csrf
            @method('DELETE')
            <button class="button danger" type="submit">Borrar jugador</button>
        </form>
    </div>
@endsection
