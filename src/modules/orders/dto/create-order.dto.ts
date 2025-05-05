// order-create.dto.ts
import { IsNotEmpty, IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Address } from 'src/modules/address/entities/address.entity';
import { Cart } from 'src/modules/cart/entities/cart.entity';

class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;
}

export class OrderCreateDto {
  @IsNotEmpty()
  @IsString()
    user: string;

  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  address: Address;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  cartId: number

  @IsOptional()
  @IsString()
  promocodeCode?: string;

  @IsString()
  orderNumber: string
}
