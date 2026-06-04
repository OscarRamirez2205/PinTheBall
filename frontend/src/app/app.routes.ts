import { Routes } from '@angular/router';
import {
  redirectToGameIfDailyNotDoneGuard,
  redirectToLeaderboardIfDailyDoneGuard,
} from './guards/daily-play.guards';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Layout con navbar: inicio, perfil, tienda, leaderboard
  {
    path: '',
    loadComponent: () => import('./shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        loadComponent: () => import('./homepage/homepage').then((m) => m.Homepage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then((m) => m.Profile),
      },
      {
        path: 'shop',
        canActivate: [authGuard],
        loadComponent: () => import('./shop/shop').then((m) => m.Shop),
      },
      {
        path: 'leaderboard',
        canActivate: [redirectToGameIfDailyNotDoneGuard],
        loadComponent: () => import('./leaderboard/leaderboard').then((m) => m.Leaderboard),
      },
    ],
  },
  // Auth y cierre (fuera del shell)
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.Register),
  },
  {
    path: 'logout',
    loadComponent: () => import('./logout/logout').then((m) => m.Logout),
  },
  // Partida a pantalla completa (sin navbar)
  {
    path: 'game',
    canActivate: [redirectToLeaderboardIfDailyDoneGuard],
    loadComponent: () => import('./game/game').then((m) => m.Game),
  },
];
