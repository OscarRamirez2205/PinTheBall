<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public $timestamps = false;

    protected $fillable = [
        'name',
        'email',
        'password',
        'wallet',
        'role',
        'available_at',
        'created_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'wallet' => 'integer',
            'available_at' => 'integer',
            'created_at' => 'integer',
        ];
    }

    // 🔗 Un usuario tiene muchas partidas
    public function games()
    {
        return $this->hasMany(Game::class, 'player_id');
    }

    // 🔗 Un usuario puede tener muchas bolas (N:M)
    public function balls()
    {
        return $this->belongsToMany(Ball::class, 'user_ball', 'users_id', 'ball_id');
    }

    public function friends()
    {
        return $this->belongsToMany(User::class, 'friends', 'user_id', 'friend_id')
            ->wherePivot('status', 'accepted')
            ->withPivot('status')
            ->select('users.id', 'users.name', 'users.email', 'users.role');
    }
}