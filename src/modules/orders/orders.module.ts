import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrderService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { Order } from './entities/order.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { CartService } from '../cart/cart.service';
import { CartModule } from '../cart/cart.module';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart-item/entities/cart-item.entity';
import { Promocode } from '../promocode/entities/promocode.entity';
import { PromocodeService } from '../promocode/promocode.service';
import { PromocodeModule } from '../promocode/promocode.module';

@Module({
  imports:[TypeOrmModule.forFeature([Order,OrderItem,Product,User,Cart,CartItem,Promocode]),UserModule,PromocodeModule,CartModule],
  controllers: [OrdersController],
  providers: [OrderService,UserService,CartService,PromocodeService],
})
export class OrdersModule {}
