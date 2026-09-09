import { Injectable, signal } from '@angular/core';
import { UserContext } from './user-context.model';

@Injectable({ providedIn: 'root' })
export class UserContextService {
  private readonly userState = signal<UserContext | null>(null);
  readonly user = this.userState.asReadonly();

  set(user: UserContext): void {
    this.userState.set(user);
  }

  clear(): void {
    this.userState.set(null);
  }
}
