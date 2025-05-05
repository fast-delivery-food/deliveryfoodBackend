import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ILike, Repository } from 'typeorm';
import { UploadService } from '../upload-image/upload-image.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)private productRepository: Repository<Product>,
    private  uploadService: UploadService
  ){}
  async create(createProductDto: CreateProductDto,image: Express.Multer.File) {
    const uploadImage = await this.uploadService.uploadFile({
      file: image,
      destination: 'uploads'
    })
    const created = this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      image: uploadImage.imageUrl,
      category:{id:createProductDto.categoryId}
    })

    return await this.productRepository.save(created);
  }

  async findAll() {
    return await this.productRepository.find();
  }

  async findOne(id: number) {
    const findOne = await this.productRepository.findOne({where:{id}})
    if(!findOne){
      throw new NotFoundException(`Product ID with ${findOne} not found`)

    }
    return findOne;
  }

  async update(id: number, updateProductDto: UpdateProductDto,image: Express.Multer.File) {
    const findOne = await this.productRepository.findOne({where:{id}})
    if(!findOne){
      throw new NotFoundException(`ProductID with ${findOne} not found`)
    }
    let uploadImg:any;
    if(findOne.image){
      await this.uploadService.removeFile({fileName: findOne.image})
       const uploadImage = await this.uploadService.uploadFile({
        file: image,
        destination: 'uploads'
      })
      uploadImg = uploadImage.imageUrl
    }
    const updated = Object.assign(findOne,updateProductDto)
    const updatedProduct =  await this.productRepository.save(updated);
    return {...updatedProduct,image: uploadImg}
  }

  async remove(id: number): Promise<object> {
    const findOne = await this.productRepository.findOne({where:{id}})
    if(!findOne){
      throw new NotFoundException(`ProductID with ${findOne} not found`)
    }
    if(findOne.image){
      await this.uploadService.removeFile({fileName: findOne.image})
    }
    await this.productRepository.remove(findOne)

    return {message: 'successfully deleted!'};
  }
  async searchByName(keyword: string) {
    return await this.productRepository.find({
      where: {
        name: ILike(`%${keyword}%`),
      },
    });
  }

  async findByProductPaginated(category: number, limit: number, offset: number) {
    return this.productRepository.find({
      where: { category:{id: category} },
      take:limit,
      skip: offset,
    });
  }
  

  async findByCategoryId(categoryId: number) {
    const findOne = await this.productRepository.find({
      where: { category:{ id: categoryId} },
    });
    if(!findOne){
      throw new NotFoundException("Topilmadi!")
    }
    return findOne
  }
  
  

}
