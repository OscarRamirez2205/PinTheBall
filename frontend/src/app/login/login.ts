import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SelectedBallService } from '../services/selected-ball.service';

type LoginField = 'email' | 'password';
type FieldState = '' | 'valid' | 'invalid';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
/** Formulario de acceso; admins van al panel Laravel. */
export class Login {
  private readonly authService = inject(AuthService);
  private readonly selectedBall = inject(SelectedBallService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  errorMessage = signal('');
  fieldErrors = signal<Record<LoginField, string>>({
    email: '',
    password: '',
  });
  
  fieldStates = signal<Record<LoginField, FieldState>>({
    email: '',
    password: '',
  });

  credentials = {
    email: '',
    password: '',
  };

  async login(): Promise<void> {
    this.errorMessage.set('');
    const isFormValid = this.validateForm();

    if (!isFormValid) {
      return;
    }

    try {
      const res = await this.authService.login(this.credentials.email.trim(), this.credentials.password);
      // Panel de administración (sesión no guardada en la app)
      if (res.user.role === 'admin' && res.admin_url) {
        window.location.href = this.authService.backendUrl(res.admin_url);
        return;
      }

      await this.selectedBall.onSessionStarted(res.user.id);
      const returnUrlParam = this.route.snapshot.queryParamMap.get('returnUrl');
      const returnUrl =
        returnUrlParam && returnUrlParam.startsWith('/') && !returnUrlParam.startsWith('//')
          ? returnUrlParam
          : '/profile';
      await this.router.navigateByUrl(returnUrl);

    } catch (error: unknown) {
      const errorHttp = error as { error?: { message?: string; errors?: { email?: string[] } } };
      const emailField = errorHttp?.error?.errors?.email?.[0];
      const serverMessage = errorHttp?.error?.message;
      const text =
        (typeof emailField === 'string' && emailField) ||
        (typeof serverMessage === 'string' && serverMessage) ||
        'Error al iniciar sesión. Por favor, intente nuevamente.';
      this.errorMessage.set(text);
    }
  }

  isValid(field: LoginField): boolean {
    return this.fieldStates()[field] === 'valid';
  }

  isInvalid(field: LoginField): boolean {
    return this.fieldStates()[field] === 'invalid';
  }

  private validateForm(): boolean {
    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.credentials.email.trim())) {
      this.showError({ field: 'email', message: 'Introduce un correo electrónico válido.' });
      valid = false;
    } else {
      this.showValid('email');
    }

    if (!this.credentials.password) {
      this.showError({ field: 'password', message: 'Introduce tu contraseña.' });
      valid = false;
    } else {
      this.showValid('password');
    }

    return valid;
  }

  private showError({ field, message }: { field: LoginField; message: string }): void {
    this.fieldStates.update((states) => ({ ...states, [field]: 'invalid' }));
    this.fieldErrors.update((errors) => ({ ...errors, [field]: message }));
  }

  private showValid(field: LoginField): void {
    this.fieldStates.update((states) => ({ ...states, [field]: 'valid' }));
    this.fieldErrors.update((errors) => ({ ...errors, [field]: '' }));
  }
}
