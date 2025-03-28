import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  price: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  stock: number;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

// Multipart form için olan ProductDTO
// (Bu DTO doğrudan controller'da kullanılacak)
export class CreateProductWithImagesDto extends CreateProductDto {
  // Form data'dan dosyalar FileInterceptor tarafından işlenecek
  // controller method'da @UploadedFiles() files: Express.Multer.File[] şeklinde alınacak
}
