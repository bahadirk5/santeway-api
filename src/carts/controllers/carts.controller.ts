import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartsService } from '../services/carts.service';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { Public } from '@/auth/decorators/public.decorator';
import { TokenAuthGuard } from '@/auth/guards/token-auth.guard';

@Controller('carts')
@UseGuards(TokenAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  getCart(@Request() req) {
    // Use user ID if authenticated, otherwise use session ID
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'];

    return this.cartsService.getCart(userId, sessionId);
  }

  @Public()
  @Post('items')
  @HttpCode(HttpStatus.OK)
  addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'];

    return this.cartsService.addToCart(addToCartDto, userId, sessionId);
  }

  @Public()
  @Patch('items/:id')
  @HttpCode(HttpStatus.OK)
  updateCartItem(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Request() req,
  ) {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'];

    return this.cartsService.updateCartItem(
      id,
      updateCartItemDto,
      userId,
      sessionId,
    );
  }

  @Public()
  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  removeCartItem(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'];

    return this.cartsService.removeCartItem(id, userId, sessionId);
  }

  @Public()
  @Delete()
  @HttpCode(HttpStatus.OK)
  clearCart(@Request() req) {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'];

    return this.cartsService.clearCart(userId, sessionId);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  mergeGuestCart(@Request() req) {
    const userId = req.user.id;
    const sessionId = req.headers['x-session-id'];

    return this.cartsService.mergeGuestCartWithUserCart(userId, sessionId);
  }
}
