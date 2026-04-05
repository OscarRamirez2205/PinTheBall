<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // 🔗 Un usuario tiene muchas partidas
    public function games()
    {
        return $this->hasMany(Game::class, 'player_id');
    }

    // 🔗 Un usuario puede tener muchas bolas (N:M)
    public function balls()
    {
        return $this->belongsToMany(Ball::class, 'user_balls');
    }
}