import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { InfoService } from './info.service';
import { CreateInfoDto } from './dto/create-info.dto';
import { UpdateInfoDto } from './dto/update-info.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Contact Info')
@Controller('info')
export class InfoController {
  constructor(private readonly infoService: InfoService) {}

  @Post()
  @ApiOperation({ summary: 'Contact ma’lumot yaratish' })
  @ApiResponse({ status: 201, description: ' Contact successfully created' })
  @ApiBody({
    description: 'Yangi contact ma’lumotlari',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Fast Delivery LLC' },
        address: { type: 'string', example: 'Yunusobod, Toshkent' },
        phone: { type: 'string', example: '+998901234567' },
        description: { type: 'string', example: '24/7 xizmat' },
      },
      required: ['name', 'address', 'phone'],
    },
  })
  create(@Body() createInfoDto: CreateInfoDto) {
    return this.infoService.create(createInfoDto);
  }

  @Get()
  @ApiOperation({ summary: ' Barcha contact info' })
  @ApiResponse({ status: 200, description: 'All contacts' })
  findAll() {
    return this.infoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: ' ID bo‘yicha bitta contact info olish' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'success',
  })
  @ApiResponse({
    status: 404,
    description: ' Contact info not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.infoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Contact info yangilash' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ status: 200, description: 'Contact info yangilandi' })
  @ApiBody({
    description: 'Yangilanishi kerak bo‘lgan qiymatlar',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'New Name' },
        address: { type: 'string', example: 'Yangi manzil' },
        phone: { type: 'string', example: '+998911234567' },
        description: { type: 'string', example: 'Yangi ta’rif' },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInfoDto: UpdateInfoDto,
  ) {
    return this.infoService.update(id, updateInfoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '🗑 Contact info o‘chirish' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ status: 200, description: 'Contact info o‘chirildi' })
  @ApiResponse({ status: 404, description: 'Contact info topilmadi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.infoService.remove(id);
  }
}
