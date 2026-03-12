import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  getCustomers(@Request() req, @Query('page') page?: string) {
    return this.customersService.getCustomers(req.user.merchantId, page ? parseInt(page) : 1);
  }

  @Get(':id')
  getCustomer(@Request() req, @Param('id') customerId: string) {
    return this.customersService.getCustomer(req.user.merchantId, customerId);
  }
}
