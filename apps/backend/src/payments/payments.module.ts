import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from '../database/entities/payment.entity';
import { Merchant } from '../database/entities/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Merchant])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
