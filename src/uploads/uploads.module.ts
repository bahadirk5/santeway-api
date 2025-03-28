import { Module } from '@nestjs/common';
import { FileUploadService } from './services/file-upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';

@Module({
  imports: [
    // Register MulterModule with default configuration
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueFileName = `${uuid()}${extname(file.originalname)}`;
          cb(null, uniqueFileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              'Unsupported file type. Only JPG, PNG and WebP formats are supported.',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max size
      },
    }),
  ],
  providers: [FileUploadService],
  exports: [FileUploadService, MulterModule],
})
export class UploadsModule {}
