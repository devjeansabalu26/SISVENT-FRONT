import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { SaleApiService } from '../data-access/sale-api.service';
import { CreditNoteApiService, CreditNoteDetail, CreditNoteListItem, SaleCreditSummary } from '../data-access/credit-note-api.service';
import { CreditNoteDialog } from '../components/credit-note-dialogs/credit-note-dialog';
import { CreditNoteDetailDialog } from '../components/credit-note-dialogs/credit-note-detail-dialog';
import { ReceiptMailerService } from '../data-access/receipt-mailer.service';
import { SaleDetail } from '../models/sale-detail.model';
import { paymentSummary } from '../utils/payment';

@Component({
  selector: 'app-sale-detail-page',
  imports: [PageHeader, StatusChip, RouterLink, DatePipe],
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
  /** Anular venta: menú Ventas con nivel Gestionar. */
  readonly canCancel = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.salesManage] });

  readonly loading = signal(true);
  readonly sale = signal<SaleDetail | null>(null);
  /** Devoluciones de la venta: notas emitidas, lo que se puede devolver y si aún se puede anular. */
  readonly credit = signal<SaleCreditSummary | null>(null);
  /** Recibido/vuelto, voucher de tarjeta o n.º de operación; null en ventas anteriores al detalle de pago. */
  readonly paymentDetails = computed(() => (this.sale()?.payments ?? []).map((payment) => paymentSummary(payment)));

  /** Envía el comprobante en PDF al correo del cliente (o al que se indique en el diálogo). */
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
  }

  issueCreditNote(): void {
    const summary = this.credit();
    if (!summary?.canIssue) return;
    this.dialog
      .open<CreditNoteDialog, SaleCreditSummary, CreditNoteDetail>(CreditNoteDialog, { data: summary })
      .afterClosed()
      .pipe(filter((note): note is CreditNoteDetail => !!note))
      .subscribe((note) => {
        this.notifications.show(`Nota de crédito ${note.note.creditNoteNumber} emitida por S/ ${note.note.total.toFixed(2)}.`, 'success');
        this.load();
      });
  }

  openCreditNote(note: CreditNoteListItem): void {
    this.dialog.open(CreditNoteDetailDialog, { data: note.id });
  }

  annul(): void {
    const sale = this.sale();
    if (!sale) return;
    const data: ReviewDialogData = {
      title: 'Anular venta',
      icon: 'receipt_long',
      meta: [
        { label: 'Venta', value: sale.saleNumber },
        { label: 'Cliente', value: sale.clientName ?? 'Cliente general' },
        { label: 'Total', value: `S/ ${sale.total.toFixed(2)}` },
      ],
      banner: { tone: 'danger', text: 'Esta acción revertirá el stock de los productos vendidos y no se puede deshacer.' },
      reason: { label: 'Motivo de anulación', placeholder: 'Error en el cobro, devolución del cliente…' },
      confirmLabel: 'Anular venta',
      destructive: true,
    };
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean | string>(ReviewDialog, { data })
      .afterClosed()
      .pipe(filter((reason): reason is string => typeof reason === 'string'))
      .subscribe((reason) => {
        this.api.cancel(sale.id, reason).subscribe({
          next: () => {
            this.notifications.show('Venta anulada. Stock revertido.', 'success');
            this.load();
          },
          error: () => this.notifications.show('No se pudo anular la venta.', 'error'),
        });
      });
  }
}
