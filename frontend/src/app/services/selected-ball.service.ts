import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { API_URL } from '../config/api-url';
import { apiFetch } from '../shared/api-fetch';
import { AuthService } from './auth.service';
import { CLASSIC_BALL_TEXTURE_SLUG, registerUploadedBallTextures } from '../shared/ball-textures.catalog';

interface OwnedBall {
  id: number;
  texture_slug: string | null;
  texture_asset_prefix?: string | null;
}

const LEGACY_ID_KEY = 'ptb_selected_ball_id';
const LEGACY_SLUG_KEY = 'ptb_selected_ball_texture_slug';

/** Bola activa en partida (perfil/tienda + localStorage por usuario). */
@Injectable({ providedIn: 'root' })
export class SelectedBallService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly id = signal<number | null>(null);
  private readonly textureSlug = signal<string | null>(null);
  private readonly ownedBallIds = signal<Set<number>>(new Set());

  readonly selectedBallId = this.id.asReadonly();
  readonly selectedTextureSlug = this.textureSlug.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.removeLegacyStorageKeys();
    const user = this.auth.getUser();
    if (user?.id) {
      this.loadForUser(user.id);
    }
  }

  selectBall(ballId: number, textureSlug: string): void {
    const userId = this.auth.getUser()?.id;
    if (!userId) {
      return;
    }
    this.id.set(ballId);
    this.textureSlug.set(textureSlug);
    localStorage.setItem(this.storageIdKey(userId), String(ballId));
    localStorage.setItem(this.storageSlugKey(userId), textureSlug);
  }

  /** Tras login/registro: carga selección del usuario y valida con su inventario. */
  async onSessionStarted(userId: number): Promise<void> {
    this.loadForUser(userId);
    await this.refreshOwnedBalls(userId);
  }

  async refreshOwnedBalls(userId: number): Promise<void> {
    try {
      const balls = await apiFetch<OwnedBall[]>(`${API_URL}/users/${userId}/balls`);
      this.syncOwnedBalls(balls);
    } catch {
      this.ownedBallIds.set(new Set());
      this.resetToClassicIfNeeded();
    }
  }

  syncOwnedBalls(balls: OwnedBall[]): void {
    registerUploadedBallTextures(balls);
    this.ownedBallIds.set(new Set(balls.map((b) => b.id)));
    this.validateSelection(balls);
  }

  clearOnLogout(): void {
    this.ownedBallIds.set(new Set());
    this.id.set(null);
    this.textureSlug.set(null);
  }

  /** Slug activo en el juego. Invitados: clásica. Logueados: solo bolas poseídas. */
  activeTextureSlug(): string {
    if (!this.auth.getUser()?.id) {
      return CLASSIC_BALL_TEXTURE_SLUG;
    }
    const selectedId = this.id();
    const slug = this.textureSlug();
    const owned = this.ownedBallIds();
    if (selectedId !== null && slug && owned.has(selectedId)) {
      return slug;
    }
    return CLASSIC_BALL_TEXTURE_SLUG;
  }

  private loadForUser(userId: number): void {
    const rawId = localStorage.getItem(this.storageIdKey(userId));
    if (rawId !== null && rawId !== '') {
      const n = Number(rawId);
      if (!Number.isNaN(n)) {
        this.id.set(n);
      }
    } else {
      this.id.set(null);
    }
    const rawSlug = localStorage.getItem(this.storageSlugKey(userId));
    this.textureSlug.set(rawSlug ?? null);
  }

  private validateSelection(balls: OwnedBall[]): void {
    const selectedId = this.id();
    if (selectedId !== null && balls.some((b) => b.id === selectedId)) {
      const match = balls.find((b) => b.id === selectedId);
      if (match?.texture_slug) {
        this.selectBall(match.id, match.texture_slug);
      }
      return;
    }
    this.resetToClassicFromOwned(balls);
  }

  private resetToClassicIfNeeded(): void {
    const selectedId = this.id();
    if (selectedId === null) {
      this.textureSlug.set(CLASSIC_BALL_TEXTURE_SLUG);
      return;
    }
    this.id.set(null);
    this.textureSlug.set(CLASSIC_BALL_TEXTURE_SLUG);
  }

  private resetToClassicFromOwned(balls: OwnedBall[]): void {
    const classic = balls.find((b) => b.texture_slug === CLASSIC_BALL_TEXTURE_SLUG);
    if (classic?.texture_slug) {
      this.selectBall(classic.id, classic.texture_slug);
      return;
    }
    const first = balls[0];
    if (first?.texture_slug) {
      this.selectBall(first.id, first.texture_slug);
      return;
    }
    this.resetToClassicIfNeeded();
  }

  private storageIdKey(userId: number): string {
    return `ptb_selected_ball_${userId}_id`;
  }

  private storageSlugKey(userId: number): string {
    return `ptb_selected_ball_${userId}_slug`;
  }

  private removeLegacyStorageKeys(): void {
    localStorage.removeItem(LEGACY_ID_KEY);
    localStorage.removeItem(LEGACY_SLUG_KEY);
  }
}
