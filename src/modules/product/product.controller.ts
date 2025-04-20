import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type } from 'os';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Product mahsulotini yaratish' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request: Validation error' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'peperonniy pitsa' },
        price: { type: 'integer', example: 40000 },
        description: {type: 'string',example: 'Bu mazzali mini peperonniy pitsa'},
        image: { type: 'string', format: 'binary' },
        categoryId: ({type: 'int',example:1})
      },
      required: ['name', 'price', 'description', 'image'],
    },
  })
  create(@Body() createProductDto: CreateProductDto,@UploadedFile()image: Express.Multer.File) {
    return this.productService.create(createProductDto,image);
  }

  @Get()
  @ApiOperation({summary: 'Barcha productlarni korish'})
  @ApiResponse({status: 200,description: 'Product successfully viewed'})
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @ApiOperation({summary: 'Productni ID boyicha olish'})
  @ApiResponse({status: 200,description: 'Product successfully viewed'})
  @ApiResponse({status: 404,description:'Product not found!'})
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Product mahsulotini tahrirlash' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({status: 404,description:'Product not found!'})
  @ApiResponse({ status: 400, description: 'Bad request: Validation error' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'peperonniy pitsa' },
        price: { type: 'integer', example: 40000 },
        description: {
          type: 'string',
          example: 'Bu mazzali mini peperonniy pitsa',
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto,@UploadedFile()image: Express.Multer.File) {
    return this.productService.update(+id, updateProductDto,image);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({status: 404,description:'Product not found!'})
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }

  @Get('product/:id')
  @ApiOperation({ summary: 'Productlar bo‘yicha mahsulotlarni sahifalab olish' })
  @ApiParam({ name: 'id', type: 'int', description: 'Kategoriya IDsi' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Qancha mahsulot olish kerak (default: 10)' })
  @ApiQuery({ name: 'offset', type: Number, required: false, description: 'Qaysi indexdan boshlab olish kerak (default: 0)' })
  async findByCategoryPaginated(
    @Param('id') id: number,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.productService.findByProductPaginated(+id, +limit, +offset);
  }
}
