import { isPlatformBrowser } from '@angular/common';
import { Component, computed, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { interval } from 'rxjs';
import { Router } from '@angular/router';
import { BallCard } from './ball-card/ball-card';
import { formatCountdownHms, msUntilLocalMidnight } from '../shared/local-midnight';
import type { ShopSkin } from './shop-skin.model';
import { ShopWalletService } from './shop-wallet.service';
import { API_URL } from '../config/api-url';
import { AuthService, type AuthUser } from '../services/auth.service';
import { ballPreviewGradient } from '../shared/ball-preview';
import { fallbackDealPrice, featuredBallId } from './shop-featured';

interface ApiBallRow {
  id: number;
  name: string;
  subname: string | null;
  price: number;
  deal_price?: number | null;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [BallCard],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class Shop {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly wallet = inject(ShopWalletService);

  readonly apiBalls = signal<ApiBallRow[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly countdown = signal('--:--:--');
  readonly toast = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  readonly catalog = computed<ShopSkin[]>(() =>
    this.apiBalls().map((b) => ({
      id: String(b.id),
      name: b.name,
      price: b.price,
      preview: ballPreviewGradient(b.id),
    })),
  );

  readonly sortedBallIds = computed(() =>
    [...this.apiBalls()]
      .sort((a, b) => a.id - b.id)
      .map((b) => b.id),
  );

  readonly dailyFeaturedId = computed(() => featuredBallId(this.sortedBallIds()));

  readonly dailySkin = computed(() => {
    const id = this.dailyFeaturedId();
    if (id === null) return null;
    return this.catalog().find((s) => Number(s.id) === id) ?? null;
  });

  readonly dailyDealPrice = computed(() => {
    const id = this.dailyFeaturedId();
    if (id === null) return undefined;
    const ball = this.apiBalls().find((b) => b.id === id);
    if (!ball) return undefined;
    if (ball.deal_price != null && ball.deal_price < ball.price) {
      return ball.deal_price;
    }
    if (ball.price > 0) {
      return fallbackDealPrice(ball.price);
    }
    return undefined;
  });

  constructor() {
    const tick = () => this.countdown.set(formatCountdownHms(msUntilLocalMidnight()));
    tick();
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tick);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const session = this.auth.getUser();
    if (!session) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/shop' } });
      return;
    }

    forkJoin({
      balls: this.http.get<ApiBallRow[]>(`${API_URL}/balls`),
      owned: this.http.get<ApiBallRow[]>(`${API_URL}/users/${session.id}/balls`),
      profile: this.http.get<AuthUser>(`${API_URL}/users/${session.id}`),
    }).subscribe({
      next: ({ balls, owned, profile }) => {
        this.auth.setUser(profile);
        this.apiBalls.set([...balls].sort((a, b) => a.id - b.id));
        const ownedIds = owned.map((b) => b.id);
        this.wallet.hydrate(profile.wallet ?? 0, ownedIds);
      },
      error: () => {
        this.loadError.set('No se pudo cargar la tienda. Comprueba la API.');
      },
    });
  }

  owned(skinId: string): boolean {
    return this.wallet.isOwnedSkinId(skinId);
  }

  dealPriceFor(skin: ShopSkin): number | undefined {
    if (Number(skin.id) !== this.dailyFeaturedId()) {
      return undefined;
    }
    return this.dailyDealPrice();
  }

  onPurchase(event: { skin: ShopSkin; price: number }): void {
    const ballId = Number(event.skin.id);
    if (Number.isNaN(ballId)) {
      this.flash('err', 'Identificador de bola no válido.');
      return;
    }
    if (this.wallet.isOwnedSkinId(event.skin.id)) {
      this.flash('err', 'Ya tienes esta skin.');
      return;
    }
    const displayPrice = event.price;
    if (displayPrice > 0 && this.wallet.coins() < displayPrice) {
      this.flash('err', 'No tienes suficientes monedas.');
      return;
    }

    this.http
      .post<{ message: string; user: AuthUser }>(`${API_URL}/users/buy-ball`, { ball_id: ballId })
      .subscribe({
        next: (res) => {
          this.auth.setUser(res.user);
          this.wallet.applyServerPurchase(res.user.wallet ?? 0, ballId);
          this.flash('ok', res.message || `¡${event.skin.name} desbloqueada!`);
        },
        error: (err: { error?: { message?: string } }) => {
          const msg = err?.error?.message;
          this.flash('err', typeof msg === 'string' ? msg : 'No se pudo completar la compra.');
        },
      });
  }

  private flash(kind: 'ok' | 'err', text: string): void {
    this.toast.set({ kind, text });
    setTimeout(() => this.toast.set(null), 3200);
  }
}
