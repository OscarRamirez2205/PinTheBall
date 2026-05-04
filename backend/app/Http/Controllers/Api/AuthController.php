<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'regex:/^[A-Za-z]{3}$/'],
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'name.regex' => 'El nombre debe ser exactamente 3 letras (A-Z), estilo marcador arcade.',
            'email.unique' => 'Ya existe una cuenta con este correo electrónico.',
            'email.email' => 'Introduce un correo electrónico válido.',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $data['name'] = Str::upper($data['name']);

        $now = now()->timestamp;
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'player',
            'available_at' => $now,
            'created_at' => $now,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
