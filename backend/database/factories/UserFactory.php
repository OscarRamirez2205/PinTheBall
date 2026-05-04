<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        $now = now()->timestamp;

        return [
            'name' => strtoupper(fake()->lexify('???')),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'wallet' => 0,
            'role' => 'player',
            'available_at' => $now,
            'created_at' => $now,
        ];
    }
}
