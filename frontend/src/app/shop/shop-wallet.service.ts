import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })

export class ShopWalletService {
  private readonly _coins = signal(0);
  private readonly _ownedBallIds = signal<Set<number>>(new Set());

  readonly coins = this._coins.asReadonly();
  readonly ownedBallIds = this._ownedBallIds.asReadonly();

  reset(): void {
    this._coins.set(0);
    this._ownedBallIds.set(new Set());
  }

  hydrate(wallet: number, ownedBallIds: number[]): void {
    this._coins.set(Math.max(0, wallet));
    this._ownedBallIds.set(new Set(ownedBallIds));
  }

  isOwnedSkinId(skinId: string): boolean {
    const n = Number(skinId);
    if (Number.isNaN(n)) return false;
    return this._ownedBallIds().has(n);
  }

  applyServerPurchase(userWallet: number, ballId: number): void {
    this._coins.set(Math.max(0, userWallet));
    this._ownedBallIds.update((s) => new Set(s).add(ballId));
  }

  setWalletBalance(wallet: number): void {
    this._coins.set(Math.max(0, wallet));
  }
}
