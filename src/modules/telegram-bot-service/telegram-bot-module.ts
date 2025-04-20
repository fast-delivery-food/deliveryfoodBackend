import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AddressModule } from '../address/address.module';
import { TelegramBotService } from './telegram-bot-service';
import { ConfigModule } from '@nestjs/config';
import { ProductService } from '../product/product.service';
import { UploadImageModule } from '../upload-image/upload-image.module';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';
import { CategoryService } from '../category/category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../category/entities/category.entity';

@Module({

  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN,
     
    }),TypeOrmModule.forFeature([Category]), AddressModule,ProductModule,UploadImageModule,CategoryModule],
  providers: [TelegramBotService,ProductService,CategoryService],
})
export class TelegramBotModule { }
