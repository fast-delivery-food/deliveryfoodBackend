import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateInfoDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    address: string

    
    @IsString()
    @IsNotEmpty()
    phone: string

    
    @IsString()
    @IsOptional()
    description: string
}
