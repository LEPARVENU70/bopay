import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentStatus, PaymentMethod } from '../database/entities/payment.entity';
import { Merchant } from '../database/entities/merchant.entity';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(Merchant)
    private merchantsRepo: Repository<Merchant>,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(merchantId: string, dto: {
    amount: number;
    currency?: string;
    description?: string;
    customerId?: string;
    idempotencyKey?: string;
  }) {
    const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
    if (dto.amount < 50) throw new BadRequestException('Minimum amount is 0.50€');

    const isDev = this.config.get('NODE_ENV') !== 'production';

    // In dev mode, simulate payment when Stripe account isn't fully configured
    if (!merchant?.stripeAccountId || !merchant.stripeOnboardingComplete) {
      if (!isDev) throw new BadRequestException('Stripe account not configured or onboarding not complete');
      const idempotencyKey = dto.idempotencyKey || uuidv4();
      const payment = this.paymentsRepo.create({
        amount: dto.amount, currency: dto.currency || 'eur',
        status: PaymentStatus.SUCCEEDED, method: PaymentMethod.TAP_TO_PAY,
        stripePaymentIntentId: `pi_simulated_${Date.now()}`,
        idempotencyKey, description: dto.description, merchantId,
      });
      await this.paymentsRepo.save(payment);
      return { paymentIntentClientSecret: 'simulated', paymentId: payment.id, simulated: true };
    }

    const idempotencyKey = dto.idempotencyKey || uuidv4();

    // Check idempotency
    const existing = await this.paymentsRepo.findOne({ where: { idempotencyKey } });
    if (existing) return { paymentIntentClientSecret: null, payment: existing, duplicate: true };

    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: dto.amount,
        currency: dto.currency || 'eur',
        description: dto.description,
        payment_method_types: ['card_present'],
        capture_method: 'automatic',
        metadata: { merchantId, idempotencyKey },
      },
      { stripeAccount: merchant.stripeAccountId },
    );

    const payment = this.paymentsRepo.create({
      amount: dto.amount,
      currency: dto.currency || 'eur',
      status: PaymentStatus.PENDING,
      method: PaymentMethod.TAP_TO_PAY,
      stripePaymentIntentId: paymentIntent.id,
      idempotencyKey,
      description: dto.description,
      merchantId,
      customerId: dto.customerId,
    });
    await this.paymentsRepo.save(payment);

    return {
      paymentIntentClientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      paymentIntentId: paymentIntent.id,
    };
  }

  async getPayments(merchantId: string, page = 1, limit = 20) {
    const [payments, total] = await this.paymentsRepo.findAndCount({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['customer'],
    });

    return {
      data: payments,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getPayment(merchantId: string, paymentId: string) {
    const payment = await this.paymentsRepo.findOne({
      where: { id: paymentId, merchantId },
      relations: ['customer'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async handleWebhookUpdate(stripePaymentIntentId: string, status: PaymentStatus, chargeId?: string) {
    const payment = await this.paymentsRepo.findOne({ where: { stripePaymentIntentId } });
    if (!payment) return;

    payment.status = status;
    if (chargeId) payment.stripeChargeId = chargeId;
    await this.paymentsRepo.save(payment);
  }
}
