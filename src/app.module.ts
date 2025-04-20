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

@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      entities:[Category,Product,Address],
      synchronize: true,
      // logging: true
    }),
    CategoryModule,
    ProductModule,
    TelegramBotModule,
    AddressModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
