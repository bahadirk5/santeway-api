import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuid } from 'uuid';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';

/**
 * Service responsible for all file upload operations
 * Following Single Responsibility Principle - only handles file upload concerns
 */
@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  /**
   * Creates multer options for product image uploads
   * @param productId UUID of the product
   * @returns MulterOptions configured for product images
   */
  getProductImageOptions(productId: string): MulterOptions {
    const destination = join(process.cwd(), 'uploads', 'products', productId);
    return this.createMulterOptions(destination);
  }

  /**
   * Creates general multer options for any upload
   * @param destination The directory where files will be saved
   * @returns MulterOptions object
   */
  createMulterOptions(destination: string): MulterOptions {
    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          this.ensureDirectoryExists(destination);
          cb(null, destination);
        },
        filename: (req, file, cb) => {
          const uniqueFilename = this.generateUniqueFilename(file.originalname);
          cb(null, uniqueFilename);
        },
      }),
      fileFilter: this.imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max size
      },
    };
  }

  /**
   * Ensures a directory exists, creating it if necessary
   * @param directory Directory path to check/create
   */
  ensureDirectoryExists(directory: string): void {
    try {
      if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
        this.logger.log(`Created directory: ${directory}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create directory ${directory}:`,
        error.stack,
      );
      throw new Error(`Failed to create upload directory: ${error.message}`);
    }
  }

  /**
   * Generates a unique filename
   * @param originalFilename The original file name
   * @returns A unique filename with the original extension
   */
  generateUniqueFilename(originalFilename: string): string {
    return `${uuid()}${extname(originalFilename)}`;
  }

  /**
   * Filter to only allow image files
   * @param req The HTTP request
   * @param file The uploaded file
   * @param callback Callback function
   */
  imageFileFilter(
    req: any,
    file: Express.Multer.File,
    callback: Function,
  ): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Unsupported file type. Only JPG, PNG and WebP formats are supported.',
        ),
        false,
      );
    }

    callback(null, true);
  }

  /**
   * Validates an uploaded file has required properties
   * @param file The file to validate
   * @returns boolean indicating if the file is valid
   */
  validateUploadedFile(file: Express.Multer.File): boolean {
    if (!file || !file.filename || !file.path) {
      this.logger.warn('Invalid file metadata', file);
      return false;
    }
    return true;
  }

  /**
   * Normalizes a file path (handles Windows/Unix differences)
   * @param path The path to normalize
   * @returns Normalized path
   */
  normalizePath(path: string): string {
    return path.replace(/\\/g, '/');
  }
}
