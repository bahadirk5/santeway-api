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
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductImagesService } from '../services/product-images.service';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { UserRole } from '@/users/enums/user-roles.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { UploadsService } from '@/uploads/uploads.service';
import { join } from 'path';

@Controller('products/:productId/images')
@UseGuards(RolesGuard)
export class ProductImagesController {
  constructor(
    private readonly productImagesService: ProductImagesService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  uploadSingle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
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
