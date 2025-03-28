import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ProductsService } from '@/products/services/products.service';
import { OrderStatus } from '../enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private productsService: ProductsService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    try {
      // Calculate total amount and validate products and check stok
      let totalAmount = 0;
      for (const item of createOrderDto.items) {
        const product = await this.productsService.findOne(item.productId);
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for product ${product.name}`,
          );
        }
        totalAmount += product.price * item.quantity;
      }

      // Create order
      const order = this.ordersRepository.create({
        userId,
        status: OrderStatus.PENDING,
        totalAmount,
      });
      await this.ordersRepository.save(order);

      // Update stock and create order items
      for (const item of createOrderDto.items) {
        const product = await this.productsService.findOne(item.productId);

        // Update stock
        await this.productsService.update(item.productId, {
          stock: product.stock - item.quantity,
        });

        // Create order item
        await this.orderItemsRepository.save({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });
      }

      return order;
    } catch (error) {
      console.error('Order creation error:', error);
      throw new InternalServerErrorException(
        error.message || 'Could not create order',
      );
    }
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: {
        user: true,
      },
      select: {
        user: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: {
        user: true,
      },
      select: {
        user: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    return this.ordersRepository.save(order);
  }
}
