import { DataSource } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { MerchantUser } from './entities/merchant-user.entity';
import { Payment } from './entities/payment.entity';
import { Customer } from './entities/customer.entity';
import { Device } from './entities/device.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Merchant, MerchantUser, Payment, Customer, Device],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
});
