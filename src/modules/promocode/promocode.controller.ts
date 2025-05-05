import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PromocodeService } from './promocode.service';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromocodeType } from './entities/promocode.entity';

@Controller('promocode')
export class PromocodeController {
  constructor(private readonly promocodeService: PromocodeService) {}

  @Post()
  @ApiOperation({ summary: 'Admin tomonidan yangi promokod yaratish' })
  @ApiResponse({ status: 201, description: 'Promokod yaratildi' })
  @ApiBody({
    schema: {
      properties: {
        code: {type: 'string',example: 'FOOD2025',description: 'Unikal promokod'},
        discountPercentage: {type: 'number', example: 20,description: 'Chegirma foizi (masalan: 20%)'},
        startDate: { type: 'string', format: 'date-time', example: '2025-04-23', description: 'Promokod kuchga kiradigan vaqt (ixtiyoriy)'},
        endDate: { type: 'string', format: 'date-time', example: '2025-05-01', description: 'Promokod muddati tugaydigan vaqt (ixtiyoriy)' },
        isActive: { type: 'boolean', example: true, description: 'Promokod aktivmi yoki yo‘qmi'},
        isSingleUse: {type: 'boolean',example: false,description: 'Promokod faqat bitta user uchun ishlatiladimi'},
        type: {type: 'enum', enum: [PromocodeType], example: PromocodeType.GLOBAL,description: 'Promokod turi: GLOBAL yoki PRODUCT_SPECIFIC'}}}
  })
  create(@Body() createPromocodeDto: CreatePromocodeDto) {
    return this.promocodeService.create(createPromocodeDto);
  }
  
  @Get()
  
  @ApiOperation({ summary: 'promokodlarni korish' })
  @ApiResponse({ status: 200, description: 'Promokod yaratildi' })
  findAll(){
    return this.promocodeService.getAll()
  }




  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promocodeService.remove(+id);
  }
}
