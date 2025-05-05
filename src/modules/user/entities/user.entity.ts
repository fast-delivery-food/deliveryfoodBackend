import { Cart } from "src/modules/cart/entities/cart.entity";
import { Order } from "src/modules/orders/entities/order.entity";
import { UserRoles } from "src/utils/user-role";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'varchar' })
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ type: 'varchar', name: 'firstname' })
    firstname: string

    @Column({ type: "varchar", name: 'lasatname' })
    lastname: string

    @Column({ type: 'varchar', name: 'username', unique: true })
    username: string

    @Column({ type: 'varchar', name: 'phone_number', nullable: true })
    phone_number: string

    @Column({ type: 'varchar', name: 'birthday', nullable: true })
    birthday: string

    @Column({type:'varchar',name: 'telegramId', unique: true,nullable: true })
    telegramId: string;

    @Column({ type: 'enum', enum: UserRoles, name: 'roles', default: UserRoles.USER })
    roles: UserRoles

    @OneToMany(() => Cart, (cart) => cart.user)
    carts: Cart[];

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];





}
