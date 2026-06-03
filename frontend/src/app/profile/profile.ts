import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { API_URL } from '../config/api-url';
import { AuthService } from '../services/auth.service';
import { SelectedBallService } from '../services/selected-ball.service';
import { ballPreviewImage } from '../shared/ball-preview';
import { registerUploadedBallTextures } from '../shared/ball-textures.catalog';
import {currentPlayStreak, gamesToDaySet, lastNDaysPlayFlags, longestPlayStreak,} from './profile.logic';/** Stats del usuario */
import { apiFetch } from '../shared/api-fetch';

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
  texture_slug: string | null;
  texture_asset_prefix?: string | null;
  price: number;
  deal_price?: number | null;
}

interface FriendLeaderboardEntry {
  id: number;
  name: string;
  email: string;
  best_score: number;
  is_current_user: boolean;
}

interface FriendNotification {
  from_user_id: number;
  from_user_name: string | null;
  from_user_email: string;
  created_at: string | null;
}

const INVENTORY_VISIBLE_SLOTS = 10;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})

export class Profile {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly selectedBallSvc = inject(SelectedBallService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly reminderNote = signal<string | null>(null);
  readonly friendInputError = signal<string | null>(null);
  readonly friendNotificationsError = signal<string | null>(null);
  readonly respondingNotificationId = signal<number | null>(null);

  readonly user = signal<ProfileUser | null>(null);
  readonly games = signal<GameDto[]>([]);
  readonly balls = signal<ApiBall[]>([]);
  readonly friendLeaderboard = signal<FriendLeaderboardEntry[]>([]);
  readonly friendNotifications = signal<FriendNotification[]>([]);

  readonly selectedBallId = computed(() => this.selectedBallSvc.selectedBallId());
  readonly inventoryEmptySlots = computed(() =>
    Array.from({ length: Math.max(0, INVENTORY_VISIBLE_SLOTS - this.balls().length) }, (_, index) => index),
  );

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
    void this.loadProfileData(sesion.id);
  }

  previewFor(ball: ApiBall): string {
    return ballPreviewImage(ball.texture_slug);
  }

  selectBall(ball: ApiBall): void {
    if (!ball.texture_slug) {
      return;
    }
    this.selectedBallSvc.selectBall(ball.id, ball.texture_slug);
  }

  onReminder(): void {
    this.reminderNote.set('Aun no funciono crack, espabila que no llegas');
    setTimeout(() => this.reminderNote.set(null), 5000);
  }

  addFriend(friendEmail: string): void {
    const normalized = friendEmail.trim().toLocaleLowerCase();
    if (!normalized) {
      this.friendInputError.set('Introduce un email para anadir un amigo.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized)) {
      this.friendInputError.set('Introduce un email valido.');
      return;
    }

    this.friendInputError.set(null);

    void this.addFriendByEmail(normalized);
  }

  trackFriend(index: number, friend: FriendLeaderboardEntry): string {
    return `${friend.id}-${friend.best_score}-${index}`;
  }

  trackNotification(index: number, notification: FriendNotification): string {
    return `${notification.from_user_id}-${notification.created_at ?? index}`;
  }

  acceptFriendRequest(notification: FriendNotification): void {
    void this.respondToFriendRequest(notification.from_user_id, 'accepted');
  }

  rejectFriendRequest(notification: FriendNotification): void {
    void this.respondToFriendRequest(notification.from_user_id, 'rejected');
  }

  private async loadProfileData(userId: number): Promise<void> {
    try {
      const [perfil, partidas, bolas] = await Promise.all([
        apiFetch<ProfileUser>(`${API_URL}/users/${userId}`),
        apiFetch<GameDto[]>(`${API_URL}/games/user/${userId}`),
        apiFetch<ApiBall[]>(`${API_URL}/users/${userId}/balls`),
      ]);
      registerUploadedBallTextures(bolas);
      this.auth.setUser(perfil);
      this.user.set(perfil);
      this.games.set(partidas);
      this.balls.set(bolas);
      this.selectedBallSvc.syncOwnedBalls(bolas);
      this.loading.set(false);
      await Promise.all([this.loadFriendLeaderboard(), this.loadFriendNotifications()]);
    } catch {
      this.loadError.set('No se pudieron cargar los datos del perfil.');
      this.loading.set(false);
    }
  }

  private async addFriendByEmail(email: string): Promise<void> {
    try {
      await apiFetch<{ message: string }>(`${API_URL}/friends`, {
        method: 'POST',
        body: JSON.stringify({ friend_email: email }),
      });
      await Promise.all([this.loadFriendLeaderboard(), this.loadFriendNotifications()]);
    } catch (error) {
      const errorHttp = error as { error?: { message?: string } };
      const message = errorHttp?.error?.message;
      this.friendInputError.set(
        typeof message === 'string' ? message : 'No se pudo anadir al amigo con ese email.',
      );
    }
  }

  private async loadFriendLeaderboard(): Promise<void> {
    try {
      const rows = await apiFetch<FriendLeaderboardEntry[]>(`${API_URL}/friends/leaderboard`);
      this.friendLeaderboard.set(rows);
    } catch {
      this.friendLeaderboard.set([]);
    }
  }

  private async loadFriendNotifications(): Promise<void> {
    try {
      this.friendNotificationsError.set(null);
      const rows = await apiFetch<FriendNotification[]>(`${API_URL}/friends/notifications`);
      this.friendNotifications.set(rows);
    } catch {
      this.friendNotifications.set([]);
      this.friendNotificationsError.set('No se pudieron cargar las notificaciones de amistad.');
    }
  }

  private async respondToFriendRequest(
    friendUserId: number,
    status: 'accepted' | 'rejected',
  ): Promise<void> {
    this.respondingNotificationId.set(friendUserId);
    this.friendNotificationsError.set(null);
    try {
      await apiFetch<{ message: string }>(`${API_URL}/friends/${friendUserId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      await Promise.all([this.loadFriendLeaderboard(), this.loadFriendNotifications()]);
    } catch (error) {
      const errorHttp = error as { error?: { message?: string } };
      const message = errorHttp?.error?.message;
      this.friendNotificationsError.set(
        typeof message === 'string' ? message : 'No se pudo responder a la solicitud.',
      );
    } finally {
      this.respondingNotificationId.set(null);
    }
  }
}
