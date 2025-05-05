import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AddressModule } from '../address/address.module';
import { TelegramBotService } from './telegram-bot-service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductService } from '../product/product.service';
import { UploadImageModule } from '../upload-image/upload-image.module';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';
import { CategoryService } from '../category/category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../category/entities/category.entity';
import { CartService } from '../cart/cart.service';
import { CartItemService } from '../cart-item/cart-item.service';
import { UserService } from '../user/user.service';
import { PromocodeService } from '../promocode/promocode.service';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart-item/entities/cart-item.entity';
import { User } from '../user/entities/user.entity';
import { Promocode } from '../promocode/entities/promocode.entity';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/client/redis.service';
import { Telegraf, session } from 'telegraf';
import { PromocodeModule } from '../promocode/promocode.module';
import { Address } from '../address/entities/address.entity';
import { AddressService } from '../address/address.service';
import { Order } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { OrderService } from '../orders/orders.service';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { InfoModule } from '../info/info.module';
import { InfoService } from '../info/info.service';
import { Info } from '../info/entities/info.entity';

@Module({

  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN'),
        middlewares: [session()],
      }),
      inject: [ConfigService],
    }),TypeOrmModule.forFeature([Category,Cart,Info,CartItem,User,Promocode,JwtService,Address,Order,OrderItem]), OrdersModule, InfoModule,AddressModule,ProductModule,UploadImageModule,CategoryModule,AuthModule,UserModule,PromocodeModule],
  providers: [TelegramBotService,ProductService,AddressService,CategoryService,CartService,OrderService, JwtService,InfoService,RedisService,CartItemService,UserService,PromocodeService,AuthService,Telegraf],
})
export class TelegramBotModule { }
