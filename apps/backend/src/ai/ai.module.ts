import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { Payment } from '../database/entities/payment.entity';
import { Customer } from '../database/entities/customer.entity';
import { Merchant } from '../database/entities/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Customer, Merchant])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
