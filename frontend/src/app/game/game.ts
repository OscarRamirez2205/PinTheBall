import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DailyPlayLockService } from '../services/daily-play-lock.service';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game {
  private readonly router = inject(Router);
  private readonly dailyLock = inject(DailyPlayLockService);

  /**
   * Funcion para llamarla al acabar la partida para que haga uso del servicio de bloqueo de partida diaria
   */
  finishDailyRun(): void {
    this.dailyLock.markDailyCompleted();
    void this.router.navigate(['/leaderboard']);
  }
}
