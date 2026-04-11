import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth
      .login(this.email.trim(), this.password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (err: unknown) => {
          const body = err && typeof err === 'object' && 'error' in err ? (err as { error?: unknown }).error : undefined;
          const msg =
            extractMessage(body) ??
            'No se pudo iniciar sesión. Comprueba email, contraseña y que la API esté en marcha.';
          this.errorMessage.set(msg);
        },
      });
  }
}

function extractMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const o = body as Record<string, unknown>;
  if (typeof o['message'] === 'string') {
    return o['message'];
  }
  const errors = o['errors'];
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') {
      return first[0];
    }
  }
  return null;
}
