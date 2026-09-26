import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { StockAdjustmentRequest, StockPage, StockRow } from '../models/inventory-item.model';
import { InventoryMovement, MovementPage } from '../models/inventory-movement.model';

interface StockListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly storeId?: string;
  readonly categoryId?: string;
  readonly lowStock?: boolean;
}

interface MovementListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly storeId?: string;
  readonly movementType?: string;
  readonly from?: string;
  readonly to?: string;
}

interface RawStockItem {
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly currentStock: number;
  readonly minStock: number;
  readonly maxStock: number | null;
  readonly status: StockRow['status'];
  readonly updatedAt: string;
  readonly version: number;
}

interface RawMovementItem {
  readonly id: string;
  readonly createdAt: string;
  readonly code: string;
  readonly movementType: string;
  readonly productName: string;
  readonly sku: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly quantityDelta: number;
  readonly stockBefore: number;
  readonly stockAfter: number;
  readonly reason: string | null;
  readonly originType: string | null;
}

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/inventory`;

  stock(params: StockListParams = {}): Observable<StockPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.lowStock !== undefined) httpParams = httpParams.set('lowStock', params.lowStock);
    return this.http
      .get<{ items: readonly RawStockItem[]; pageNumber: number; pageSize: number; totalCount: number }>(
        `${this.baseUrl}/stock`,
        { params: httpParams },
      )
      .pipe(
        map((page) => ({
          ...page,
          items: page.items.map((item) => ({ ...item, id: `${item.productId}_${item.storeId}` })),
        })),
      );
  }

  movements(params: MovementListParams = {}): Observable<MovementPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.movementType) httpParams = httpParams.set('movementType', params.movementType);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    return this.http
      .get<{ items: readonly RawMovementItem[]; pageNumber: number; pageSize: number; totalCount: number }>(
        `${this.baseUrl}/movements`,
        { params: httpParams },
      )
      .pipe(map((page) => ({ ...page, items: page.items.map((item) => ({ ...item, id: item.id })) })));
  }

  adjust(body: StockAdjustmentRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/adjustments`, body);
  }
}
