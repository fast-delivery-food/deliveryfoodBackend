import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { UploadService } from '../upload-image/upload-image.service';
import { Product } from './entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports :[TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService,UploadService],
  exports:[ProductService,TypeOrmModule]
})
export class ProductModule {}
