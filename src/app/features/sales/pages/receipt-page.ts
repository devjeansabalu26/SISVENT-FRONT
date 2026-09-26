import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { NotificationService } from '../../../core/notifications/notification.service';
import { SaleApiService } from '../data-access/sale-api.service';
import { SaleDetail } from '../models/sale-detail.model';

@Component({
  selector: 'app-receipt-page',
  imports: [DatePipe],
  templateUrl: './receipt-page.html',
  styleUrl: './receipt-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptPage implements OnInit {
  private readonly api = inject(SaleApiService);
  private readonly location = inject(Location);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  readonly loading = signal(true);
  readonly sale = signal<SaleDetail | null>(null);

  ngOnInit(): void {
    this.api.get(this.id).subscribe({
      next: (sale) => {
        this.sale.set(sale);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  back(): void {
    this.location.back();
  }

  print(): void {
    window.print();
  }

  sendEmail(): void {
    this.notifications.show('El envío por correo se habilitará cuando exista el endpoint correspondiente.', 'info');
  }

  downloadPdf(): void {
    this.notifications.show('La descarga en PDF se habilita cuando el endpoint esté disponible.', 'info');
  }
}
