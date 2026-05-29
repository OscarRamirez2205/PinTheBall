<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BallController;
use App\Http\Controllers\Api\FriendController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/users/buy-ball', [UserController::class, 'buyBall']);
    Route::get('/friends', [FriendController::class, 'index']);
    Route::post('/friends', [FriendController::class, 'store']);
    Route::get('/friends/notifications', [FriendController::class, 'notifications']);
    Route::post('/friends/{friend}/respond', [FriendController::class, 'respond']);
    Route::delete('/friends/{friend}', [FriendController::class, 'destroy']);
    Route::get('/friends/leaderboard', [FriendController::class, 'leaderboard']);
});

Route::get('/games/ranking', [GameController::class, 'ranking']);
Route::get('/games/ranking/weekly', [GameController::class, 'weeklyRanking']);
Route::get('/games/user/{id}', [GameController::class, 'userGames']);
Route::apiResource('games', GameController::class);

Route::apiResource('balls', BallController::class);

Route::get('/users/{user}/balls', [UserController::class, 'userBalls']);
Route::apiResource('users', UserController::class);
