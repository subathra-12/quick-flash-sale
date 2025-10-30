
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('outbox')
export class Outbox {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  aggregateType!: string;

  @Column()
  aggregateId!: string;

  @Column()
  type!: string;

  @Column('text')
  payload!: string;

  @Column({ default: false })
  dispatched!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
