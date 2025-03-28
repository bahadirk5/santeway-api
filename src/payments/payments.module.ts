import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './services/payments.service';
import { PaymentsController } from './controllers/payments.controller';
import { IyzipayProvider } from './providers/iyzipay.provider';
import { Payment } from './entities/payment.entity';
import { OrdersModule } from '@/orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, IyzipayProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
