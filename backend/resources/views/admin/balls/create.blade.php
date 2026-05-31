@extends('admin.layout')

@section('title', 'Añadir bola')
@section('subtitle', 'Nueva bola para la tienda')

@section('content')
    <div class="card">
        <form method="post" action="{{ route('admin.balls.store') }}" enctype="multipart/form-data">
            @csrf

            <div class="form-grid">
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
                <label>
                    Carpeta de texturas
                    <input type="file" name="texture_files[]" webkitdirectory directory multiple required>
                </label>
            </div>

            <p class="muted">
                Sube la carpeta completa. Debe contener una imagen <strong>*_Preview1.*</strong> y una carpeta
                <strong>2K</strong> con los mapas <strong>*_BaseColor</strong>, <strong>*_Normal</strong>,
                <strong>*_Metallic</strong>, <strong>*_Roughness</strong> y <strong>*_AmbientOcclusion</strong>.
            </p>

            <div class="actions">
                <button class="button" type="submit">Añadir bola</button>
                <a class="button secondary" href="{{ route('admin.balls') }}">Volver</a>
            </div>
        </form>
    </div>
@endsection
