import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { BaseEntity } from '@/database/base.entity';

@Entity('orders')
export class Order extends BaseEntity {
  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;
}
