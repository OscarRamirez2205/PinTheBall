import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { DailyPlayLockService } from '../services/daily-play-lock.service';
import { AuthService } from '../services/auth.service';
import { API_URL } from '../config/api-url';
import { apiFetch } from '../shared/api-fetch';
import { formatCountdownHms, msUntilLocalMidnight } from '../shared/local-midnight';
import {
  assignRanks,
  buildTopNPlusOverflow,
  type LeaderboardRow,
  type LeaderboardListItem,
} from './leaderboard.logic';
import { formatWeekRangeEs, startOfWeekMondayLocal } from './leaderboard-week';

interface ApiRankingRow {
  player_id: number | null;
  player_name: string;
  best_score: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss',
})
/** Clasificación semanal y general (top 10 + tu fila si quedas fuera). */
export class Leaderboard {
  private readonly router = inject(Router);
  private readonly dailyLock = inject(DailyPlayLockService);
  private readonly auth = inject(AuthService);
  private readonly clockTick = toSignal(interval(1000), { initialValue: 0 });
  readonly loadError = signal<string | null>(null);
  readonly weeklyItems = signal<LeaderboardListItem[]>([]);
  readonly generalItems = signal<LeaderboardListItem[]>([]);

  readonly countdown = computed(() => {
    this.clockTick();
    return formatCountdownHms(msUntilLocalMidnight());
  });
  readonly weekRangeLabel = computed(() => {
    this.clockTick();
    return formatWeekRangeEs(startOfWeekMondayLocal());
  });

  constructor() {
    // Solo tras la partida diaria de hoy
    effect(() => {
      this.clockTick();
      if (!this.dailyLock.hasCompletedDailyToday()) {
        void this.router.navigate(['/game']);
      }
    });
    void this.loadLeaderboards();
  }

  trackWeekly(indice: number, item: LeaderboardListItem): string {
    return item.kind === 'gap' ? `w-gap-${indice}` : `w-${item.row.rank}-${item.row.score}`;
  }

  trackGeneral(indice: number, item: LeaderboardListItem): string {
    return item.kind === 'gap' ? `g-gap-${indice}` : `g-${item.row.rank}-${item.row.score}`;
  }

  // Ranking semanal y global en paralelo
  private async loadLeaderboards(): Promise<void> {
    try {
      const [weeklyRows, generalRows] = await Promise.all([
        apiFetch<ApiRankingRow[]>(`${API_URL}/games/ranking/weekly`),
        apiFetch<ApiRankingRow[]>(`${API_URL}/games/ranking`),
      ]);
      this.weeklyItems.set(this.toTopItems(weeklyRows));
      this.generalItems.set(this.toTopItems(generalRows));
      this.loadError.set(null);
    } catch {
      this.weeklyItems.set([]);
      this.generalItems.set([]);
      this.loadError.set('No se pudo cargar la clasificación.');
    }
  }

  // Marca la fila del usuario logueado y aplica top 10 + overflow
  private toTopItems(rows: ApiRankingRow[]): LeaderboardListItem[] {
    const currentUserId = this.auth.getUser()?.id ?? null;
    const mapped: LeaderboardRow[] = rows.map((row) => ({
      rank: 0,
      playerName: row.player_name,
      score: row.best_score,
      isYou: currentUserId !== null && row.player_id === currentUserId,
    }));
    return buildTopNPlusOverflow(assignRanks(mapped), 10);
  }
}
