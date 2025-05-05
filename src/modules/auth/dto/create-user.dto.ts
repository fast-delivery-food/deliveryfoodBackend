import { IsNotEmpty, IsString,  IsDateString, IsOptional, IsEnum } from 'class-validator';
import { UserRoles } from 'src/utils/user-role';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @IsOptional()
  @IsDateString()
  birthday?: string; 

  @IsOptional()
  @IsString()
  telegramId: string

  @IsEnum(UserRoles,)
  @IsNotEmpty()
  role: UserRoles
}
