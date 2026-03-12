import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('intent')
  createIntent(
    @Request() req,
    @Body() body: {
      amount: number;
      currency?: string;
      description?: string;
      customerId?: string;
      idempotencyKey?: string;
    },
  ) {
    return this.paymentsService.createPaymentIntent(req.user.merchantId, body);
  }

  @Get()
  list(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.paymentsService.getPayments(req.user.merchantId, +page, +limit);
  }

  @Get(':id')
  getOne(@Request() req, @Param('id') id: string) {
    return this.paymentsService.getPayment(req.user.merchantId, id);
  }
}
