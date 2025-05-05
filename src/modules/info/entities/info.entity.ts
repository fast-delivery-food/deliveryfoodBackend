import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'contactinfo'})
export class Info {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'varchar',name:'name'})
    name: string

    @Column({type:'varchar',name: 'phone'})
    phone: string

    @Column({type: 'varchar',name: 'address'})
    address: string

    @Column({type: 'text',name:'description',nullable: true})
    description: string
}
