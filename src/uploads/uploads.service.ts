import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

@Injectable()
export class UploadsService {
  /**
   * Multer options için helper metodu
   * @param destination Dosyaların kaydedileceği klasör yolu
   * @returns MulterOptions
   */
  getMulterOptions(destination: string): MulterOptions {
    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = destination;

          // Eğer klasör yoksa oluştur
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Dosya adını unique yap (UUID + orijinal uzantı)
          const uniqueFileName = `${uuid()}${extname(file.originalname)}`;
          cb(null, uniqueFileName);
        },
      }),
      // Filtreleme (sadece belirli tipleri kabul et)
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              'Desteklenmeyen dosya tipi. Sadece JPG, PNG ve WebP desteklenmektedir.',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max boyut
      },
    };
  }

  /**
   * Ürün resimleri için multer options
   * @param productId Ürün ID'si
   * @returns MulterOptions
   */
  getProductImageOptions(productId: string): MulterOptions {
    const destination = join(process.cwd(), 'uploads', 'products', productId);
    return this.getMulterOptions(destination);
  }
}
