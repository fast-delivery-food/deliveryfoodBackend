import { Module } from '@nestjs/common';
import { PromocodeService } from './promocode.service';
import { PromocodeController } from './promocode.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promocode } from './entities/promocode.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Promocode])],
  controllers: [PromocodeController],
  providers: [PromocodeService],
  exports: [PromocodeService]
})
export class PromocodeModule {}
