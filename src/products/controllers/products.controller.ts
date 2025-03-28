import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  UploadedFiles,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Public } from '@/auth/decorators/public.decorator';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { UserRole } from '@/users/enums/user-roles.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '@/uploads/services/file-upload.service';

@Controller('products')
@UseGuards(RolesGuard)
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    this.logger.debug('Creating new product with images', {
      dto: createProductDto,
      filesCount: files.length,
    });

    if (files.length > 0) {
      this.logger.debug(
        'Files info',
        files.map((f) => ({
          originalname: f.originalname,
          size: f.size,
          mimetype: f.mimetype,
        })),
      );
    }

    return this.productsService.createWithImages(createProductDto, files);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
