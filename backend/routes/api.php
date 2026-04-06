<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BallController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/games/ranking', [GameController::class, 'ranking']);
    Route::get('/games/user/{id}', [GameController::class, 'userGames']);
    Route::apiResource('games', GameController::class);

    Route::apiResource('balls', BallController::class);

    Route::get('/users/{user}/balls', [UserController::class, 'userBalls']);
    Route::post('/users/buy-ball', [UserController::class, 'buyBall']);
    Route::apiResource('users', UserController::class);
//});
