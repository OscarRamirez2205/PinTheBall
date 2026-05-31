<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminDashboard
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->cookie('ptb_admin_token');
        $accessToken = is_string($plainToken) ? PersonalAccessToken::findToken($plainToken) : null;
        $user = $accessToken?->tokenable;

        if (! $user instanceof User || $user->role !== 'admin') {
            abort(403, 'Solo los administradores pueden acceder al dashboard.');
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
