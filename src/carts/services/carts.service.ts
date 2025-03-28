import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductsService } from '@/products/services/products.service';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CartResponseDto, CartItemResponseDto } from '../dto/cart-response.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart> {
    try {
      let cart: Cart;

      // Find cart by userId or sessionId
      if (userId) {
        cart = await this.cartsRepository.findOne({
          where: { userId },
          relations: ['items', 'items.product'],
        });
      } else if (sessionId) {
        cart = await this.cartsRepository.findOne({
          where: { sessionId },
          relations: ['items', 'items.product'],
        });
      }

      // If cart doesn't exist, create a new one
      if (!cart) {
        cart = this.cartsRepository.create({
          userId,
          sessionId,
          items: [],
        });
        await this.cartsRepository.save(cart);
      }

      return cart;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get or create cart');
    }
  }

  async getCart(userId?: string, sessionId?: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId, sessionId);
    return this.mapCartToResponse(cart);
  }

  async addToCart(
    addToCartDto: AddToCartDto,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResponseDto> {
    try {
      const { productId, quantity } = addToCartDto;

      // Validate product exists and has enough stock
      const product = await this.productsService.findOne(productId);
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}`,
        );
      }

      // Get or create cart
      const cart = await this.getOrCreateCart(userId, sessionId);

      // Check if product already exists in cart
      let cartItem = cart.items.find((item) => item.productId === productId);

      if (cartItem) {
        // Update quantity if product already in cart
        cartItem.quantity += quantity;
        await this.cartItemsRepository.save(cartItem);
      } else {
        // Create new cart item
        cartItem = this.cartItemsRepository.create({
          cartId: cart.id,
          productId,
          quantity,
        });
        await this.cartItemsRepository.save(cartItem);
        // Add to cart.items array
        cart.items.push(cartItem);
      }

      // Reload cart with updated items
      const updatedCart = await this.cartsRepository.findOne({
        where: { id: cart.id },
        relations: ['items', 'items.product'],
      });

      return this.mapCartToResponse(updatedCart);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add item to cart');
    }
  }

  async updateCartItem(
    cartItemId: string,
    updateCartItemDto: UpdateCartItemDto,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResponseDto> {
    try {
      // Get cart first
      const cart = await this.getOrCreateCart(userId, sessionId);

      // Find cart item
      const cartItem = await this.cartItemsRepository.findOne({
        where: { id: cartItemId, cartId: cart.id },
        relations: ['product'],
      });

      if (!cartItem) {
        throw new NotFoundException(
          `Cart item with ID ${cartItemId} not found`,
        );
      }

      // Check if enough stock
      if (cartItem.product.stock < updateCartItemDto.quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${cartItem.product.name}`,
        );
      }

      // Update quantity
      cartItem.quantity = updateCartItemDto.quantity;
      await this.cartItemsRepository.save(cartItem);

      // Reload cart with updated items
      const updatedCart = await this.cartsRepository.findOne({
        where: { id: cart.id },
        relations: ['items', 'items.product'],
      });

      return this.mapCartToResponse(updatedCart);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update cart item');
    }
  }

  async removeCartItem(
    cartItemId: string,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResponseDto> {
    try {
      // Get cart first
      const cart = await this.getOrCreateCart(userId, sessionId);

      // Find cart item
      const cartItem = await this.cartItemsRepository.findOne({
        where: { id: cartItemId, cartId: cart.id },
      });

      if (!cartItem) {
        throw new NotFoundException(
          `Cart item with ID ${cartItemId} not found`,
        );
      }

      // Remove cart item
      await this.cartItemsRepository.remove(cartItem);

      // Reload cart with updated items
      const updatedCart = await this.cartsRepository.findOne({
        where: { id: cart.id },
        relations: ['items', 'items.product'],
      });

      return this.mapCartToResponse(updatedCart);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove cart item');
    }
  }

  async clearCart(
    userId?: string,
    sessionId?: string,
  ): Promise<CartResponseDto> {
    try {
      const cart = await this.getOrCreateCart(userId, sessionId);

      // Remove all items from cart
      await this.cartItemsRepository.delete({ cartId: cart.id });

      // Return empty cart
      const emptyCart = await this.cartsRepository.findOne({
        where: { id: cart.id },
        relations: ['items'],
      });

      return this.mapCartToResponse(emptyCart);
    } catch (error) {
      throw new InternalServerErrorException('Failed to clear cart');
    }
  }

  async mergeGuestCartWithUserCart(
    userId: string,
    sessionId: string,
  ): Promise<CartResponseDto> {
    try {
      const userCart = await this.getOrCreateCart(userId);
      const guestCart = await this.cartsRepository.findOne({
        where: { sessionId },
        relations: ['items', 'items.product'],
      });

      if (!guestCart || !guestCart.items.length) {
        return this.mapCartToResponse(userCart);
      }

      // Transfer items from guest cart to user cart
      for (const item of guestCart.items) {
        await this.addToCart(
          {
            productId: item.productId,
            quantity: item.quantity,
          },
          userId,
        );
      }

      // Delete guest cart
      await this.cartsRepository.remove(guestCart);

      // Return updated user cart
      const updatedUserCart = await this.cartsRepository.findOne({
        where: { userId },
        relations: ['items', 'items.product'],
      });

      return this.mapCartToResponse(updatedUserCart);
    } catch (error) {
      throw new InternalServerErrorException('Failed to merge carts');
    }
  }

  private mapCartToResponse(cart: Cart): CartResponseDto {
    if (!cart) {
      return {
        id: null,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      };
    }

    // Map cart items to response DTOs
    const itemsResponse: CartItemResponseDto[] = cart.items.map((item) => {
      const price = item.product?.price || 0;
      const subtotal = price * item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product?.id,
          name: item.product?.name,
          price: item.product?.price,
          sku: item.product?.sku,
        },
        quantity: item.quantity,
        price,
        subtotal,
      };
    });

    // Calculate totals
    const totalItems = itemsResponse.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const totalAmount = itemsResponse.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    return {
      id: cart.id,
      items: itemsResponse,
      totalItems,
      totalAmount,
    };
  }
}
