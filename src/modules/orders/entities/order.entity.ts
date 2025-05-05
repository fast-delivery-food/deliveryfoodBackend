import { Address } from 'src/modules/address/entities/address.entity';
import { OrderItem } from 'src/modules/order-items/entities/order-item.entity';
import { Promocode } from 'src/modules/promocode/entities/promocode.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { OrderStatus } from 'src/utils/order-status';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    JoinColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'orders' })
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Address, { cascade: true, eager: true })
    @JoinColumn({ name: 'address_id' })
    address: Address;


    @ManyToOne(() => Promocode, { nullable: true })
    @JoinColumn({ name: 'promocode_id' })
    promocode: Promocode;
    
    @Column()
    phoneNumber: string;

    @Column({name: 'status',type:'enum',enum:OrderStatus, default: OrderStatus.ACCEPTED }) // accepted, preparing, on_the_way, delivered
    status: OrderStatus;

    @Column({type: 'varchar',name: 'order_number',nullable: true})
    order_number: string

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
    items: OrderItem[];

    @Column({ type: 'float' })
    totalPrice: number;


    @CreateDateColumn({
        type:'timestamp',
        name: 'createdAt',
        default:()=>'CURRENT_TIMESTAMP(6)'
    })
    createdAt: Date

    @UpdateDateColumn({
        type:'timestamp',
        name:'updatedAt',
        default:()=> 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)'
    })
    updatedAt: Date
}
