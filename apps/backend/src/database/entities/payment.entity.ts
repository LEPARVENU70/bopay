import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { Merchant } from './merchant.entity';
import { Customer } from './customer.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  TAP_TO_PAY = 'tap_to_pay',
  CARD = 'card',
  CASH = 'cash',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ default: 'eur' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.TAP_TO_PAY })
  method: PaymentMethod;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeChargeId: string;

  @Column({ nullable: true, unique: true })
  idempotencyKey: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  receiptEmail: string;

  @Column({ nullable: true })
  receiptPhone: string;

  @Column({ nullable: true })
  receiptSentAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Merchant, (merchant) => merchant.payments)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column()
  merchantId: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ nullable: true })
  customerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
