<?php

// database/seeders/GamesSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GamesSeeder extends Seeder {
    public function run(): void {
        DB::table('games')->insert([
            [
                'player_id' => 2,
                'score' => 1500,
                'duration' => 120,
                'played_at' => now()
            ],
            [
                'player_id' => 2,
                'score' => 3200,
                'duration' => 200,
                'played_at' => now()
            ]
        ]);
    }
}
