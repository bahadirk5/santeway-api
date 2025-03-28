import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import * as Iyzipay from 'iyzipay';
import { IYZIPAY_CLIENT } from '../providers/iyzipay.provider';
import { BasketItemDto, CreatePaymentDto } from '../dto/create-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { Repository } from 'typeorm';
import { OrdersService } from '@/orders/services/orders.service';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(IYZIPAY_CLIENT) private readonly iyzipay: Iyzipay,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private ordersService: OrdersService,
  ) {}

  private calculateBasketTotal(basketItems: BasketItemDto[]): string {
    const total = basketItems.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );

    return Number(total).toFixed(2);
  }

  private validatePaymentAmounts(paymentData: CreatePaymentDto) {
    const basketTotal = this.calculateBasketTotal(paymentData.basketItems);

    const priceAmount = parseFloat(paymentData.price).toFixed(2);
    const paidPriceAmount = parseFloat(paymentData.paidPrice).toFixed(2);

    if (priceAmount !== basketTotal) {
      throw new BadRequestException(
        `Total amount (${priceAmount}) must be equal to basket total (${basketTotal})`,
      );
    }

    if (paidPriceAmount !== basketTotal) {
      throw new BadRequestException(
        `Paid amount (${paidPriceAmount}) must be equal to basket total (${basketTotal})`,
      );
    }

    return basketTotal;
  }

  async create(paymentData: CreatePaymentDto): Promise<any> {
    try {
      const validatedTotal = this.validatePaymentAmounts(paymentData);

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: new Date().getTime().toString(),
        price: validatedTotal,
        paidPrice: validatedTotal,
        currency: paymentData.currency,
        installment: paymentData.installment,
        basketId: paymentData.basketId,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
          cardHolderName: paymentData.paymentCard.cardHolderName,
          cardNumber: paymentData.paymentCard.cardNumber,
          expireMonth: paymentData.paymentCard.expireMonth,
          expireYear: paymentData.paymentCard.expireYear,
          cvc: paymentData.paymentCard.cvc,
          registerCard: paymentData.paymentCard.registerCard,
        },
        buyer: paymentData.buyer,
        shippingAddress: paymentData.shippingAddress,
        billingAddress: paymentData.billingAddress,
        basketItems: paymentData.basketItems.map((item) => ({
          ...item,
          price: parseFloat(item.price).toFixed(2),
        })),
      } as unknown as Iyzipay.PaymentRequestData;

      return new Promise((resolve, reject) => {
        this.iyzipay.payment.create(request, (err, result) => {
          if (err) {
            reject(new BadRequestException(err.message));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
