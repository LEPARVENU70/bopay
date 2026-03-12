import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { Merchant } from './merchant.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: false })
  marketingConsent: boolean;

  @Column({ default: 0 })
  totalVisits: number;

  @Column({ type: 'bigint', default: 0 })
  totalSpent: number;

  @Column({ nullable: true })
  lastVisitAt: Date;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.customers)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column()
  merchantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
