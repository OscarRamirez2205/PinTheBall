<?php

use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('admin.dashboard')->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('home');
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/players', [AdminDashboardController::class, 'players'])->name('players');
    Route::get('/players/{user}/edit', [AdminDashboardController::class, 'editPlayer'])->name('players.edit');
    Route::put('/players/{user}', [AdminDashboardController::class, 'updatePlayer'])->name('players.update');
    Route::delete('/players/{user}', [AdminDashboardController::class, 'destroyPlayer'])->name('players.destroy');
    Route::get('/balls', [AdminDashboardController::class, 'balls'])->name('balls');
    Route::get('/balls/create', [AdminDashboardController::class, 'createBall'])->name('balls.create');
    Route::post('/balls', [AdminDashboardController::class, 'storeBall'])->name('balls.store');
    Route::get('/balls/{ball}/edit', [AdminDashboardController::class, 'editBall'])->name('balls.edit');
    Route::put('/balls/{ball}', [AdminDashboardController::class, 'updateBall'])->name('balls.update');
    Route::delete('/balls/{ball}', [AdminDashboardController::class, 'destroyBall'])->name('balls.destroy');
    Route::get('/games', [AdminDashboardController::class, 'games'])->name('games');
    Route::delete('/games/{game}', [AdminDashboardController::class, 'destroyGame'])->name('games.destroy');
    Route::post('/logout', [AdminDashboardController::class, 'logout'])->name('logout');
});
