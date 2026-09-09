import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

const EXPECTED_TOTAL = 2450;
const EXPECTED_CASH = 1800;
const EXPECTED_CARD = 650;

@Component({
  selector: 'app-cash-close-dialog',
  imports: [MatDialogModule],
  templateUrl: './cash-close-dialog.html',
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashCloseDialog {
  private readonly dialogRef = inject(MatDialogRef<CashCloseDialog, boolean>);

  readonly expectedTotal = EXPECTED_TOTAL;
  readonly expectedCash = EXPECTED_CASH;
  readonly expectedCard = EXPECTED_CARD;

  readonly countedCash = signal(EXPECTED_CASH);
  readonly notes = signal('');

  readonly difference = computed(() => this.countedCash() - EXPECTED_CASH);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
