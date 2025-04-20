import { Type } from "class-transformer"
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator"

export class UpdateProductDto {
    @IsString()
    @IsOptional()
    name: string
    
    @IsString()
    @IsOptional()
    description: string

    @IsOptional()
    image: Express.Multer.File

    @IsNumber()
    @Type(()=>Number)
    @IsOptional()
    price: number


    @Type(()=>Number)
    @IsInt()
    @IsOptional()
    categoryId: number
}
