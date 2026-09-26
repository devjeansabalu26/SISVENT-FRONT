import { Product } from '../../products/models/product.model';

export interface CartItem {
  readonly product: Product;
  readonly quantity: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER';
