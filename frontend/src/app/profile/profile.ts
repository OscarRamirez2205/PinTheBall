import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_URL } from '../config/api-url';
import { AuthService } from '../services/auth.service';
import { SelectedBallService } from '../services/selected-ball.service';
import { ballPreviewGradient } from '../shared/ball-preview';
import {
  currentPlayStreak,
  gamesToDaySet,
  lastNDaysPlayFlags,
  longestPlayStreak,
} from './profile.logic';
/** Usuario mostrado en perfil (campos extra de `GET /users/:id`). */
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

  /** Exponer selección en el componente para que el template reaccione al signal del servicio. */
  readonly selectedBallId = computed(() => this.selectedBallSvc.selectedBallId());

  readonly partidasJugadas = computed(() => this.games().length);

  readonly puntuacionMedia = computed(() => {
    const g = this.games();
    if (g.length === 0) return null;
    const sum = g.reduce((a, x) => a + x.score, 0);
    return Math.round((sum / g.length) * 10) / 10;
  });

  readonly rachaActual = computed(() => currentPlayStreak(gamesToDaySet(this.games())));

  readonly mayorRacha = computed(() => longestPlayStreak(gamesToDaySet(this.games())));

  readonly calendarFlags = computed(() => lastNDaysPlayFlags(gamesToDaySet(this.games()), 21));

  readonly initials = computed(() => {
    const n = this.user()?.name?.trim() || this.user()?.email || '?';
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    const single = parts[0] ?? n;
    if (/^[A-Za-z]{3}$/.test(single)) {
      return single.toUpperCase();
    }
    return single.slice(0, 2).toUpperCase();
  });

  constructor() {
    const session = this.auth.getUser();
    if (!session) {
      this.loading.set(false);
      void this.router.navigate(['/login']);
      return;
    }
    this.user.set(session as ProfileUser);

    forkJoin({
      profile: this.http.get<ProfileUser>(`${API_URL}/users/${session.id}`),
      games: this.http.get<GameDto[]>(`${API_URL}/games/user/${session.id}`),
      balls: this.http.get<ApiBall[]>(`${API_URL}/users/${session.id}/balls`),
    }).subscribe({
      next: ({ profile, games, balls }) => {
        this.auth.setUser(profile);
        this.user.set(profile);
        this.games.set(games);
        this.balls.set(balls);
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
    this.reminderNote.set(
      'Recordatorio por email: función en desarrollo. Podrás activarlo cuando el backend envíe avisos.',
    );
    setTimeout(() => this.reminderNote.set(null), 5000);
  }
}
