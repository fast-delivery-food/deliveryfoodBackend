// src/modules/promocode/dto/create-promocode.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { PromocodeType } from '../entities/promocode.entity';

export class CreatePromocodeDto {
  @IsString()
  code: string;

  @IsNumber()
  discountPercentage: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @IsOptional()
  @IsDateString()
  endDate?: string;
  
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSingleUse?: boolean;

  @IsOptional()
  @IsEnum(PromocodeType)
  type?: PromocodeType;
}
