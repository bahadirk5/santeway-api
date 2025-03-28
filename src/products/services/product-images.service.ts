import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/product.entity';
import { FileUploadService } from '../../uploads/services/file-upload.service';

/**
 * Service responsible for product image management
 * Single Responsibility: Manages the product images database records
 */
@Injectable()
export class ProductImagesService {
  private readonly logger = new Logger(ProductImagesService.name);

  constructor(
    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private fileUploadService: FileUploadService,
  ) {}

  /**
   * Creates a product image record
   * @param productId UUID of the product
   * @param file Uploaded file information
   * @param isMain Whether this is the main product image
   * @returns Created ProductImage entity
   */
  async createProductImage(
    productId: string,
    file: Express.Multer.File,
    isMain: boolean = false,
  ): Promise<ProductImage> {
    try {
      this.logger.debug(`Creating image for product ${productId}`, {
        filename: file.filename,
        path: file.path,
        size: file.size,
      });

      // Validate file has required properties
      if (!this.fileUploadService.validateUploadedFile(file)) {
        throw new BadRequestException('Invalid file data');
      }

      // Verify product exists
      const product = await this.productsRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // If this is the main image, update existing main images
      if (isMain) {
        await this.productImagesRepository.update(
          { productId, isMain: true },
          { isMain: false },
        );
      }

      // Create product image record
      const productImage = this.productImagesRepository.create({
        filename: file.filename,
        path: this.fileUploadService.normalizePath(file.path),
        isMain,
        productId,
      });

      // Save to database
      const savedImage = await this.productImagesRepository.save(productImage);
      this.logger.debug(`Saved product image to database`, savedImage);

      return savedImage;
    } catch (error) {
      this.logger.error(
        `Failed to create product image for product ${productId}:`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Could not save product image: ${error.message}`,
      );
    }
  }

  /**
   * Creates multiple product images at once
   * @param productId UUID of the product
   * @param files Array of uploaded files
   * @returns Array of created ProductImage entities
   */
  async createProductImages(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<ProductImage[]> {
    try {
      this.logger.debug(
        `Creating ${files.length} images for product ${productId}`,
      );

      // Validate we have files to process
      if (!files || files.length === 0) {
        return [];
      }

      // Process each file, making the first one the main image
      const results = await Promise.all(
        files.map((file, index) =>
          this.createProductImage(productId, file, index === 0),
        ),
      );

      this.logger.debug(
        `Successfully created ${results.length} images for product ${productId}`,
      );
      return results;
    } catch (error) {
      this.logger.error(`Failed to create product images:`, error.stack);
      throw new InternalServerErrorException('Failed to upload images');
    }
  }

  /**
   * Retrieves all images for a product
   * @param productId UUID of the product
   * @returns Array of ProductImage entities
   */
  async findProductImages(productId: string): Promise<ProductImage[]> {
    try {
      // Verify product exists
      const product = await this.productsRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      return await this.productImagesRepository.find({
        where: { productId },
        order: { isMain: 'DESC', createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to retrieve product images for product ${productId}:`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to retrieve product images',
      );
    }
  }

  /**
   * Removes a product image
   * @param id UUID of the image to remove
   */
  async removeProductImage(id: string): Promise<void> {
    try {
      const image = await this.productImagesRepository.findOne({
        where: { id },
      });

      if (!image) {
        throw new NotFoundException(`Image with ID ${id} not found`);
      }

      await this.productImagesRepository.remove(image);

      // Note: Physical file deletion could be implemented here
      // using fs.unlink or similar
    } catch (error) {
      this.logger.error(`Failed to remove product image ${id}:`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to delete image: ${error.message}`,
      );
    }
  }

  /**
   * Sets an image as the main product image
   * @param id UUID of the image to set as main
   * @param productId UUID of the product
   * @returns Updated ProductImage entity
   */
  async setMainImage(id: string, productId: string): Promise<ProductImage> {
    try {
      // Verify the image exists for this product
      const image = await this.productImagesRepository.findOne({
        where: { id, productId },
      });

      if (!image) {
        throw new NotFoundException(
          `Image with ID ${id} not found for product ${productId}`,
        );
      }

      // Reset all main images for this product
      await this.productImagesRepository.update(
        { productId, isMain: true },
        { isMain: false },
      );

      // Set this image as main
      image.isMain = true;
      return await this.productImagesRepository.save(image);
    } catch (error) {
      this.logger.error(
        `Failed to set main image ${id} for product ${productId}:`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to set main image: ${error.message}`,
      );
    }
  }
}
