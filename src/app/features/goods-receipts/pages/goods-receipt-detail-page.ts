import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { GOODS_RECEIPT_DETAIL_MOCK } from '../data-access/goods-receipt.mock';

@Component({
  selector: 'app-goods-receipt-detail-page',
  imports: [PageHeader, StatusChip, RouterLink],
  templateUrl: './goods-receipt-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './goods-receipt-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptDetailPage {
  readonly receipt = GOODS_RECEIPT_DETAIL_MOCK;
  readonly totalUnits = this.receipt.lines.reduce((sum, line) => sum + line.quantity, 0);
}
