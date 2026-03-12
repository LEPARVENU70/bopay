import { Controller, Post, Headers, Body, RawBodyRequest, Req, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentsService } from '../payments/payments.service';
import { MerchantsService } from '../merchants/merchants.service';
import { PaymentStatus } from '../database/entities/payment.entity';
import { Request } from 'express';

@Controller('webhooks')
export class WebhooksController {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private paymentsService: PaymentsService,
    private merchantsService: MerchantsService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        this.config.get('STRIPE_WEBHOOK_SECRET'),
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const charge = pi.latest_charge as string;
        await this.paymentsService.handleWebhookUpdate(pi.id, PaymentStatus.SUCCEEDED, charge);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.paymentsService.handleWebhookUpdate(pi.id, PaymentStatus.FAILED);
        break;
      }

      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.paymentsService.handleWebhookUpdate(pi.id, PaymentStatus.CANCELED);
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const merchantId = account.metadata?.merchantId;
        if (merchantId && account.details_submitted) {
          await this.merchantsService.checkOnboardingStatus(merchantId);
        }
        break;
      }
    }

    return { received: true };
  }
}
