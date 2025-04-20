import { Product } from "src/modules/product/entities/product.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'category'})
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'varchar',name:'name'})
    name: string

    @OneToMany(() => Product, (product) => product.category)
    products: Product[];
}
