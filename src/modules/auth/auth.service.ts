import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { RedisService } from 'src/client/redis.service';
import { LoginUserDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)private userRepository: Repository<User>,
    private readonly jwt: JwtService,
    private readonly redisService: RedisService
  ){}
  async signUp(payload: CreateUserDto) {
  
    const isUsername = await this.userRepository.findOne({where: {username: payload.username}})
    if(isUsername){
      throw new Error('Bunday username mavjud,iltimos boshqa kiriting!')
    }
    const newUser = this.userRepository.create({
      username: payload.username,
      firstname: payload.firstname,
      lastname: payload.lastname,
      birthday: payload.birthday,
      phone_number: payload.phone_number,
      roles: payload.role,
      telegramId: payload.telegramId
    });

    await this.userRepository.save(newUser);

    return this.generateTokens(newUser);
  }
  
  async signIn(payload: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { username: payload.username },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return this.generateTokens(user);
  }


  private async generateTokens(user: User) {
    const payload = { id: user.id, role: user.roles };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_TIME,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_TIME,
    });

    await this.redisService.setValue(
      `refresh_token_user_${user.id}`,
      refreshToken,
      604800, // 7 kun
    );

    return {
      message: 'Success ✅',
      accessToken,
      refreshToken,
    };
  }




  
  async refreshToken(token: string) {
    try {
      console.log('Clientdan kelgan token:', token);

      const decoded = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }

      const storedToken = await this.redisService.getValue(
        `refresh_token_user_${user.id}`,
      );
      console.log('Redisdagi token:', storedToken);

      if (!storedToken || storedToken !== token) {
        throw new UnauthorizedException('Refresh token mos emas yoki muddati tugagan');
      }

      const newAccessToken = await this.jwt.signAsync(
        { id: user.id, role: user.roles },
        {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: process.env.JWT_ACCESS_TIME,
        },
      );

      const newRefreshToken = await this.jwt.signAsync(
        { id: user.id, role: user.roles },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.JWT_REFRESH_TIME,
        },
      );

      await this.redisService.setValue(
        `refresh_token_user_${user.id}`,
        newRefreshToken,
        604800, // 7 kun
      );

      return {
        message: 'Tokenlar yangilandi ✅',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Refresh token noto‘g‘ri yoki muddati tugagan');
    }
  }


  async logout(token: string) {
    try {
      const decoded = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
  
      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
      });
  
      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }
  
      const storedToken = await this.redisService.getValue(
        `refresh_token_user_${user.id}`,
      );
  
      if (!storedToken || storedToken !== token) {
        throw new UnauthorizedException('Token notogri yoki muddati tugagan');
      }
  
      await this.redisService.deleteValue(`refresh_token_user_${user.id}`);
  
      return { message: 'Foydalanuvchi muvaffaqiyatli logout qilindi' };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Xatolik yuz berdi');
    }
  }

 
}
