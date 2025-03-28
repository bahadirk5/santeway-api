import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '@/orders/entities/order.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { BaseEntity } from '@/database/base.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column()
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  transactionId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'TRY' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  errorCode: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  cardLastFourDigits: string;

  @Column({ nullable: true, type: 'json' })
  responseData: any;
}
