import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { DailyPlayLockService } from '../services/daily-play-lock.service';
import { formatCountdownHms, msUntilLocalMidnight } from '../shared/local-midnight';
import {
  buildTopNPlusOverflow,
  mockPoolYouAtRank,
  type LeaderboardListItem,
} from './leaderboard.logic';
import { formatWeekRangeEs, startOfWeekMondayLocal } from './leaderboard-week';

/** Demo: tu posición simulada en el ranking semanal (top 10 + overflow). */
const DEMO_WEEKLY_USER_RANK = 546;
/** Demo: tu posición en el ranking general. */
const DEMO_GENERAL_USER_RANK = 120;

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss',
})
export class Leaderboard {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly dailyLock = inject(DailyPlayLockService);

  readonly countdown = signal('--:--:--');

  /** Semana natural local: lunes → domingo (solo texto; datos demo). */
  readonly weekRangeLabel = signal(formatWeekRangeEs(startOfWeekMondayLocal()));

  readonly weeklyItems: LeaderboardListItem[] = buildTopNPlusOverflow(
    mockPoolYouAtRank(DEMO_WEEKLY_USER_RANK, 'Sem'),
    10,
  );

  readonly generalItems: LeaderboardListItem[] = buildTopNPlusOverflow(
    mockPoolYouAtRank(DEMO_GENERAL_USER_RANK, 'Arc'),
    10,
  );

  constructor() {
    const tick = () => {
      if (!this.dailyLock.hasCompletedDailyToday()) {
        void this.router.navigate(['/game']);
        return;
      }
      this.countdown.set(formatCountdownHms(msUntilLocalMidnight()));
      this.weekRangeLabel.set(formatWeekRangeEs(startOfWeekMondayLocal()));
    };
    tick();
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tick);
  }

  trackWeekly(i: number, item: LeaderboardListItem): string {
    return item.kind === 'gap' ? `w-gap-${i}` : `w-${item.row.rank}-${item.row.score}`;
  }

  trackGeneral(i: number, item: LeaderboardListItem): string {
    return item.kind === 'gap' ? `g-gap-${i}` : `g-${item.row.rank}-${item.row.score}`;
  }
}
