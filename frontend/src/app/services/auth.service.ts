import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../config/api-url';

export interface AuthUser {
  id: number;
  name: string | null;
  email: string;
  role: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  token_type: string;
}

const TOKEN_KEY = 'ptb_auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /** Misma base que `API_URL` (útil para depuración o otros servicios). */
  readonly apiBaseUrl = API_URL;

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/login`, { email, password })
      .pipe(tap((res) => this.setToken(res.token)));
  }

  setToken(token: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  }

  clearToken(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
  }
}
