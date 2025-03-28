import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { TokenAuthGuard } from '@/auth/guards/token-auth.guard';

@Controller('payments')
@UseGuards(TokenAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: any) {
    return this.paymentsService.create(createPaymentDto);
  }
}
