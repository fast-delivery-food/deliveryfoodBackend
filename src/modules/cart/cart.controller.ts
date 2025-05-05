import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { AddToCartDto } from "./dto/add-to-cart";
import { UpdateCartItemDto } from "./dto/update-item.cart.dto";

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add/:userId')
  @ApiOperation({ summary: 'Add product to cart' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'number', example: 42 },
        quantity: { type: 'number', example: 2, minimum: 1 },
      },
      required: ['productId', 'quantity'],
    },
  })
  addToCart(
    @Param('userId') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const { productId, quantity } = addToCartDto;
    return this.cartService.addToCart(userId, productId, quantity);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get cart for user' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  getCart(@Param('userId') userId: string) {
    return this.cartService.getCartByUser(userId);
  }

  @Patch('update/:userId')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'number', example: 42 },
        quantity: { type: 'number', example: 5 },
      },
      required: ['productId', 'quantity'],
    },
  })
  updateCartItem(
    @Param('userId') userId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const { productId, quantity } = updateCartItemDto;
    return this.cartService.updateCartItem(userId, productId, quantity);
  }

  @Delete(':userId/:productId')
  @ApiOperation({ summary: 'Remove a single item from cart' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiParam({ name: 'productId', type: Number, example: 42 })
  removeCartItem(
    @Param('userId') userId: string,
    @Param('productId') productId: number,
  ) {
    return this.cartService.removeCartItem(userId, productId);
  }

  @Delete('clear/:userId')
  @ApiOperation({ summary: 'Clear all items from user cart' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
