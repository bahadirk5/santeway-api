import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './controllers/products.controller';
import { ProductImagesController } from './controllers/product-images.controller';
import { ProductsService } from './services/products.service';
import { ProductImagesService } from './services/product-images.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '@/categories/entities/category.entity';
import { UploadsModule } from '@/uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, Category]),
    UploadsModule,
  ],
  controllers: [ProductsController, ProductImagesController],
  providers: [ProductsService, ProductImagesService],
  exports: [ProductsService, ProductImagesService],
})
export class ProductsModule {}
