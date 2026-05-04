import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly errorMessage = signal('');
  readonly submitting = signal(false);

  readonly form = {
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  };

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');

    const name = this.form.name.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(name)) {
      this.errorMessage.set('El nombre arcade debe ser exactamente 3 letras (A-Z).');
      return;
    }

    const email = this.form.email.trim();
    if (!email) {
      this.errorMessage.set('Introduce tu correo electrónico.');
      return;
    }

    if (this.form.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.form.password !== this.form.passwordConfirm) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.auth.register({
          name,
          email,
          password: this.form.password,
          password_confirmation: this.form.passwordConfirm,
        }),
      );
      await this.router.navigateByUrl('/profile');
    } catch (error: unknown) {
      const texto = this.mensajeErrorApi(error);
      this.errorMessage.set(
        texto ?? 'No se pudo completar el registro. Inténtalo de nuevo.',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private mensajeErrorApi(error: unknown): string | null {
    const errorHttp = error as {
      error?: { message?: string; errors?: Record<string, string[] | undefined> };
    };
    const campos = errorHttp?.error?.errors;
    if (campos) {
      for (const clave of Object.keys(campos)) {
        const lista = campos[clave];
        if (Array.isArray(lista) && typeof lista[0] === 'string' && lista[0]) {
          return lista[0];
        }
      }
    }
    const mensaje = errorHttp?.error?.message;
    return typeof mensaje === 'string' && mensaje ? mensaje : null;
  }
}
