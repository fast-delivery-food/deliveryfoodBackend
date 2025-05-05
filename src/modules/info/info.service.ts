import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInfoDto } from './dto/create-info.dto';
import { UpdateInfoDto } from './dto/update-info.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Info } from './entities/info.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InfoService {
  constructor(@InjectRepository(Info) private inforepo: Repository<Info>){}
  async create(createInfoDto: CreateInfoDto) {
    const created =  this.inforepo.create(createInfoDto)
    return await this.inforepo.save(created)
  }

  async findAll() {
    return await this.inforepo.find()
  }

  async findOne(id: number) {
    const findOne = await this.inforepo.findOne({where:{id}})
    if(findOne){
      throw new NotFoundException("Contact info not found")
    }
    return findOne;
  }

  async update(id: number, updateInfoDto: UpdateInfoDto) {
    
    const findOne = await this.inforepo.findOne({where:{id}})
    if(findOne){
      throw new NotFoundException("Contact info not found")
    }
    const updated = Object.assign(findOne,updateInfoDto)
    return await this.inforepo.save(updated);
  }

  async remove(id: number) {
    
    const findOne = await this.inforepo.findOne({where:{id}})
    if(findOne){
      throw new NotFoundException("Contact info not found")
    }
    await this.inforepo.remove(findOne)
  }
}
