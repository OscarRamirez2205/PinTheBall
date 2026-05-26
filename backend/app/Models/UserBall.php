<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBall extends Model
{
    use HasFactory;

    protected $table = 'user_ball';

    protected $fillable = [
        'users_id',
        'ball_id'
    ];
}