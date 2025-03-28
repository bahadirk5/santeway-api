import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { Category } from '@/categories/entities/category.entity';
import { ProductImagesService } from './product-images.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private productImagesService: ProductImagesService,
  ) {}

  // async create(createProductDto: CreateProductDto): Promise<Product> {
  //   try {
  //     // Check if product with same SKU exists
  //     const existingProduct = await this.productsRepository.findOne({
  //       where: { sku: createProductDto.sku },
  //     });

  //     if (existingProduct) {
  //       throw new ConflictException(
  //         `Product with SKU ${createProductDto.sku} already exists`,
  //       );
  //     }

  //     // if (createProductDto.categoryId) {
  //     //   const category = await this.categoryRepository.findOne({
  //     //     where: { id: createProductDto.categoryId },
  //     //   });

  //     //   if (!category) {
  //     //     throw new NotFoundException(
  //     //       `Category with ID ${createProductDto.categoryId} not found`,
  //     //     );
  //     //   }
  //     // }

  //     const product = this.productsRepository.create(createProductDto);
  //     return await this.productsRepository.save(product);
  //   } catch (error) {
  //     if (
  //       error instanceof ConflictException ||
  //       error instanceof NotFoundException
  //     ) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException('Could not create product');
  //   }
  // }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      console.log('Starting product creation...');

      // Check if product with same SKU exists
      console.log('Checking for existing SKU:', createProductDto.sku);
      const existingProduct = await this.productsRepository.findOne({
        where: { sku: createProductDto.sku },
      });

      if (existingProduct) {
        console.log('SKU already exists:', createProductDto.sku);
        throw new ConflictException(
          `Product with SKU ${createProductDto.sku} already exists`,
        );
      }

      // Category checking is commented out

      // Log the DTO before creating the entity
      console.log(
        'DTO before creating entity:',
        JSON.stringify(createProductDto, null, 2),
      );

      // Try to create the repository entity
      let product;
      try {
        console.log('Creating product entity');
        product = this.productsRepository.create(createProductDto);
        console.log('Product entity created successfully:', product);
      } catch (entityError) {
        console.error('Error creating entity:', entityError);
        throw entityError;
      }

      // Try to save to database
      try {
        console.log('Saving product to database');
        const savedProduct = await this.productsRepository.save(product);
        console.log('Product saved successfully:', savedProduct);
        return savedProduct;
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Log additional details about the error
        if (dbError.code) {
          console.error('DB Error Code:', dbError.code);
        }
        if (dbError.detail) {
          console.error('DB Error Detail:', dbError.detail);
        }
        if (dbError.constraint) {
          console.error('DB Constraint:', dbError.constraint);
        }
        if (dbError.parameters) {
          console.error('DB Parameters:', dbError.parameters);
        }
        if (dbError.query) {
          console.error('DB Query:', dbError.query);
        }
        throw dbError;
      }
    } catch (error) {
      console.error('Error in create product:', error);

      // Log the full error and stack trace
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // Pass the original error message to make debugging easier
      throw new InternalServerErrorException(
        `Could not create product: ${error.message}`,
      );
    }
  }

  // Yeni metot: Ürün oluştur ve resimlerini yükle
  async createWithImages(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    try {
      // Debug log
      console.log('Creating product with data:', createProductDto);
      console.log('Files received:', files.length);

      // Önce ürünü oluştur
      const product = await this.create(createProductDto);
      console.log('Product created:', product.id);

      // Resim varsa, resimleri yükle
      if (files && files.length > 0) {
        console.log('Uploading images for product:', product.id);
        await this.productImagesService.createProductImages(product.id, files);
        console.log('Images uploaded successfully');
      }

      // Resimleriyle birlikte ürünü getir
      return await this.findOne(product.id);
    } catch (error) {
      console.error('Error in createWithImages:', error);
      if (error instanceof Error) {
        console.error(error.stack); // Stack trace yazdır
      }
      throw error;
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.productsRepository.find({
        order: { createdAt: 'DESC' },
        relations: ['images'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Could not fetch products');
    }
  }

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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Could not fetch product ${id}`);
    }
  }

  async update(
    id: string,
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

  async remove(id: string): Promise<void> {
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
