import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User)private userREpository: Repository<User>){}
  async findAll(){
    return await this.userREpository.find()
  }

  async findByUserId(userId: string){
    const findOne = await this.userREpository.findOne({where:{telegramId: userId}})
    // if(!findOne){
    //   throw new NotFoundException('User Not Found')
    // }
    console.log(findOne)
    return findOne
  }
  async updateBirthDate(userId: string, birthDate: string) {
    const user = await this.userREpository
      .createQueryBuilder()
      .update(User)
      .set({ birthday: birthDate })
      .where("id = :id", { id: userId })
      .execute();
    
    return user;
  }

  // async updatePhoneNumber(telegramId: string, phoneNumber: string){
  //   const user = await this.userREpository
  //     .createQueryBuilder()
  //     .update(User)
  //     .set({ phone_number:phoneNumber })
  //     .where("id = :id", { telegramId: telegramId })
  //     .execute();
    
  //   return user;
  // }

  async updatePhoneNumber(telegramId: string,update: UpdateUserDto){
    const findOne = await this.userREpository.findOne({where:{telegramId}})
    const updated = Object.assign(findOne,update)
    return await this.userREpository.save(updated)
  }
  
}
