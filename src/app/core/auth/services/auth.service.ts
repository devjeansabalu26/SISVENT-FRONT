import { Injectable, computed, signal } from '@angular/core';
import { AuthStatus } from '../models/auth-state.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly statusState = signal<AuthStatus>('unauthenticated');

  readonly status = this.statusState.asReadonly();
  readonly isAuthenticated = computed(() => this.statusState() === 'authenticated');

  markAuthenticated(): void {
    this.statusState.set('authenticated');
  }

  markUnauthenticated(): void {
    this.statusState.set('unauthenticated');
  }

  reset(): void {
    this.statusState.set('pending');
  }
}
