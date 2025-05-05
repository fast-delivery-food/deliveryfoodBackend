import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Address } from './entities/address.entity';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  async createAddress(latitude: number, longitude: number) {
    let description = '';
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      description = res.data.display_name || '';
    } catch (error) {
      console.log('❗ Geocoding xatolik:', error.message);
    }

    const address = this.addressRepository.create({
      latitude,
      longitude,
      description,
    });
    return await this.addressRepository.save(address);
  }
  async findAll(): Promise<Address[]> {
    return this.addressRepository.find();
  }
}
