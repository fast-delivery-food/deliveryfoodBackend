import { Order } from 'src/modules/orders/entities/order.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  
  @Entity({ name: 'order_items' })
  export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Order, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: Order;
  
    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;
  
    @Column()
    quantity: number;
  
    @Column({ type: 'float' })
    price: number;
  }
  