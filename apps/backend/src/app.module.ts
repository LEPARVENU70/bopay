import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MerchantsModule } from './merchants/merchants.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { Merchant } from './database/entities/merchant.entity';
import { MerchantUser } from './database/entities/merchant-user.entity';
import { Payment } from './database/entities/payment.entity';
import { Customer } from './database/entities/customer.entity';
import { Device } from './database/entities/device.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Merchant, MerchantUser, Payment, Customer, Device],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    MerchantsModule,
    PaymentsModule,
    WebhooksModule,
  ],
})
export class AppModule {}
