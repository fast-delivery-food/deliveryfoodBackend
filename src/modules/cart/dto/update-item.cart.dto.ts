import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    example: 12,
    description: 'Mahsulot ID (savatda o‘zgartirmoqchi bo‘lgan itemga tegishli)',
  })
  @IsInt()
  productId: number;

  @ApiProperty({
    example: 5,
    description: 'Yangi miqdor',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
