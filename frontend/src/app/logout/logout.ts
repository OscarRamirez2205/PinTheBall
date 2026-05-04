import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Ruta `/logout`: borra la sesión local y recarga la home (evita NG04002 si algo enlaza a `logout`). */
@Component({
  standalone: true,
  template: '',
})
export class Logout {
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    this.auth.logout();
    if (isPlatformBrowser(this.platformId)) {
      globalThis.location.replace('/');
    }
  }
}
