<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ball extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'subname'
    ];

    // 🔗 Una bola puede pertenecer a muchos usuarios
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_balls');
    }
}
