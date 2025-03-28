import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductImagesService } from '../services/product-images.service';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { UserRole } from '@/users/enums/user-roles.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { FileUploadService } from '@/uploads/services/file-upload.service';

@Controller('products/:productId/images')
@UseGuards(RolesGuard)
export class ProductImagesController {
  private readonly logger = new Logger(ProductImagesController.name);

  constructor(
    private readonly productImagesService: ProductImagesService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  uploadSingle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.debug(`Uploading single image for product ${productId}`);

    if (!file) {
      this.logger.warn(`No file provided for product ${productId}`);
    } else {
      this.logger.debug(
        `File received: ${file.originalname}, ${file.size} bytes`,
      );
    }

    return this.productImagesService.createProductImage(productId, file, false);
  }

  @Post('multiple')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10))
  uploadMultiple(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.logger.debug(`Uploading multiple images for product ${productId}`);

    if (!files || files.length === 0) {
      this.logger.warn(`No files provided for product ${productId}`);
    } else {
      this.logger.debug(`Received ${files.length} files`);
    }

    return this.productImagesService.createProductImages(productId, files);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  findAll(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productImagesService.findProductImages(productId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productImagesService.removeProductImage(id);
  }

  @Post(':id/main')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  setMainImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productImagesService.setMainImage(id, productId);
  }
}
