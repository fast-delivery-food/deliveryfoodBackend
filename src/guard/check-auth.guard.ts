import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  id: number;
  role: string;
}

@Injectable()
export class CheckAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService,
    private readonly configService: ConfigService
    ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    console.log("Authorization:",authHeader)
    if (!authHeader) {
      throw new UnauthorizedException('❌ Token yuborilmagan');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('❌ Token Bearer bilan boshlanishi kerak');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('❌ Token topilmadi');
    }

    try {
      const decoded = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'), // ✅ to‘g‘ri yondashuv
      });

      console.log('✅ Decoded token:', decoded);
      (request as any).user = {
        id: decoded.id,
        role: decoded.role,
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('❌ Token yaroqsiz yoki muddati tugagan');
    }
  }
}

