import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string
    
    @IsString()
    @IsNotEmpty()
    description: string

    @IsOptional()
    image: Express.Multer.File

    @Type(()=>Number)
    @IsInt()
    @IsNotEmpty()
    price: number

    @Type(()=>Number)
    @IsInt()
    @IsNotEmpty()
    categoryId: number
}
