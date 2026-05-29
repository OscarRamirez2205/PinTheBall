<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BallsSeeder extends Seeder {
    public function run(): void {
        DB::table('user_ball')->delete();
        DB::table('balls')->delete();

        $now = now();

        DB::table('balls')->insert([
            [
                'name' => 'Brick Ball',
                'subname' => 'Reclaimed Wall',
                'texture_slug' => 'brickwallreclaimed',
                'price' => 280,
                'deal_price' => 110,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Grass Ball',
                'subname' => 'Patchy Ground',
                'texture_slug' => 'grasspatchyground',
                'price' => 220,
                'deal_price' => 90,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Gold Ball',
                'subname' => 'Painted Metal',
                'texture_slug' => 'metalgoldpaint',
                'price' => 450,
                'deal_price' => 180,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Steel Ball',
                'subname' => 'Brushed Metal',
                'texture_slug' => 'metalsteelbrushed',
                'price' => 0,
                'deal_price' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Rattan Ball',
                'subname' => 'Woven',
                'texture_slug' => 'rattanweave',
                'price' => 320,
                'deal_price' => 130,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Stone Ball',
                'subname' => 'Quartzite',
                'texture_slug' => 'stonequartzite',
                'price' => 360,
                'deal_price' => 140,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Oak Ball',
                'subname' => 'Wood Veneer',
                'texture_slug' => 'woodvenneroak',
                'price' => 300,
                'deal_price' => 120,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $steelBallId = DB::table('balls')->where('texture_slug', 'metalsteelbrushed')->value('id');
        if ($steelBallId !== null) {
            DB::table('user_ball')->insert([
                'users_id' => 2,
                'ball_id' => $steelBallId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
