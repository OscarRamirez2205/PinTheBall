<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $now = now()->timestamp;

        DB::table('users')->insert([
            [
                'name' => 'Admin',
                'email' => 'admin@pintheball.com',
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'available_at' => $now,
                'created_at' => $now,
            ],
            [
                'name' => 'Player1',
                'email' => 'player1@pintheball.com',
                'password' => Hash::make('123456'),
                'role' => 'player',
                'available_at' => $now,
                'created_at' => $now,
            ],
        ]);
    }
}
