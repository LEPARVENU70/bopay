import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from '../database/entities/customer.entity';
import { Payment } from '../database/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Payment])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
