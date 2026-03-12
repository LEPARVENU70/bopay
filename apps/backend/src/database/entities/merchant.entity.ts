import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany
} from 'typeorm';
import { MerchantUser } from './merchant-user.entity';
import { Payment } from './payment.entity';
import { Customer } from './customer.entity';
import { Device } from './device.entity';

export enum MerchantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column({ nullable: true })
  siret: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: MerchantStatus, default: MerchantStatus.PENDING })
  status: MerchantStatus;

  @Column({ nullable: true })
  stripeAccountId: string;

  @Column({ nullable: true })
  stripeOnboardingUrl: string;

  @Column({ default: false })
  stripeOnboardingComplete: boolean;

  @Column({ nullable: true })
  businessType: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @OneToMany(() => MerchantUser, (user) => user.merchant)
  users: MerchantUser[];

  @OneToMany(() => Payment, (payment) => payment.merchant)
  payments: Payment[];

  @OneToMany(() => Customer, (customer) => customer.merchant)
  customers: Customer[];

  @OneToMany(() => Device, (device) => device.merchant)
  devices: Device[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
