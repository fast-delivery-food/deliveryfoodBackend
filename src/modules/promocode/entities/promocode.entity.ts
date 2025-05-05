// src/modules/promocode/entities/promocode.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum PromocodeType{
    GLOBAL='GLOBAL',
    SPECIFIC= 'PRODUCT_SPECIFIC'
};

@Entity()
export class Promocode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'float' })
  discountPercentage: number;

  @Column({ type: 'varchar', nullable: true })
  startDate: string;

  @Column({ type: 'varchar', nullable: true })
  endDate: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({name: 'isSingleUse',type:'boolean', default: false })
  isSingleUse: boolean;  

  
  @Column({ type: 'enum',enum: PromocodeType,name: 'type', default: PromocodeType.GLOBAL})
  type: PromocodeType;
}
