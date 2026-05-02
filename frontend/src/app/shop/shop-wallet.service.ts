import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShopWalletService {
  /** Monedas disponibles (demo; luego enlazar con API / partidas) */
  private readonly _coins = signal(1_420);

  private readonly _ownedIds = signal<Set<string>>(new Set(['classic']));

  readonly coins = this._coins.asReadonly();
  readonly ownedIds = this._ownedIds.asReadonly();

  isOwned(skinId: string): boolean {
    return this._ownedIds().has(skinId);
  }

  /**
   * Compra una skin. Devuelve false si ya la tienes o no hay saldo.
   * Precio 0 solo desbloquea si no está en catálogo como pago.
   */
  tryBuy(skinId: string, price: number): boolean {
    if (this._ownedIds().has(skinId)) {
      return false;
    }
    if (price > 0 && this._coins() < price) {
      return false;
    }
    if (price > 0) {
      this._coins.update((c) => c - price);
    }
    this._ownedIds.update((s) => new Set(s).add(skinId));
    return true;
  }

  /** Solo para pruebas / futuro sync con backend */
  addCoins(amount: number): void {
    if (amount <= 0) return;
    this._coins.update((c) => c + amount);
  }
}
