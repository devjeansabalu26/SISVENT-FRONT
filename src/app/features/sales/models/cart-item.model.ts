import { Product } from '../../products/models/product.model';

export interface CartItem {
  readonly product: Product;
  readonly quantity: number;
  readonly wholesalePrice?: number | null;
  readonly unitPrice?: number | null;
}

