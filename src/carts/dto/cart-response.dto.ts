import { Product } from '@/products/entities/product.entity';

export class CartItemResponseDto {
  id: number;
  productId: number;
  product: Partial<Product>;
  quantity: number;
  price: number;
  subtotal: number;
}

export class CartResponseDto {
  id: number;
  items: CartItemResponseDto[];
  totalItems: number;
  totalAmount: number;
}
