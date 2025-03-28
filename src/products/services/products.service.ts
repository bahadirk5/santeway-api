import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Category } from '../../categories/entities/category.entity';
import { ProductImagesService } from './product-images.service';

/**
 * Service responsible for product management
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private productImagesService: ProductImagesService,
  ) {}

  /**
   * Creates a new product
   * @param createProductDto Product data
   * @returns Created Product entity
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      this.logger.debug('Creating product', createProductDto);

      // Check if product with same SKU exists
      const existingProduct = await this.productsRepository.findOne({
        where: { sku: createProductDto.sku },
      });

      if (existingProduct) {
        throw new ConflictException(
          `Product with SKU ${createProductDto.sku} already exists`,
        );
      }

      // Verify category exists if provided
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

      // Create and save product
      const product = this.productsRepository.create(createProductDto);
      const savedProduct = await this.productsRepository.save(product);

      this.logger.debug('Product created successfully', {
        id: savedProduct.id,
      });

      return savedProduct;
    } catch (error) {
      this.logger.error('Failed to create product:', error.stack);

      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Could not create product: ${error.message}`,
      );
    }
  }

  /**
   * Creates a product and uploads product images
   * @param createProductDto Product data
   * @param files Uploaded image files
   * @returns Created Product entity with images
   */
  async createWithImages(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    try {
      this.logger.debug('Creating product with images', {
        productData: createProductDto,
        filesCount: files.length,
      });

      // First create the product
      const product = await this.create(createProductDto);
      this.logger.debug('Product created successfully', { id: product.id });

      // Upload images if provided
      if (files && files.length > 0) {
        this.logger.debug(
          `Uploading ${files.length} images for product ${product.id}`,
        );

        try {
          await this.productImagesService.createProductImages(
            product.id,
            files,
          );
          this.logger.debug('Images uploaded successfully');
        } catch (imageError) {
          this.logger.error(
            'Failed to upload images, but product was created:',
            imageError.stack,
          );
          // Product was created but images failed - we'll still return the product
        }
      }

      // Return the product with images
      return await this.findOne(product.id);
    } catch (error) {
      this.logger.error('Failed to create product with images:', error.stack);
      throw error; // Re-throw to maintain the original error
    }
  }

  /**
   * Retrieves all products
   * @returns Array of Product entities
   */
  async findAll(): Promise<Product[]> {
    try {
      return await this.productsRepository.find({
        order: { createdAt: 'DESC' },
        relations: ['images'],
      });
    } catch (error) {
      this.logger.error('Failed to fetch products:', error.stack);
      throw new InternalServerErrorException('Could not fetch products');
    }
  }

  /**
   * Retrieves a single product by ID
   * @param id Product UUID
   * @returns Product entity
   */
  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.productsRepository.findOne({
        where: { id },
        relations: ['images'],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return product;
    } catch (error) {
      this.logger.error(`Failed to fetch product ${id}:`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(`Could not fetch product ${id}`);
    }
  }

  /**
   * Updates a product
   * @param id Product UUID
   * @param updateProductDto Product data to update
   * @returns Updated Product entity
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
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

      // Check if category exists if updating category
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

      // Update and save
      Object.assign(product, updateProductDto);
      return await this.productsRepository.save(product);
    } catch (error) {
      this.logger.error(`Failed to update product ${id}:`, error.stack);

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Could not update product ${id}: ${error.message}`,
      );
    }
  }

  /**
   * Removes a product
   * @param id Product UUID
   */
  async remove(id: string): Promise<void> {
    try {
      const product = await this.findOne(id);
      await this.productsRepository.remove(product);
      this.logger.debug(`Product ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete product ${id}:`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Could not delete product ${id}: ${error.message}`,
      );
    }
  }
}
