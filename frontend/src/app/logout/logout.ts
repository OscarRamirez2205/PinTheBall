import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SelectedBallService } from '../services/selected-ball.service';

/** Limpia sesión y bolas seleccionadas; vuelve al inicio. */
@Component({
  standalone: true,
  template: '',
})
export class Logout {
  private readonly auth = inject(AuthService);
  private readonly selectedBall = inject(SelectedBallService);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    this.auth.logout();
    this.selectedBall.clearOnLogout();
    if (isPlatformBrowser(this.platformId)) {
      globalThis.location.replace('/');
    }
  }
}
