import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Iyzipay from 'iyzipay';

export const IYZIPAY_CLIENT = 'IYZIPAY_CLIENT';

export const IyzipayProvider: Provider = {
  provide: IYZIPAY_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new Iyzipay({
      apiKey: configService.getOrThrow('IYZICO_API_KEY'),
      secretKey: configService.getOrThrow('IYZICO_SECRET_KEY'),
      uri: configService.get('IYZICO_URI')
    });
  },
  inject: [ConfigService],
};