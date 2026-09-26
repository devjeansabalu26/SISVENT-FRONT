import { Product } from '../../products/models/product.model';

export interface CartItem {
  readonly product: Product;
  readonly quantity: number;
}

