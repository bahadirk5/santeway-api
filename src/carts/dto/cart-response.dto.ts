import { Product } from '@/products/entities/product.entity';

export class CartItemResponseDto {
  id: string;
  productId: string;
  product: Partial<Product>;
  quantity: number;
  price: number;
  subtotal: number;
}

export class CartResponseDto {
  id: string;
  items: CartItemResponseDto[];
  totalItems: number;
  totalAmount: number;
}
