import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { PRODUCT_MOCK } from '../data-access/product.mock';
import { ProductListItem } from '../models/product.model';

@Component({ selector:'app-product-list-page', imports:[FormsModule,DataTable,PageHeader,RouterLink], templateUrl:'./product-list-page.html', styleUrl:'../../../shared/ui/list-page.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class ProductListPage {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  readonly query = signal('');

  open(product: ProductListItem): void { void this.router.navigate(['/app/products', product.id]); }
  readonly rows = signal(PRODUCT_MOCK);
  readonly columns: readonly DataTableColumn<ProductListItem>[] = [
    {key:'sku',label:'SKU',value:r=>r.sku},{key:'name',label:'Producto',value:r=>r.name},
    {key:'category',label:'Categoría',value:r=>r.category},{key:'brand',label:'Marca',value:r=>r.brand},
    {key:'price',label:'Precio',value:r=>`S/ ${r.price.toFixed(2)}`},{key:'status',label:'Estado',value:r=>r.status,type:'status'},
    {key:'stock',label:'Stock',value:r=>r.stock},
  ];
  filter(value:string):void { this.query.set(value); const q=value.toLowerCase(); this.rows.set(PRODUCT_MOCK.filter(p=>`${p.sku} ${p.name}`.toLowerCase().includes(q))); }
  remove(product:ProductListItem):void {
    this.dialog.open(ConfirmDialog,{data:{title:'Eliminar producto',message:`Se eliminará permanentemente ${product.name}. Esta acción no se puede deshacer.`,confirmLabel:'Eliminar',destructive:true}})
      .afterClosed().pipe(filter(Boolean)).subscribe(()=>this.rows.update(rows=>rows.filter(row=>row.id!==product.id)));
  }
}
