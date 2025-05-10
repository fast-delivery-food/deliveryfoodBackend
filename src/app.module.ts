import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './modules/category/entities/category.entity';
import { CategoryModule } from './modules/category/category.module';
import { Product } from './modules/product/entities/product.entity';
import { ProductModule } from './modules/product/product.module';
import { TelegramBotModule } from './modules/telegram-bot-service/telegram-bot-module';
import { AddressModule } from './modules/address/address.module';
import { Address } from './modules/address/entities/address.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { User } from './modules/user/entities/user.entity';
import { PromocodeModule } from './modules/promocode/promocode.module';
import { CartModule } from './modules/cart/cart.module';
import { Promocode } from './modules/promocode/entities/promocode.entity';
import { Cart } from './modules/cart/entities/cart.entity';
import { OrdersModule } from './modules/orders/orders.module';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/order-items/entities/order-item.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InfoModule } from './modules/info/info.module';
import { Info } from './modules/info/entities/info.entity';

@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      entities:[Category,Product,Address,User,Promocode,Cart,Order,OrderItem,Info],
      synchronize: true,
      // logging: true
    }),
    EventEmitterModule.forRoot(),
    CategoryModule,
    ProductModule,
    TelegramBotModule,
    AddressModule,
    AuthModule,
    UserModule,
    PromocodeModule,
    CartModule,
    OrdersModule,
    InfoModule


  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
