@extends('admin.layout')

@section('title', 'Editar bola')
@section('subtitle', $ball->name)

@section('content')
    <div class="card">
        <form method="post" action="{{ route('admin.balls.update', $ball) }}" enctype="multipart/form-data">
            @csrf
            @method('PUT')

            <div class="form-grid">
                <label>
                    Nombre
                    <input name="name" value="{{ old('name', $ball->name) }}" required>
                </label>
                <label>
                    Subnombre
                    <input name="subname" value="{{ old('subname', $ball->subname) }}">
                </label>
                <label>
                    Precio
                    <input type="number" name="price" min="0" value="{{ old('price', $ball->price) }}" required>
                </label>
                <label>
                    Precio de oferta
                    <input type="number" name="deal_price" min="0" value="{{ old('deal_price', $ball->deal_price) }}">
                </label>
                <label>
                    Texture slug
                    <input name="texture_slug" value="{{ old('texture_slug', $ball->texture_slug) }}">
                </label>
                <label>
                    Reemplazar carpeta de texturas
                    <input type="file" name="texture_files[]" webkitdirectory directory multiple>
                </label>
                <label>
                    Prefijo detectado
                    <input value="{{ $ball->texture_asset_prefix ?? 'Sin texturas subidas' }}" disabled>
                </label>
            </div>

            <p class="muted">
                Si subes una carpeta nueva, se guardará en
                <strong>public/resources/balls-textures/{{ old('texture_slug', $ball->texture_slug) ?: 'slug' }}</strong>
                y se actualizará el prefijo de textura automáticamente.
            </p>

            <div class="actions">
                <button class="button" type="submit">Guardar cambios</button>
                <a class="button secondary" href="{{ route('admin.balls') }}">Volver</a>
            </div>
        </form>
    </div>

    <div class="card" style="margin-top: 16px;">
        <h2>Datos rápidos</h2>
        <p>Compras registradas: <strong>{{ $ball->users_count }}</strong></p>

        <form method="post" action="{{ route('admin.balls.destroy', $ball) }}" onsubmit="return confirm('¿Borrar esta bola?')">
            @csrf
            @method('DELETE')
            <button class="button danger" type="submit">Borrar bola</button>
        </form>
    </div>
@endsection
