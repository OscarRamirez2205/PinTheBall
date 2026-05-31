<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ball extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'subname',
        'texture_slug',
        'texture_asset_prefix',
        'price',
        'deal_price',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'deal_price' => 'integer',
        ];
    }

    // 🔗 Una bola puede pertenecer a muchos usuarios
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_ball', 'ball_id', 'users_id');
    }
}
