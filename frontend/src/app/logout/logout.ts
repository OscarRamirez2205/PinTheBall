import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../services/auth.service';

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
