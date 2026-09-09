import { ProductListItem } from '../../products/models/product.model';
export interface CartItem { readonly product:ProductListItem; readonly quantity:number; }
export type PaymentMethod='CASH'|'CARD'|'YAPE'|'PLIN'|'TRANSFER';
