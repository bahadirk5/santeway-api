import {
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsEmail,
  IsNumberString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class PaymentCardDto {
  @IsString()
  @IsNotEmpty()
  cardHolderName: string;

  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @IsString()
  @IsNotEmpty()
  expireMonth: string;

  @IsString()
  @IsNotEmpty()
  expireYear: string;

  @IsString()
  @IsNotEmpty()
  cvc: string;

  @IsString()
  registerCard: string;
}

class BuyerDto {
  @IsString()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  surname: string;

  @IsString()
  gsmNumber: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  identityNumber: string;

  @IsString()
  lastLoginDate: string;

  @IsString()
  registrationDate: string;

  @IsString()
  registrationAddress: string;

  @IsString()
  ip: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsString()
  zipCode: string;
}

class AddressDto {
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class BasketItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  category1: string;

  @IsString()
  category2: string;

  @IsString()
  itemType: string;

  @IsNumberString()
  price: string;
}

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Fiyat formatı geçersiz. Örnek: 10.99',
  })
  readonly price: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Ödenen fiyat formatı geçersiz. Örnek: 10.99',
  })
  readonly paidPrice: string;

  @IsString()
  @IsNotEmpty()
  readonly currency: string;

  @IsString()
  readonly installment: string;

  @IsString()
  readonly basketId: string;

  @ValidateNested()
  @Type(() => PaymentCardDto)
  readonly paymentCard: PaymentCardDto;

  @ValidateNested()
  @Type(() => BuyerDto)
  readonly buyer: BuyerDto;

  @ValidateNested()
  @Type(() => AddressDto)
  readonly shippingAddress: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  readonly billingAddress: AddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BasketItemDto)
  readonly basketItems: BasketItemDto[];
}
