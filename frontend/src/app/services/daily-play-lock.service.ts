import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { localDateKey } from '../shared/local-midnight';

const STORAGE_KEY = 'pinball_daily_completed_local_date';

/** Una partida al día (clave en localStorage por fecha local). */
@Injectable({ providedIn: 'root' })
export class DailyPlayLockService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Marca que la partida diaria de hoy ya está hecha (medianoche local reinicia el día). */
  markDailyCompleted(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, localDateKey(new Date()));
  }

  hasCompletedDailyToday(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const fechaGuardada = localStorage.getItem(STORAGE_KEY);
    return fechaGuardada !== null && fechaGuardada === localDateKey(new Date());
  }
}
