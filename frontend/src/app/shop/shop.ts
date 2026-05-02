import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { BallCard } from './ball-card/ball-card';
import { DAILY_DEAL_SKIN_ID, discountedDailyPrice, SHOP_CATALOG } from './shop-catalog';
import type { ShopSkin } from './shop-skin.model';
import { ShopWalletService } from './shop-wallet.service';

function msUntilLocalMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

function formatHms(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
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
  readonly wallet = inject(ShopWalletService);

  readonly catalog = SHOP_CATALOG;

  readonly dailySkin = computed(() => {
    const skin = SHOP_CATALOG.find((item) => item.id === DAILY_DEAL_SKIN_ID);
    return skin ?? SHOP_CATALOG[0];
  });

  readonly dailyDealPrice = computed(() => discountedDailyPrice(this.dailySkin()));

  readonly countdown = signal('--:--:--');

  readonly toast = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);

  constructor() {
    const tick = () => this.countdown.set(formatHms(msUntilLocalMidnight()));
    tick();
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tick);
  }

  owned(skinId: string): boolean {
    return this.wallet.isOwned(skinId);
  }

  dealPriceFor(skin: ShopSkin): number | undefined {
    return skin.id === DAILY_DEAL_SKIN_ID ? this.dailyDealPrice() : undefined;
  }

  onPurchase(event: { skin: ShopSkin; price: number }): void {
    const { skin, price } = event;
    if (this.wallet.isOwned(skin.id)) {
      this.flash('err', 'Ya tienes esta skin.');
      return;
    }
    if (!this.wallet.tryBuy(skin.id, price)) {
      this.flash('err', 'No tienes suficientes monedas.');
      return;
    }
    this.flash('ok', `¡${skin.name} desbloqueada!`);
  }

  private flash(kind: 'ok' | 'err', text: string): void {
    this.toast.set({ kind, text });
    setTimeout(() => this.toast.set(null), 3200);
  }
}
