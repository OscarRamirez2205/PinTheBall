@extends('admin.layout')

@section('title', 'Editar bola')
@section('subtitle', $ball->name)

@section('content')
    <div class="card">
        <form method="post" action="{{ route('admin.balls.update', $ball) }}" enctype="multipart/form-data">
            @csrf
            @method('PUT')

            <div class="form-grid compact">
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
            </div>

            <div class="form-section">
                <p class="form-section-title">Reemplazar pack de texturas</p>
                <p class="muted">
                    Sube un ZIP nuevo para reemplazar el preview y todos los mapas. Si no subes nada, se mantiene el pack actual.
                </p>

                <div class="file-grid">
                    <label class="file-field">
                        ZIP de texturas
                        <span>Debe incluir Preview, BaseColor, Normal, Metallic, Roughness y AmbientOcclusion.</span>
                        <input type="file" name="texture_pack" accept=".zip,application/zip">
                    </label>
                </div>
            </div>

            <p class="muted">
                Se guardará en
                <strong>/uploads/balls-textures/{{ old('texture_slug', $ball->texture_slug) ?: 'slug' }}</strong>
                y la API enviará esas URLs al frontend.
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
