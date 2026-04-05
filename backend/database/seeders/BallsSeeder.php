<?php

// database/seeders/BallsSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BallsSeeder extends Seeder {
    public function run(): void {
        DB::table('balls')->insert([
            ['name' => 'Steel Ball', 'subname' => 'Classic'],
            ['name' => 'Fire Ball', 'subname' => 'Flaming Edition'],
            ['name' => 'Neon Ball', 'subname' => 'Cyber Style'],
        ]);
    }
}
