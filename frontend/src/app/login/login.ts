import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  errorMessage = signal('');

  credentials = {
    email: '',
    password: '',
  };

  async iniciarSesion(): Promise<void> {
    this.errorMessage.set('');
    try {
      await firstValueFrom(
        this.authService.login(this.credentials.email.trim(), this.credentials.password),
      );
      const raw = this.route.snapshot.queryParamMap.get('returnUrl');
      const returnUrl =
        raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/profile';
      await this.router.navigateByUrl(returnUrl);
    } catch (err: unknown) {
      const httpErr = err as { error?: { message?: string; errors?: { email?: string[] } } };
      const fromField = httpErr?.error?.errors?.email?.[0];
      const fromMessage = httpErr?.error?.message;
      const msg =
        (typeof fromField === 'string' && fromField) ||
        (typeof fromMessage === 'string' && fromMessage) ||
        'Error al iniciar sesión. Por favor, intente nuevamente.';
      this.errorMessage.set(msg);
    }
  }
}
