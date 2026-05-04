<?php

// database/seeders/BallsSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BallsSeeder extends Seeder {
    public function run(): void {
        DB::table('balls')->insert([
            [
                'name' => 'Steel Ball',
                'subname' => 'Classic',
                'price' => 250,
                'deal_price' => 100,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Fire Ball',
                'subname' => 'Flaming Edition',
                'price' => 400,
                'deal_price' => 150,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Neon Ball',
                'subname' => 'Cyber Style',
                'price' => 350,
                'deal_price' => 120,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
