import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
      await this.authService.login(this.credentials.email.trim(), this.credentials.password);
      const paramUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const urlVolver =
        paramUrl && paramUrl.startsWith('/') && !paramUrl.startsWith('//') ? paramUrl : '/profile';
      await this.router.navigateByUrl(urlVolver);

    } catch (error: unknown) {
      const errorHttp = error as { error?: { message?: string; errors?: { email?: string[] } } };
      const campoEmail = errorHttp?.error?.errors?.email?.[0];
      const mensajeServidor = errorHttp?.error?.message;
      const texto =
        (typeof campoEmail === 'string' && campoEmail) ||
        (typeof mensajeServidor === 'string' && mensajeServidor) ||
        'Error al iniciar sesión. Por favor, intente nuevamente.';
      this.errorMessage.set(texto);
    }
  }
}
