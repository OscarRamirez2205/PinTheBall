import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: '**',
    loadComponent: () => import('./scene/scene').then((m) => m.SceneComponent),
  }
];
