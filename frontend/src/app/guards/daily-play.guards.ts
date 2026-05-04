import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DailyPlayLockService } from '../services/daily-play-lock.service';

/** Si ya jugaste hoy, no mostrar el juego: ir al leaderboard. */
export const redirectToLeaderboardIfDailyDoneGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true;

  const lock = inject(DailyPlayLockService);
  const router = inject(Router);
  if (lock.hasCompletedDailyToday()) {
    return router.parseUrl('/leaderboard');
  }
  return true;
};

/** Leaderboard solo tras completar la diaria; si no aplica, volver al juego. */
export const redirectToGameIfDailyNotDoneGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true;

  const lock = inject(DailyPlayLockService);
  const router = inject(Router);
  if (!lock.hasCompletedDailyToday()) {
    return router.parseUrl('/game');
  }
  return true;
};
