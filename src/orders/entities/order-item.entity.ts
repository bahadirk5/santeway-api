import { Entity, Column, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '@/products/entities/product.entity';
import { BaseEntity } from '@/database/base.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order)
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => Product)
  product: Product;

  @Column()
  productId: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;
}
