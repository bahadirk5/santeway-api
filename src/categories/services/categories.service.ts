import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto } from '../dto/create-category.dto';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const slug =
      createCategoryDto.slug ||
      slugify(createCategoryDto.name, { lower: true });

    const existingCategory = await this.categoriesRepository.findOne({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with slug ${slug} already exists`);
    }

    if (createCategoryDto.parentId) {
      const parent = await this.categoriesRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${createCategoryDto.parentId} not found`,
        );
      }
    }

    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug,
    });

    return this.categoriesRepository.save(category);
  }

  async getTree(): Promise<Category[]> {
    const allCategories = await this.categoriesRepository.find();
    const rootCategories = allCategories.filter((cat) => !cat.parentId);

    const buildTree = (categories: Category[], parent: Category = null) => {
      const children = categories
        .filter((cat) => cat.parentId === (parent?.id || null))
        .map((child) => ({
          ...child,
          children: buildTree(categories, child),
        }));

      return children;
    };

    return buildTree(allCategories);
  }
}
