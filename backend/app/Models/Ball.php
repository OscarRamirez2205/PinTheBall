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
        'texture_preview_url',
        'texture_albedo_url',
        'texture_normal_url',
        'texture_metallic_url',
        'texture_roughness_url',
        'texture_ambient_occlusion_url',
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
