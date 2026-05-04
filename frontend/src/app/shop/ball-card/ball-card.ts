import { Component, computed, input, output } from '@angular/core';
import type { ShopSkin } from '../shop-skin.model';

@Component({
  selector: 'app-ball-card',
  standalone: true,
  templateUrl: './ball-card.html',
  styleUrl: './ball-card.scss',
})
export class BallCard {
  skin = input.required<ShopSkin>();
  dealPrice = input<number | undefined>(undefined);
  coins = input.required<number>();
  owned = input.required<boolean>();

  purchase = output<{ skin: ShopSkin; price: number }>();

  readonly effectivePrice = computed(() => {
    const oferta = this.dealPrice();
    return oferta !== undefined ? oferta : this.skin().price;
  });

  readonly canBuy = computed(() => {
    if (this.owned()) return false;
    const precio = this.effectivePrice();
    return precio <= 0 || this.coins() >= precio;
  });

  readonly isDisabled = computed(() => this.owned() || !this.canBuy());

  readonly label = computed(() => {
    if (this.owned()) return 'Desbloqueada';
    const precio = this.effectivePrice();
    if (precio <= 0) return 'Gratis';
    return 'Comprar';
  });

  onBuy(): void {
    if (!this.isDisabled()) {
      this.purchase.emit({ skin: this.skin(), price: this.effectivePrice() });
    }
  }
}
