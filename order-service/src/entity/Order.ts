
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  productId!: number;

  @Column('int')
  quantity!: number;

  @Column({ default: 'PENDING' })
  status!: string;

  @Column({ unique: true })
  idempotencyKey!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
