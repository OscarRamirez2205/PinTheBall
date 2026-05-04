import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_URL } from '../config/api-url';
import { AuthService } from '../services/auth.service';
import { SelectedBallService } from '../services/selected-ball.service';
import { ballPreviewGradient } from '../shared/ball-preview';
import {currentPlayStreak, gamesToDaySet, lastNDaysPlayFlags, longestPlayStreak,} from './profile.logic';/** Stats del usuario */

export interface ProfileUser {
  id: number;
  name: string | null;
  email: string;
  role: string;
  wallet?: number;
  available_at?: number;
  created_at?: number;
}

export interface GameDto {
  id: number;
  player_id: number;
  score: number;
  duration: number;
  played_at: string;
}

export interface ApiBall {
  id: number;
  name: string;
  subname: string | null;
  price: number;
  deal_price?: number | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})

export class Profile {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly selectedBallSvc = inject(SelectedBallService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly reminderNote = signal<string | null>(null);

  readonly user = signal<ProfileUser | null>(null);
  readonly games = signal<GameDto[]>([]);
  readonly balls = signal<ApiBall[]>([]);

  readonly selectedBallId = computed(() => this.selectedBallSvc.selectedBallId());

  readonly partidasJugadas = computed(() => this.games().length);

  readonly puntuacionMedia = computed(() => {
    const partidas = this.games();
    if (partidas.length === 0) return null;
    const suma = partidas.reduce((acum, p) => acum + p.score, 0);
    return Math.round((suma / partidas.length) * 10) / 10;
  });

  readonly rachaActual = computed(() => currentPlayStreak(gamesToDaySet(this.games())));

  readonly mayorRacha = computed(() => longestPlayStreak(gamesToDaySet(this.games())));

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const sesion = this.auth.getUser();
    if (!sesion) {
      this.loading.set(false);
      void this.router.navigate(['/login']);
      return;
    }
    this.user.set(sesion as ProfileUser);

    forkJoin({
      profile: this.http.get<ProfileUser>(`${API_URL}/users/${sesion.id}`),
      games: this.http.get<GameDto[]>(`${API_URL}/games/user/${sesion.id}`),
      balls: this.http.get<ApiBall[]>(`${API_URL}/users/${sesion.id}/balls`),
    }).subscribe({
      next: ({ profile: perfil, games: partidas, balls: bolas }) => {
        this.auth.setUser(perfil);
        this.user.set(perfil);
        this.games.set(partidas);
        this.balls.set(bolas);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No se pudieron cargar los datos del perfil.');
        this.loading.set(false);
      },
    });
  }

  gradientFor(ballId: number): string {
    return ballPreviewGradient(ballId);
  }

  selectBall(id: number): void {
    this.selectedBallSvc.selectBall(id);
  }

  onReminder(): void {
    this.reminderNote.set('Aun no funciono crack, espabila que no llegas');
    setTimeout(() => this.reminderNote.set(null), 5000);
  }
}
