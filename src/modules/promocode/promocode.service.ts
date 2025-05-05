// src/modules/promocode/promocode.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promocode } from './entities/promocode.entity';
import { CreatePromocodeDto } from './dto/create-promocode.dto';

@Injectable()
export class PromocodeService {
  constructor(
    @InjectRepository(Promocode)
    private promocodeRepository: Repository<Promocode>,
  ) {}

  async validateCode(code?: string): Promise<Promocode> {
    if(!code){
      return null;
    }
    const promo = await this.promocodeRepository.findOneBy({ code });

    if (!promo) return null;
    if (!promo.isActive) throw new BadRequestException('Promokod faollashtirilmagan');

    const now = new Date();

    if (promo.startDate && now < new Date(promo.startDate)) {
      throw new BadRequestException('Promokod hali kuchga kirmagan');
    }

    if (promo.endDate && now > new Date(promo.startDate)) {
      throw new BadRequestException('Promokod muddati tugagan');
    }

    return promo;
  }

  async create(dto: CreatePromocodeDto): Promise<Promocode> {
    const promocode = this.promocodeRepository.create(dto);
    return await this.promocodeRepository.save(promocode);
  }

  async remove(id: number): Promise<{ message: string }> {
    const promocode = await this.promocodeRepository.findOneBy({ id });
    if (!promocode) {
      throw new NotFoundException('Promokod topilmadi');
    }
    await this.promocodeRepository.remove(promocode);
    return { message: 'Promokod o‘chirildi' };
  }
   async getAll(){
    return await this.promocodeRepository.find()
   }


}
