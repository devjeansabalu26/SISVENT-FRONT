import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { GoodsReceiptApiService } from '../data-access/goods-receipt-api.service';
import { GoodsReceiptDetail } from '../models/goods-receipt.model';

@Component({
  selector: 'app-goods-receipt-detail-page',
  imports: [PageHeader, StatusChip, RouterLink, DatePipe],
  templateUrl: './goods-receipt-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './goods-receipt-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptDetailPage implements OnInit {
  private readonly api = inject(GoodsReceiptApiService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  readonly loading = signal(true);
  readonly receipt = signal<GoodsReceiptDetail | null>(null);

  ngOnInit(): void {
    this.api.get(this.id).subscribe({
      next: (receipt) => {
        this.receipt.set(receipt);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
