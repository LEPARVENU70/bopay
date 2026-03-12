import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { Merchant } from './merchant.entity';

export enum DeviceStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;

  @Column({ unique: true })
  deviceToken: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  appVersion: string;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.ACTIVE })
  status: DeviceStatus;

  @Column({ nullable: true })
  lastSeenAt: Date;

  @ManyToOne(() => Merchant, (merchant) => merchant.devices)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column()
  merchantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
