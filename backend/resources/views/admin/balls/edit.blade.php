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
                    Reemplazar Preview (PNG)
                    <input type="file" name="texture_preview" accept=".png,image/png">
                </label>
                <label>
                    Reemplazar BaseColor (JPG)
                    <input type="file" name="texture_base_color" accept=".jpg,.jpeg,image/jpeg">
                </label>
                <label>
                    Reemplazar Normal (PNG)
                    <input type="file" name="texture_normal" accept=".png,image/png">
                </label>
                <label>
                    Reemplazar Metallic (JPG)
                    <input type="file" name="texture_metallic" accept=".jpg,.jpeg,image/jpeg">
                </label>
                <label>
                    Reemplazar Roughness (JPG)
                    <input type="file" name="texture_roughness" accept=".jpg,.jpeg,image/jpeg">
                </label>
                <label>
                    Reemplazar AmbientOcclusion (JPG)
                    <input type="file" name="texture_ambient_occlusion" accept=".jpg,.jpeg,image/jpeg">
                </label>
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
