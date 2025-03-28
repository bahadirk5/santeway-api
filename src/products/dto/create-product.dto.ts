import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for creating a new product
 * Contains all necessary validations and transformations
 */
export class CreateProductDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a number with at most 2 decimal places' },
  )
  @IsPositive({ message: 'Price must be greater than zero' })
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const price = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(price) ? 0 : price;
  })
  price: number;

  @IsString({ message: 'SKU must be a string' })
  @IsNotEmpty({ message: 'SKU is required' })
  @MaxLength(50, { message: 'SKU cannot exceed 50 characters' })
  @Matches(/^[A-Za-z0-9\-_]+$/, {
    message: 'SKU can only contain letters, numbers, hyphens, and underscores',
  })
  sku: string;

  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock cannot be negative' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return 0;
    const stock = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(stock) ? 0 : stock;
  })
  stock: number;

  @IsOptional()
  @IsString({ message: 'Category ID must be a string' })
  @IsUUID(4, { message: 'Category ID must be a valid UUID v4' })
  @Transform(({ value }) => {
    // Handle empty string or null
    if (!value || value === '') return null;
    return value;
  })
  categoryId?: string;
}
