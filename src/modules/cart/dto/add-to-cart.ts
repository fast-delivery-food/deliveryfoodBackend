import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    example: 12,
    description: 'Mahsulotning ID raqami',
  })
  @IsInt()
  productId: number;

  @ApiProperty({
    example: 3,
    description: 'Nechta mahsulot qoshilmoqda',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
