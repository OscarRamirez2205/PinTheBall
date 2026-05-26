import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { apiFetch } from '../shared/api-fetch';

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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly clockTick = toSignal(interval(1000), { initialValue: 0 });
  readonly wallet = inject(ShopWalletService);

  readonly apiBalls = signal<ApiBallRow[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly countdown = computed(() => {
    this.clockTick();
    return formatCountdownHms(msUntilLocalMidnight());
  });
  readonly toast = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  readonly catalog = computed<ShopSkin[]>(() =>
    this.apiBalls().map((fila) => ({
      id: String(fila.id),
      name: fila.name,
      price: fila.price,
      preview: ballPreviewGradient(fila.id),
    })),
  );

  readonly sortedBallIds = computed(() =>
    [...this.apiBalls()]
      .sort((bolaA, bolaB) => bolaA.id - bolaB.id)
      .map((bola) => bola.id),
  );

  readonly dailyFeaturedId = computed(() => featuredBallId(this.sortedBallIds()));

  readonly dailySkin = computed(() => {
    const id = this.dailyFeaturedId();
    if (id === null) return null;
    return this.catalog().find((entrada) => Number(entrada.id) === id) ?? null;
  });

  readonly dailyDealPrice = computed(() => {
    const id = this.dailyFeaturedId();
    if (id === null) return undefined;
    const bola = this.apiBalls().find((b) => b.id === id);
    if (!bola) return undefined;
    if (bola.deal_price != null && bola.deal_price < bola.price) {
      return bola.deal_price;
    }
    if (bola.price > 0) {
      return fallbackDealPrice(bola.price);
    }
    return undefined;
  });

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const sesion = this.auth.getUser();
    if (!sesion) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/shop' } });
      return;
    }

    void this.loadShopData(sesion.id);
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

    void this.purchaseSkin(ballId, event.skin.name);
  }

  private flash(tipo: 'ok' | 'err', texto: string): void {
    this.toast.set({ kind: tipo, text: texto });
    setTimeout(() => this.toast.set(null), 3200);
  }

  private async loadShopData(userId: number): Promise<void> {
    try {
      const [bolasApi, poseidas, perfil] = await Promise.all([
        apiFetch<ApiBallRow[]>(`${API_URL}/balls`),
        apiFetch<ApiBallRow[]>(`${API_URL}/users/${userId}/balls`),
        apiFetch<AuthUser>(`${API_URL}/users/${userId}`),
      ]);
      this.auth.setUser(perfil);
      this.apiBalls.set([...bolasApi].sort((bolaA, bolaB) => bolaA.id - bolaB.id));
      const idsPoseidos = poseidas.map((bola) => bola.id);
      this.wallet.hydrate(perfil.wallet ?? 0, idsPoseidos);
    } catch {
      this.loadError.set('No se pudo cargar la tienda. Comprueba la API.');
    }
  }

  private async purchaseSkin(ballId: number, skinName: string): Promise<void> {
    try {
      const res = await apiFetch<{ message: string; user: AuthUser }>(`${API_URL}/users/buy-ball`, {
        method: 'POST',
        body: JSON.stringify({ ball_id: ballId }),
      });
      this.auth.setUser(res.user);
      this.wallet.applyServerPurchase(res.user.wallet ?? 0, ballId);
      this.flash('ok', res.message || `¡${skinName} desbloqueada!`);
    } catch (error) {
      const errorHttp = error as { error?: { message?: string } };
      const texto = errorHttp?.error?.message;
      this.flash('err', typeof texto === 'string' ? texto : 'No se pudo completar la compra.');
    }
  }
}
