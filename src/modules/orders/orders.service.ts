import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { Address } from '../address/entities/address.entity';
import { Order } from './entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { plainToInstance } from 'class-transformer';
import { CartService } from '../cart/cart.service';
import { PromocodeService } from '../promocode/promocode.service';
import { OrderStatus } from 'src/utils/order-status';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly cartService: CartService,
    private readonly promocodeService: PromocodeService,
    private readonly eventEmitter: EventEmitter2


  ) {}
  
async generateOrderNumber(): Promise<string> {
  const today = new Date();
  
  // Sana qismi: 20250426 formatda
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const countToday = await this.orderRepo.count({
    where: {
      createdAt: Between(todayStart, todayEnd),
    },
  });

  const orderSequence = (countToday + 1).toString().padStart(3, '0'); 
  //quyidagidek raqamlanadi order number: 1 => 001, 10 => 010, 100 => 100 

  const orderNumber = `${datePart}-${orderSequence}`;

  return orderNumber;
}

  async createOrder(user: User, phoneNumber: string, address: Address, promocodeCode?: string){
    let cart = await this.cartService.getOrCreateCart(user.telegramId);
  
    let promocode = null;
    if (promocodeCode) {
      promocode = await this.promocodeService.validateCode(promocodeCode);
    }
  
    let totalPrice = cart.items.reduce((sum, cartItem) => {
      const productPrice = cartItem.product ? cartItem.product.price : 0;
      return sum + productPrice * cartItem.quantity;
    }, 0);
  
    if (promocode) {
      totalPrice = totalPrice * (1 - promocode.discountPercentage / 100);
    }
  
    const orderItems: OrderItem[] = [];
    for (const cartItem of cart.items) {
      const product = await this.productRepo.findOne({ where: { id: cartItem.product.id } });
      if (!product) continue;
  
      const orderItem = this.itemRepo.create({
        product,
        quantity: cartItem.quantity,
        price: product.price * cartItem.quantity, 
      });
  
      orderItems.push(orderItem);
    }
  
    const orderNumber = await this.generateOrderNumber()
    const order = this.orderRepo.create({
      user,
      phoneNumber,
      address,
      items: orderItems,
      totalPrice, 
      promocode: promocode || null, 
      order_number: orderNumber
    });
  
    await this.orderRepo.save(order); 
  
    return order; 
  }
  
  

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { user: { telegramId: userId } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['user', 'items', 'items.product', 'address'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const order = await this.orderRepo.findOne({ where: { id } });
  
    if (!order) {
      throw new Error('Buyurtma topilmadi');
    }
  
    await this.orderRepo.remove(order);
  
    return { message: 'Buyurtma muvaffaqiyatli o‘chirildi' };
  }


  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['user'] });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }
  
    order.status = status;
    
    const updatedOrder = await this.orderRepo.save(order);
    
    this.eventEmitter.emit('order.status.updated', updatedOrder);
    return updatedOrder;
  }
  

  
}
