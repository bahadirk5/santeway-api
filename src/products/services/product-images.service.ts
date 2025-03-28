import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  /**
   * Ürün resmi oluştur
   */
  async createProductImage(
    productId: string,
    file: Express.Multer.File,
    isMain: boolean = false,
  ): Promise<ProductImage> {
    try {
      // Ürünün var olup olmadığını kontrol et
      const product = await this.productsRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`ID'si ${productId} olan ürün bulunamadı`);
      }

      // Eğer yeni resim main olarak işaretlenmişse, diğer main resimleri false yap
      if (isMain) {
        await this.productImagesRepository.update(
          { productId, isMain: true },
          { isMain: false },
        );
      }

      // Yeni resmi kaydet
      const productImage = this.productImagesRepository.create({
        filename: file.filename,
        path: file.path.replace(/\\/g, '/'), // Windows için path düzenlemesi
        isMain,
        productId,
      });

      return await this.productImagesRepository.save(productImage);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Resim yüklenemedi');
    }
  }

  /**
   * Toplu resim oluşturma
   */
  async createProductImages(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<ProductImage[]> {
    try {
      // Debug için eklenen loglar
      console.log(`Creating images for product: ${productId}`);
      console.log(`Number of files: ${files.length}`);
      console.log(
        'Files info:',
        files.map((f) => ({
          name: f.filename,
          path: f.path,
          size: f.size,
          mimetype: f.mimetype,
        })),
      );

      // İlk resim ana resim olacak, diğerleri normal resim
      return await Promise.all(
        files.map((file, index) => {
          try {
            return this.createProductImage(productId, file, index === 0);
          } catch (error) {
            console.error(
              `Error creating image ${index} for product ${productId}:`,
              error,
            );
            throw error;
          }
        }),
      );
    } catch (error) {
      console.error('Error in createProductImages:', error);
      if (error.code) console.error('Error code:', error.code);
      if (error.path) console.error('Error path:', error.path);
      throw new InternalServerErrorException('Resimler yüklenemedi');
    }
  }

  /**
   * Ürüne ait tüm resimleri getir
   */
  async findProductImages(productId: string): Promise<ProductImage[]> {
    try {
      // Önce ürünün var olup olmadığını kontrol et
      const product = await this.productsRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`ID'si ${productId} olan ürün bulunamadı`);
      }

      return await this.productImagesRepository.find({
        where: { productId },
        order: { isMain: 'DESC', createdAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Ürün resimleri getirilemedi');
    }
  }

  /**
   * Belirli bir resmi sil
   */
  async removeProductImage(id: string): Promise<void> {
    try {
      const image = await this.productImagesRepository.findOne({
        where: { id },
      });
      if (!image) {
        throw new NotFoundException(`ID'si ${id} olan resim bulunamadı`);
      }

      await this.productImagesRepository.remove(image);

      // NOT: Fiziksel dosyanın da silinmesi için fs.unlink kullanılabilir
      // Bu örnekte sadece DB kaydını siliyoruz
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Resim silinemedi');
    }
  }

  /**
   * Ana resmi ayarla
   */
  async setMainImage(id: string, productId: string): Promise<ProductImage> {
    try {
      // Önce belirtilen resmin var olduğunu kontrol et
      const image = await this.productImagesRepository.findOne({
        where: { id, productId },
      });

      if (!image) {
        throw new NotFoundException(`ID'si ${id} olan resim bulunamadı`);
      }

      // Diğer main resimleri false yap
      await this.productImagesRepository.update(
        { productId, isMain: true },
        { isMain: false },
      );

      // Bu resmi main olarak ayarla
      image.isMain = true;
      return await this.productImagesRepository.save(image);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Ana resim ayarlanamadı');
    }
  }
}
