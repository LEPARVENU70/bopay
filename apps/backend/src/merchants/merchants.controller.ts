import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('merchants')
@UseGuards(JwtAuthGuard)
export class MerchantsController {
  constructor(private merchantsService: MerchantsService) {}

  @Post()
  create(@Request() req, @Body() body: {
    businessName: string;
    email: string;
    phone?: string;
    siret?: string;
    businessType?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  }) {
    return this.merchantsService.create(req.user.sub, body);
  }

  @Get('me')
  getMyMerchant(@Request() req) {
    return this.merchantsService.getByUser(req.user.sub);
  }

  @Get('me/onboarding-status')
  checkOnboarding(@Request() req) {
    return this.merchantsService.checkOnboardingStatus(req.user.merchantId);
  }

  @Post('me/refresh-onboarding')
  refreshOnboarding(@Request() req) {
    return this.merchantsService.refreshOnboardingLink(req.user.merchantId);
  }

  @Post('me/connection-token')
  connectionToken(@Request() req) {
    return this.merchantsService.createConnectionToken(req.user.merchantId);
  }
}
