import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import ExceptionHandlerFilter from './filter/exception.filter';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT

  const config = new DocumentBuilder()
    .setTitle('Fast delivery food')
    .setDescription('Telegram messenjeri orqali mijozlarga taomlarni buyurtma qilish va yetkazib berish jarayonini  avtomatlashtirish, foydalanuvchilarga shaxsiy profil, promokodlar va real vaqtli buyurtma statusini taqdim etish, shuningdek, admin panel orqali barcha jarayonlarni boshqarish imkoniyatini yaratish.')
    .setVersion('1.0')
    .addBearerAuth({type: 'http',scheme: 'bearer'})
    .build()
    app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

    const document  = SwaggerModule.createDocument(app,config)
    SwaggerModule.setup('/api/docs',app,document)
    app.useGlobalPipes(new ValidationPipe({transform: true,whitelist: true}))
    app.useGlobalFilters(new ExceptionHandlerFilter())
  await app.listen(PORT,()=> console.log(`Server run on port: ${PORT}`));
}
bootstrap();
