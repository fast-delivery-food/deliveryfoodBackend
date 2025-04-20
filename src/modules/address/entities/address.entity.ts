import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

@Entity({ name: "address" })
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type:'float'})
  latitude: number;

  @Column({type: 'float'})
  longitude: number;

  @Column({type: 'text', nullable: true })
  description?: string; 

}
