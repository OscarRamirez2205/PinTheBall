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
                'name' => 'ADM',
                'email' => 'admin@pintheball.com',
                'password' => Hash::make('123456'),
                'wallet' => 10_000,
                'role' => 'admin',
                'available_at' => $now,
                'created_at' => $now,
            ],
            [
                'name' => 'PLY',
                'email' => 'player1@pintheball.com',
                'password' => Hash::make('123456'),
                'wallet' => 1_420,
                'role' => 'player',
                'available_at' => $now,
                'created_at' => $now,
            ],
        ]);
    }
}
