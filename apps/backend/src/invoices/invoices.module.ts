import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Payment } from '../database/entities/payment.entity';
import { Merchant } from '../database/entities/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Merchant])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
