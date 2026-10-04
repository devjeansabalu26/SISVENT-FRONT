import { Injectable, computed, inject, signal } from '@angular/core';
import { StoreApiService } from '../../../features/locales/data-access/store-api.service';
import { UserContextService } from '../user-context/user-context.service';

export interface StoreOption {
  readonly id: string;
  readonly name: string;
}

const ALL = '*';

@Injectable({ providedIn: 'root' })
export class StoreContextService {
  private readonly users = inject(UserContextService);
  private readonly storeApi = inject(StoreApiService);
  private readonly chosen = signal<string | undefined>(undefined);
  private chosenFor: string | null = null;
  private loaded = false;
  private readonly apiStores = signal<readonly StoreOption[]>([]);

  readonly isAdmin = computed(() => this.users.user()?.role === 'ADMIN');
  readonly canPick = computed(() => this.isAdmin() || !!this.users.user()?.canViewAllStores);
  readonly stores = computed<readonly StoreOption[]>(() =>
    this.isAdmin() ? this.apiStores() : (this.users.user()?.visibleStores ?? []));

  readonly selectedStoreId = computed<string | null>(() => {
    const user = this.users.user();
    if (!user || user.role === 'SUPERADMIN') return null;
    const own = user.branchId ?? null;
    if (!this.canPick()) return own;
    const value = this.storedChoice(user.userId);
    if (value === ALL) return null;
    if (value && (!this.stores().length || this.stores().some((s) => s.id === value))) return value;
    return this.isAdmin() ? null : own; // ADMIN: todos; vendedor: su local
  });

  readonly selectedStore = computed(() => this.stores().find((s) => s.id === this.selectedStoreId()) ?? null);

  load(): void {
    if (this.loaded || !this.isAdmin()) return;
    this.loaded = true;
    this.storeApi.list().subscribe({
      next: (response) => this.apiStores.set(response.items.filter((s) => s.isActive).map((s) => ({ id: s.id, name: s.name }))),
      error: () => (this.loaded = false),
    });
  }

  select(storeId: string | null): void {
    const userId = this.users.user()?.userId;
    if (!userId) return;
    const value = storeId || ALL;
    this.chosenFor = userId;
    this.chosen.set(value);
    try {
      localStorage.setItem(this.key(userId), value);
    } catch {
    }
  }

  private storedChoice(userId: string): string | undefined {
    const current = this.chosen(); // siempre se lee: así el computed reacciona a select()
    if (this.chosenFor !== userId) {
      this.chosenFor = userId;
      let stored: string | undefined;
      try {
        stored = localStorage.getItem(this.key(userId)) ?? undefined;
      } catch {
        stored = undefined;
      }
      queueMicrotask(() => this.chosen.set(stored));
      return stored;
    }
    return current;
  }

  private key(userId: string): string {
    return `sisvent.selectedStore.${userId}`;
  }
}
