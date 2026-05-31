@extends('admin.layout')

@section('title', 'Añadir bola')
@section('subtitle', 'Nueva bola para la tienda')

@section('content')
    <div class="card">
        <form method="post" action="{{ route('admin.balls.store') }}">
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
                    <input name="texture_slug" value="{{ old('texture_slug') }}" placeholder="metalsteelbrushed">
                </label>
            </div>

            <div class="actions">
                <button class="button" type="submit">Añadir bola</button>
                <a class="button secondary" href="{{ route('admin.balls') }}">Volver</a>
            </div>
        </form>
    </div>
@endsection
