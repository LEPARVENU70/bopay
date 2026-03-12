import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post(':id/send-invoice')
  sendInvoice(
    @Request() req,
    @Param('id') paymentId: string,
    @Body('email') email: string,
  ) {
    return this.invoicesService.sendInvoice(req.user.merchantId, paymentId, email);
  }
}
