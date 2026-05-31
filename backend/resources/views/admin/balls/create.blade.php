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
                <p class="form-section-title">Pack de texturas</p>
                <p class="muted">
                    Sube el ZIP tal como lo descargas. Debe incluir el preview y los mapas BaseColor, Normal, Metallic,
                    Roughness y AmbientOcclusion.
                </p>

                <div class="file-grid">
                    <label class="file-field">
                        ZIP de texturas
                        <span>El sistema extraerá el ZIP y guardará las texturas en uploads.</span>
                        <input type="file" name="texture_pack" accept=".zip,application/zip" required>
                    </label>
                </div>
            </div>

            <p class="muted">
                Se guardará como
                <strong>/uploads/balls-textures/{slug}</strong> y la API enviará esas URLs al frontend.
            </p>

            <div class="actions">
                <button class="button" type="submit">Añadir bola</button>
                <a class="button secondary" href="{{ route('admin.balls') }}">Volver</a>
            </div>
        </form>
    </div>
@endsection
