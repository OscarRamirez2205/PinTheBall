import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DailyPlayLockService } from '../services/daily-play-lock.service';

/** Si se jugo ya una partida hoy, redirigir al leaderboard.(Si se jugo partida sin logearse y luego se logea tiene que esperar hasta mañana tambien) */
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

/** Si quiere acceder a la leaderboard, sin jugar la partida diaria, redirigir al juego */
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
