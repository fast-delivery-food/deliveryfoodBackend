import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(@InjectRepository(Category)private categoryRepository: Repository<Category>){}
  async create(createCategoryDto: CreateCategoryDto){
    const created = this.categoryRepository.create(createCategoryDto)

    return await this.categoryRepository.save(created)
  }

  async findAll() {
    return await this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'product') 
      .select([
        'category.id', 'category.name',

        'product.name',  'product.image', 
      ])
      .getMany();
  }

  async findOne(id: number) {
    const findone = await this.categoryRepository.findOne({where:{id}})
    if(!findone){
      throw new NotFoundException(`Category ID with ${findone} notfound`)
    }
    return findone;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const findOne = await this.categoryRepository.findOne({where:{id}})
    if(!findOne){
      throw new NotFoundException(`Category ID with ${findOne} notfound`)
    }
    const updated = Object.assign(findOne,updateCategoryDto)
    return await this.categoryRepository.save(updated);
  }

  async remove(id: number) {
    const findOne = await this.categoryRepository.findOne({where:{id}})
    if(!findOne){
      throw new NotFoundException(`Category ID with ${findOne} notfound`)
    }
    await this.categoryRepository.remove(findOne)
    return {message: 'Category sucessfully deleted'};
  }
  async findByCategoryPaginated(categoryId: number, limit: number, offset: number) {
    return this.categoryRepository.find({
      where: { id:categoryId },
      relations:['product'],
      take:limit,
      skip: offset,
    });
  }
}
