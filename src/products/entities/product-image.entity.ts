import { BaseEntity } from '@/database/base.entity';
import { Product } from './product.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @Column()
  filename: string;

  @Column()
  path: string;

  @Column({ default: false })
  isMain: boolean;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
