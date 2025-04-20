import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({summary: 'Category yaratish'})
  @ApiResponse({status: 201,description: 'Category succesfully created'})
  @ApiResponse({status:400,description: 'Bad request: Validation error!'})
  @ApiBody({
    schema:{
      properties: {
        name: {type: 'varchar',example:'Shirinliklar'}
      }
    }
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({summary:'Barcha categorylarni olish'})
  @ApiResponse({status:200,description: 'categories succesfully viewed'})
  @ApiResponse({status:404,description: 'Category not found yet'})
 
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({summary:'Categoryni id boyicha olish'})
  @ApiResponse({status:200,description: 'category succesfully viewed'})
  @ApiResponse({status:404,description: 'Category not found'})
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({summary: 'Category tahrirlash'})
  @ApiResponse({status: 201,description: 'Category succesfully updated'})
  @ApiResponse({status:400,description: 'Bad request: Validation error!'})
  @ApiResponse({status:404,description: 'Category not found'})
  @ApiBody({
    schema:{
      properties: {
        name: {type: 'varchar',example:'Shirinliklar'}
      }
    }
  })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Kategoriya bo‘yicha mahsulotlarni sahifalab olish' })
  @ApiParam({ name: 'id', type: Number, description: 'Kategoriya IDsi' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Qancha mahsulot olish kerak (default: 10)' })
  @ApiQuery({ name: 'offset', type: Number, required: false, description: 'Qaysi indexdan boshlab olish kerak (default: 0)' })
  async findByCategoryPaginated(
    @Param('id') id: number,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.categoryService.findByCategoryPaginated(+id, +limit, +offset);
  }
}
