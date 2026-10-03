import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { PlatformUserApiService } from '../../../users/data-access/platform-user-api.service';

export interface ResetAccessData {
  readonly profileId: string;
  readonly username: string;
  readonly companyName: string;
}

@Component({
  selector: 'app-reset-access-dialog',
  imports: [MatDialogModule],
  templateUrl: './reset-access-dialog.html',
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../../../../shared/ui/review-dialog/review-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetAccessDialog implements OnInit {
  readonly data = inject<ResetAccessData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ResetAccessDialog, boolean>);
  private readonly api = inject(PlatformUserApiService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly password = signal('');
  /** Usuario de acceso (código de 5 dígitos) que devuelve el backend al restablecer. */
  readonly username = signal(this.data.username);
  readonly forceChange = signal(true);
  readonly copied = signal(false);

  ngOnInit(): void {
    this.api.resetAccess(this.data.profileId).subscribe({
      next: (response) => {
        this.password.set(response.temporaryPassword);
        if (response.userCode) this.username.set(response.userCode);
        this.forceChange.set(response.forceChange);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo restablecer el acceso.', 'error');
        this.dialogRef.close(false);
      },
    });
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.password());
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
