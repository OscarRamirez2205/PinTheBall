@extends('admin.layout')

@section('title', 'Añadir bola')
@section('subtitle', 'Nueva bola para la tienda')

@section('content')
    <div class="card">
        <form method="post" action="{{ route('admin.balls.store') }}" enctype="multipart/form-data">
            @csrf

            <div class="form-grid compact">
                <label>
                    Nombre
                    <input name="name" value="{{ old('name') }}" required>
                </label>
                <label>
                    Subnombre
                    <input name="subname" value="{{ old('subname') }}">
                </label>
                <label>
                    Precio
                    <input type="number" name="price" min="0" value="{{ old('price', 0) }}" required>
                </label>
                <label>
                    Precio de oferta
                    <input type="number" name="deal_price" min="0" value="{{ old('deal_price') }}">
                </label>
                <label>
                    Texture slug
                    <input name="texture_slug" value="{{ old('texture_slug') }}" placeholder="se genera desde el nombre si lo dejas vacío">
                </label>
            </div>

            <div class="form-section">
                <p class="form-section-title">Archivos de textura</p>
                <p class="muted">
                    Elige cada archivo por separado. El sistema creará la carpeta de la bola y renombrará los archivos
                    con el slug automáticamente.
                </p>

                <div class="file-grid">
                    <label class="file-field">
                        Preview (PNG)
                        <span>Imagen de muestra que se verá en la tienda.</span>
                        <input type="file" name="texture_preview" accept=".png,image/png" required>
                    </label>
                    <label class="file-field">
                        BaseColor (JPG)
                        <span>Color principal de la textura.</span>
                        <input type="file" name="texture_base_color" accept=".jpg,.jpeg,image/jpeg" required>
                    </label>
                    <label class="file-field">
                        Normal (PNG)
                        <span>Relieve/detalle de la superficie.</span>
                        <input type="file" name="texture_normal" accept=".png,image/png" required>
                    </label>
                    <label class="file-field">
                        Metallic (JPG)
                        <span>Mapa de metalicidad.</span>
                        <input type="file" name="texture_metallic" accept=".jpg,.jpeg,image/jpeg" required>
                    </label>
                    <label class="file-field">
                        Roughness (JPG)
                        <span>Mapa de rugosidad.</span>
                        <input type="file" name="texture_roughness" accept=".jpg,.jpeg,image/jpeg" required>
                    </label>
                    <label class="file-field">
                        AmbientOcclusion (JPG)
                        <span>Sombras/oclusión ambiental.</span>
                        <input type="file" name="texture_ambient_occlusion" accept=".jpg,.jpeg,image/jpeg" required>
                    </label>
                </div>
            </div>

            <p class="muted">
                El sistema creará automáticamente la carpeta
                <strong>public/resources/balls-textures/{slug}</strong>, guardará el preview en la raíz y las
                texturas dentro de <strong>2K</strong>. No hace falta que los archivos tengan ningún prefijo concreto.
            </p>

            <div class="actions">
                <button class="button" type="submit">Añadir bola</button>
                <a class="button secondary" href="{{ route('admin.balls') }}">Volver</a>
            </div>
        </form>
    </div>
@endsection
