import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from '../cart-item/entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { Promocode } from '../promocode/entities/promocode.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Cart,CartItem,Product,User,Promocode])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService]
})
export class CartModule {}
