import { Cart } from "src/modules/cart/entities/cart.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'product' })
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', name: 'name' })
    name: string

    @Column({ type: 'text', name: 'description' })
    description: string

    @Column({ type: 'bigint', name: 'price' })
    price: number

    @Column({ type: 'varchar', name: 'image_url' })
    image: string

    @Column({ type: 'boolean', name: 'is_active', default: true })
    is_active: boolean

    @ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @OneToMany(() => Cart, (cart) => cart.product)
    carts: Cart[];


}
