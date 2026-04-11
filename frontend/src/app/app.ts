import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SceneComponent } from './scene/scene';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SceneComponent],
  template: `
    @if (showScene()) {
      <app-scene></app-scene>
    }
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  /** Oculta el canvas 3D en la pantalla de login. */
  readonly showScene = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => !e.urlAfterRedirects.split('?')[0].startsWith('/login')),
    ),
    { initialValue: !this.router.url.split('?')[0].startsWith('/login') },
  );
}