import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtCustomModule } from './jwt.module';
import { RedisModule } from 'src/client/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { RedisService } from 'src/client/redis.service';

@Module({
  imports:[TypeOrmModule.forFeature([User]), JwtCustomModule,RedisModule],
  controllers: [AuthController],
  providers: [AuthService,RedisService],
})
export class AuthModule {}
