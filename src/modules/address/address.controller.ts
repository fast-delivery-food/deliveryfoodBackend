import { Controller, Get } from '@nestjs/common';
import { AddressService } from './address.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Address')
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  async findAll() {
    return this.addressService.findAll();
  }
}
