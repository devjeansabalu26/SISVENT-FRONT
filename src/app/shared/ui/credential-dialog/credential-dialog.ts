import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface CredentialDialogData {
  readonly title: string;
  readonly code?: string;
  readonly successMessage: string;
  readonly username: string;
  readonly passwordLabel: string;
  readonly password: string;
}

type CopiedField = 'username' | 'password' | null;

@Component({
  selector: 'app-credential-dialog',
  imports: [MatDialogModule],
  template: `
    <section class="dialog review">
      <header>
        <span class="material-icons">verified_user</span>
        <div class="review__title"><h2>{{ data.title }}</h2></div>
        @if (data.code) {
          <small class="review__code">{{ data.code }}</small>
        }
      </header>

      <p class="review__banner" data-tone="success">
        <span class="material-icons">check_circle</span>{{ data.successMessage }}
      </p>

      <div class="fields">
        <label class="wide"
          >Usuario
          <div class="password">
            <code>{{ data.username }}</code>
            <button type="button" (click)="copy('username', data.username)">
              {{ copied() === 'username' ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
        </label>
        <label class="wide"
          >{{ data.passwordLabel }}
          <div class="password">
            <code>{{ data.password }}</code>
            <button type="button" (click)="copy('password', data.password)">
              {{ copied() === 'password' ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
        </label>
      </div>

      <p class="review__banner" data-tone="warning">
        <span class="material-icons">shield</span>
        Esta contraseña no podrá consultarse nuevamente después de cerrar esta ventana. Asegúrese de copiarla ahora.
      </p>

      <footer>
        <button type="button" class="primary" (click)="close()">Cerrar</button>
      </footer>
    </section>
  `,
  styleUrls: ['../../forms/dialog-form.scss', '../review-dialog/review-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredentialDialog {
  readonly data = inject<CredentialDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CredentialDialog, void>);
  readonly copied = signal<CopiedField>(null);

  async copy(field: Exclude<CopiedField, null>, value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(field);
    } catch {
      this.copied.set(null);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
