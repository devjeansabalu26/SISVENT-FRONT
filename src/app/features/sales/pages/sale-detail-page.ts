import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { ChangeDetectionStrategy, Component, computed, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { SaleApiService } from '../data-access/sale-api.service';
import { CreditNoteApiService, CreditNoteListItem, SaleCreditSummary } from '../data-access/credit-note-api.service';
import { AnnulSaleDialog, AnnulSaleDialogData } from '../components/annul-sale-dialog/annul-sale-dialog';
import { PosApiService } from '../data-access/pos-api.service';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { CreditNoteDetailDialog } from '../components/credit-note-dialogs/credit-note-detail-dialog';
import { ReceiptMailerService } from '../data-access/receipt-mailer.service';
import { SaleAnnulmentOptions, SaleDetail } from '../models/sale-detail.model';
import { paymentSummary } from '../utils/payment';
import { DateTimePipe, MoneyPipe, RegionalPipe } from '../../../shared/pipes/date-time.pipe';

@Component({
  selector: 'app-sale-detail-page',
  imports: [PageHeader, StatusChip, RouterLink, MoneyPipe, DateTimePipe, RegionalPipe],
  templateUrl: './sale-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './sale-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleDetailPage implements OnInit {
  private readonly api = inject(SaleApiService);
  private readonly creditNotes = inject(CreditNoteApiService);
  private readonly mailer = inject(ReceiptMailerService);
  readonly sending = this.mailer.sending;
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  private readonly posApi = inject(PosApiService);
  readonly canCancel = inject(UserContextService).user()?.role === 'ADMIN'
    && inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.salesManage] });
  readonly annulment = signal<SaleAnnulmentOptions | null>(null);

  readonly loading = signal(true);
  readonly sale = signal<SaleDetail | null>(null);
  readonly credit = signal<SaleCreditSummary | null>(null);
  readonly paymentDetails = computed(() => (this.sale()?.payments ?? []).map((payment) => paymentSummary(payment)));

  sendReceipt(): void {
    const sale = this.sale();
    if (sale) this.mailer.send(sale);
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.get(this.id).subscribe({
      next: (sale) => {
        this.sale.set(sale);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.creditNotes.summary(this.id).subscribe({ next: (summary) => this.credit.set(summary), error: () => undefined });
    if (this.canCancel) {
      this.api.annulmentOptions(this.id).subscribe({ next: (options) => this.annulment.set(options), error: () => undefined });
    }
  }

  openCreditNote(note: CreditNoteListItem): void {
    this.dialog.open(CreditNoteDetailDialog, { data: note.id });
  }

  annul(): void {
    const sale = this.sale();
    const options = this.annulment();
    if (!sale || !options?.canAnnul) return;
    this.posApi.paymentMethods().subscribe({
      next: (paymentMethods) =>
        this.dialog
          .open<AnnulSaleDialog, AnnulSaleDialogData, SaleDetail>(AnnulSaleDialog, { data: { sale, options, paymentMethods } })
          .afterClosed()
          .pipe(filter((result): result is SaleDetail => !!result))
          .subscribe(() => {
            this.notifications.show('Venta anulada. El stock se repuso según el destino elegido.', 'success');
            this.load();
          }),
      error: () => this.notifications.show('No se pudieron cargar los métodos de pago.', 'error'),
    });
  }
}
