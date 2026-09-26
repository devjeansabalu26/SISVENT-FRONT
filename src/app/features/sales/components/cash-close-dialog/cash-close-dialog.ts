import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SaleApiService } from '../../data-access/sale-api.service';

@Component({
  selector: 'app-cash-close-dialog',
  imports: [MatDialogModule],
  templateUrl: './cash-close-dialog.html',
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashCloseDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CashCloseDialog, boolean>);
  private readonly api = inject(SaleApiService);

  readonly loading = signal(true);
  readonly expectedTotal = signal(0);
  readonly expectedCash = signal(0);
  readonly expectedOther = signal(0);

  readonly countedCash = signal(0);
  readonly notes = signal('');

  readonly difference = computed(() => this.countedCash() - this.expectedCash());

  ngOnInit(): void {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    this.api.list({ pageSize: 100, from, to, status: 'CONFIRMED' }).subscribe({
      next: (page) => {
        const cash = page.items.filter((item) => item.paymentMethod === 'Efectivo' || item.paymentMethod === 'CASH');
        const cashTotal = cash.reduce((sum, item) => sum + item.total, 0);
        this.expectedCash.set(cashTotal);
        this.expectedTotal.set(page.periodTotals.totalAmount);
        this.expectedOther.set(page.periodTotals.totalAmount - cashTotal);
        this.countedCash.set(cashTotal);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
