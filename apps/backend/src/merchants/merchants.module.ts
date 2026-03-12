import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import { Merchant } from '../database/entities/merchant.entity';
import { MerchantUser } from '../database/entities/merchant-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant, MerchantUser])],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
