import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../config/api-url';
import { ShopWalletService } from '../shop/shop-wallet.service';

export interface AuthUser {
  id: number;
  name: string | null;
  email: string;
  role: string;
  wallet?: number;
  available_at?: number;
  created_at?: number;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  token_type: string;
}

const TOKEN_KEY = 'ptb_auth_token';
const USER_KEY = 'ptb_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly shopWallet = inject(ShopWalletService);
  private readonly sessionPresent = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.sessionPresent.set(this.getToken() !== null);
    }
  }

  private syncSessionFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.sessionPresent.set(this.getToken() !== null);
  }

  hasSession(): boolean {
    return this.sessionPresent();
  }

  readonly apiBaseUrl = API_URL;

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/login`, { email, password }).pipe(
      tap((res) => {
        this.setToken(res.token);
        this.setUser(res.user);
      }),
    );
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/register`, payload).pipe(
      tap((res) => {
        this.setToken(res.token);
        this.setUser(res.user);
      }),
    );
  }

  logout(): void {
    this.clearToken();
  }

  setToken(token: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
    this.syncSessionFromStorage();
  }

  setUser(user: AuthUser): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  clearToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.sessionPresent.set(false);
    this.shopWallet.reset();
  }
}
