import { Controller, Get, Post, Body, Param, Delete, NotFoundException, Patch } from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrderCreateDto } from './dto/create-order.dto';
import { UserService } from '../user/user.service';
import { CartService } from '../cart/cart.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { OrderStatus } from 'src/utils/order-status';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrderService,
    private readonly userService: UserService,
    private readonly cartService: CartService,
    @InjectRepository(User) private userRepository: Repository<User>
  ) { }
  async create(@Body() createOrderDto: OrderCreateDto) {
    const { phoneNumber, address, promocodeCode, user } = createOrderDto;

    const userm = await this.findUserByTelegramId(user);  

    if (!userm) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const order = await this.ordersService.createOrder(userm, phoneNumber, address, promocodeCode);

    return order;
  }

  private async findUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return await this.userService.findByUserId(telegramId); 
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: "sucess" })
  findAll() {
    return this.ordersService.getAllOrders();
  }

  @Get('user/:telegramId')
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: "sucess" })
  getUserOrders(@Param('telegramId') telegramId: string) {
    return this.ordersService.getUserOrders(telegramId);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.ordersService.remove(+id); // Quyida remove methodini yozamiz
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status by ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Order ID (primary key)',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [OrderStatus],
          example: OrderStatus.PREPARING,
          description: 'Order statusni yangilash',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id') id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateOrderStatus(id, status);
  }

}
