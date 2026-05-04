import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'ptb_selected_ball_id';

@Injectable({ providedIn: 'root' })
export class SelectedBallService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly id = signal<number | null>(null);
  readonly selectedBallId = this.id.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw === '') {
      return;
    }
    const n = Number(raw);
    if (!Number.isNaN(n)) {
      this.id.set(n);
    }
  }

  selectBall(ballId: number): void {
    this.id.set(ballId);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, String(ballId));
    }
  }
}
