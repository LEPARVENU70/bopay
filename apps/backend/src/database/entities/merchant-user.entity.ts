import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { Merchant } from './merchant.entity';

export enum UserRole {
  OWNER = 'owner',
  CASHIER = 'cashier',
}

@Entity('merchant_users')
export class MerchantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.OWNER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @ManyToOne(() => Merchant, (merchant) => merchant.users, { nullable: true })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ nullable: true })
  merchantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
