import { CartItem } from "src/modules/cart-item/entities/cart-item.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { Promocode } from "src/modules/promocode/entities/promocode.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.carts, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];


  @ManyToOne(() => Promocode, { nullable: true, eager: true })
  promocode: Promocode;

  getTotalPrice(): number {
    const total = this.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    if (this.promocode && this.promocode.discountPercentage) {
      return total * (1 - this.promocode.discountPercentage / 100);
    }

    return total;
  }

  @ManyToOne(() => Product, (product) => product.carts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
  })
  product: Product;



  
}
