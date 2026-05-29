<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_id',
        'guest_name',
        'score',
        'duration',
        'played_at',
    ];

    protected function casts(): array
    {
        return [
            'played_at' => 'datetime',
        ];
    }

    // 🔗 Una partida pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class, 'player_id');
    }
}