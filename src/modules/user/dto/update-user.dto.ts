import { IsOptional, IsString,  IsDateString, IsEnum } from 'class-validator';
import { UserRoles } from 'src/utils/user-role';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsString()
  lastname?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string; 

  @IsOptional()
  @IsString()
  telegramId?: string

  @IsEnum(UserRoles,)
  @IsOptional()
  role?: UserRoles
}
