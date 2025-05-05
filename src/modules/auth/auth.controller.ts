import { Controller, Get, Post, Body,  Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import {  CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login.dto';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UserRoles } from 'src/utils/user-role';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Foydalanuvchini ro‘yxatdan o‘tkazish' })
  @ApiBody({
    description: 'Ro‘yxatdan o‘tish uchun foydalanuvchi ma\'lumotlari',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: '@dev' },
        firstname: { type: 'string', example: 'Diyor' },
        lastname: { type: 'string', example: 'Odilov' },
        phone_number:{type: 'string',example: '+998956221010'},
        birthday: {type: 'string',example: '2004-10-25'},
        role: { type: 'string', enum: [UserRoles], example: UserRoles.USER },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tokenlar yangilandi ✅',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Success ✅' },
        accessToken: {
          type: 'string',
        },
        refreshToken: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Notogri ma’lumotlar kiritildi',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Foydalanuvchi allaqachon mavjud',
  })
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Foydalanuvchini tizimga kirishi' })
  @ApiBody({
    description: 'Tizimga kirish uchun foydalanuvchi ma\'lumotlari',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: '@dev' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Foydalanuvchi muvaffaqiyatli tizimga kirdi',
    schema: {
      example: {
        message: 'Success✅',
        accessToken: 'access_token_here',
        refreshToken: 'refresh_token_here',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Notogri foydalanuvchi malumotlari',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Notogri yoki yoq parol',
  })
  async signIn(@Body() loginUserDto: LoginUserDto) {
    return this.authService.signIn(loginUserDto);
  }

  @Post('refresh-token')
@ApiOperation({ summary: 'Refresh access token (enter only refresh token)' })
@ApiResponse({
  status: 200,
  description: 'Successfully refreshed',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized token or invalid',
})
@ApiQuery({
  name: 'token',
  description: 'Refresh access token',
  required: true,
  type: String,
})
async refresh(@Query('token') token: string) {
  console.log('Refreshed token:', token);
  
  if (!token) {
    throw new UnauthorizedException('Refresh token is missing in query parameter');
  }

  return this.authService.refreshToken(token);
}


  @Post('logout')
  @ApiOperation({ summary: 'Foydalanuvchini tizimdan chiqazish (Logout)' })
  @ApiResponse({
    status: 200,
    description: 'Foydalanuvchi muvaffaqiyatli chiqdi',
  })
  @ApiResponse({
    status: 401,
    description: 'Token notogri yoki yoq',
  })
  @ApiQuery({
    name: 'token',
    description: 'Foydalanuvchi refresh tokeni',
    required: true,
    type: String,
  })
  async logout(@Query('token') token: string) {
    if (!token) {
      throw new UnauthorizedException('Token is missing in query parameter');
    }
  
    return this.authService.logout(token);
  }
}
