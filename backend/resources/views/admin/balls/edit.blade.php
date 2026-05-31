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
                <p class="form-section-title">Reemplazar texturas</p>
                <p class="muted">
                    Para cambiar las texturas, sube los seis archivos. Si no subes nada, se mantienen los archivos actuales.
                </p>

                <div class="file-grid">
                    <label class="file-field">
                        Reemplazar Preview (PNG)
                        <span>Imagen de muestra que se verá en la tienda.</span>
                        <input type="file" name="texture_preview" accept=".png,image/png">
                    </label>
                    <label class="file-field">
                        Reemplazar BaseColor (JPG)
                        <span>Color principal de la textura.</span>
                        <input type="file" name="texture_base_color" accept=".jpg,.jpeg,image/jpeg">
                    </label>
                    <label class="file-field">
                        Reemplazar Normal (PNG)
                        <span>Relieve/detalle de la superficie.</span>
                        <input type="file" name="texture_normal" accept=".png,image/png">
                    </label>
                    <label class="file-field">
                        Reemplazar Metallic (JPG)
                        <span>Mapa de metalicidad.</span>
                        <input type="file" name="texture_metallic" accept=".jpg,.jpeg,image/jpeg">
                    </label>
                    <label class="file-field">
                        Reemplazar Roughness (JPG)
                        <span>Mapa de rugosidad.</span>
                        <input type="file" name="texture_roughness" accept=".jpg,.jpeg,image/jpeg">
                    </label>
                    <label class="file-field">
                        Reemplazar AmbientOcclusion (JPG)
                        <span>Sombras/oclusión ambiental.</span>
                        <input type="file" name="texture_ambient_occlusion" accept=".jpg,.jpeg,image/jpeg">
                    </label>
                </div>
            </div>

            <p class="muted">
                Para reemplazar texturas, sube los seis archivos. Se guardarán en
                <strong>public/resources/balls-textures/{{ old('texture_slug', $ball->texture_slug) ?: 'slug' }}</strong>
                con el preview en la raíz y las texturas dentro de <strong>2K</strong>.
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
