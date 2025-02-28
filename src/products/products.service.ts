import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from '@/categories/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Check if product with same SKU exists
      const existingProduct = await this.productsRepository.findOne({
        where: { sku: createProductDto.sku },
      });

      if (existingProduct) {
        throw new ConflictException(
          `Product with SKU ${createProductDto.sku} already exists`,
        );
      }

      if (createProductDto.categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: createProductDto.categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `Category with ID ${createProductDto.categoryId} not found`,
          );
        }
      }

      const product = this.productsRepository.create(createProductDto);
      return await this.productsRepository.save(product);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create product');
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.productsRepository.find({
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Could not fetch products');
    }
  }

  async findOne(id: number): Promise<Product> {
    try {
      const product = await this.productsRepository.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Could not fetch product ${id}`);
    }
  }

  async update(
    id: number,
    updateProductDto: Partial<CreateProductDto>,
  ): Promise<Product> {
    try {
      // First check if product exists
      const product = await this.findOne(id);

      // If updating SKU, check if new SKU already exists
      if (updateProductDto.sku) {
        const existingProduct = await this.productsRepository.findOne({
          where: { sku: updateProductDto.sku },
        });
        if (existingProduct && existingProduct.id !== id) {
          throw new ConflictException(
            `Product with SKU ${updateProductDto.sku} already exists`,
          );
        }
      }

      if (updateProductDto.categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: updateProductDto.categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `Category with ID ${updateProductDto.categoryId} not found`,
          );
        }
      }

      Object.assign(product, updateProductDto);
      return await this.productsRepository.save(product);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(`Could not update product ${id}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const product = await this.findOne(id);
      await this.productsRepository.remove(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Could not delete product ${id}`);
    }
  }
}
