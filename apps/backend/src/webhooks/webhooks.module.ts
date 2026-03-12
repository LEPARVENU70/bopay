import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PaymentsModule } from '../payments/payments.module';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
  imports: [PaymentsModule, MerchantsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
