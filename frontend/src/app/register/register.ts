import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SelectedBallService } from '../services/selected-ball.service';

type RegisterField = 'name' | 'email' | 'password' | 'passwordConfirm';
type FieldState = '' | 'valid' | 'invalid';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
/** Alta de jugador: nombre arcade de 3 letras y validación de contraseña. */
export class Register {
  private readonly auth = inject(AuthService);
  private readonly selectedBall = inject(SelectedBallService);
  private readonly router = inject(Router);

  readonly errorMessage = signal('');
  readonly submitting = signal(false);
  readonly fieldErrors = signal<Record<RegisterField, string>>({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  readonly fieldStates = signal<Record<RegisterField, FieldState>>({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  readonly form = {
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  };

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    const isFormValid = this.validateForm();

    if (!isFormValid) {
      return;
    }

    const name = this.form.name.trim().toUpperCase();
    const email = this.form.email.trim();

    this.submitting.set(true);
    try {
      const res = await this.auth.register({
        name,
        email,
        password: this.form.password,
        password_confirmation: this.form.passwordConfirm,
      });
      await this.selectedBall.onSessionStarted(res.user.id);
      await this.router.navigateByUrl('/profile');
    } catch (error: unknown) {
      const text = this.apiErrorMessage(error);
      this.errorMessage.set(
        text ?? 'No se pudo completar el registro. Inténtalo de nuevo.',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  isValid(field: RegisterField): boolean {
    return this.fieldStates()[field] === 'valid';
  }

  isInvalid(field: RegisterField): boolean {
    return this.fieldStates()[field] === 'invalid';
  }

  private validateForm(): boolean {
    let valid = true;
    const name = this.form.name.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(name)) {
      this.showError({
        field: 'name',
        message: 'El nombre arcade debe ser exactamente 3 letras (A-Z).',
      });
      valid = false;
    } else {
      this.showValid('name');
      this.form.name = name;
    }

    const email = this.form.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError({ field: 'email', message: 'Introduce un correo electrónico válido.' });
      valid = false;
    } else {
      this.showValid('email');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(this.form.password)) {
      this.showError({
        field: 'password',
        message: 'Debe tener 8 caracteres, una mayúscula, una minúscula y un número.',
      });
      valid = false;
    } else {
      this.showValid('password');
    }

    if (this.form.passwordConfirm !== this.form.password || !this.form.passwordConfirm) {
      this.showError({ field: 'passwordConfirm', message: 'Las contraseñas deben coincidir.' });
      valid = false;
    } else {
      this.showValid('passwordConfirm');
    }

    return valid;
  }

  private showError({ field, message }: { field: RegisterField; message: string }): void {
    this.fieldStates.update((states) => ({ ...states, [field]: 'invalid' }));
    this.fieldErrors.update((errors) => ({ ...errors, [field]: message }));
  }

  private showValid(field: RegisterField): void {
    this.fieldStates.update((states) => ({ ...states, [field]: 'valid' }));
    this.fieldErrors.update((errors) => ({ ...errors, [field]: '' }));
  }

  private apiErrorMessage(error: unknown): string | null {
    const errorHttp = error as {
      error?: { message?: string; errors?: Record<string, string[] | undefined> };
    };
    const fields = errorHttp?.error?.errors;
    if (fields) {
      for (const key of Object.keys(fields)) {
        const list = fields[key];
        if (Array.isArray(list) && typeof list[0] === 'string' && list[0]) {
          return list[0];
        }
      }
    }
    const message = errorHttp?.error?.message;
    return typeof message === 'string' && message ? message : null;
  }
}
