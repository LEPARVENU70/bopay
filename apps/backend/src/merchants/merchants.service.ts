import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Merchant, MerchantStatus } from '../database/entities/merchant.entity';
import { MerchantUser } from '../database/entities/merchant-user.entity';

@Injectable()
export class MerchantsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Merchant)
    private merchantsRepo: Repository<Merchant>,
    @InjectRepository(MerchantUser)
    private usersRepo: Repository<MerchantUser>,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async create(userId: string, dto: {
    businessName: string;
    email: string;
    phone?: string;
    siret?: string;
    businessType?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }) {
    // Check if user already has a merchant (e.g. from a previous failed attempt)
    const existingUser = await this.usersRepo.findOne({ where: { id: userId }, relations: ['merchant'] });
    let merchant: Merchant;

    if (existingUser?.merchant) {
      merchant = existingUser.merchant;
      // If Stripe account already created, return existing onboarding URL
      if (merchant.stripeAccountId && merchant.stripeOnboardingUrl) {
        return { merchant, onboardingUrl: merchant.stripeOnboardingUrl };
      }
    } else {
      merchant = this.merchantsRepo.create({
        ...dto,
        country: dto.country || 'FR',
        status: MerchantStatus.PENDING,
      });
      await this.merchantsRepo.save(merchant);
      await this.usersRepo.update(userId, { merchantId: merchant.id });
    }

    // Create Stripe Connect account
    let account: Stripe.Account;
    try {
      account = await this.stripe.accounts.create({
        type: 'express',
        country: merchant.country || 'FR',
        email: dto.email || merchant.email,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { merchantId: merchant.id },
      });
    } catch (e: any) {
      throw new BadRequestException(`Stripe account creation failed: ${e.message}`);
    }

    let onboardingLink: Stripe.AccountLink;
    try {
      onboardingLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${this.config.get('APP_URL')}/onboarding/refresh`,
        return_url: `${this.config.get('APP_URL')}/onboarding/complete`,
        type: 'account_onboarding',
      });
    } catch (e: any) {
      throw new BadRequestException(`Stripe onboarding link failed: ${e.message}`);
    }

    merchant.stripeAccountId = account.id;
    merchant.stripeOnboardingUrl = onboardingLink.url;
    await this.merchantsRepo.save(merchant);

    return { merchant, onboardingUrl: onboardingLink.url };
  }

  async getByUser(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId }, relations: ['merchant'] });
    if (!user?.merchant) throw new NotFoundException('No merchant found for this user');
    return user.merchant;
  }

  async refreshOnboardingLink(merchantId: string) {
    const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
    if (!merchant?.stripeAccountId) throw new BadRequestException('No Stripe account linked');

    const link = await this.stripe.accountLinks.create({
      account: merchant.stripeAccountId,
      refresh_url: `${this.config.get('APP_URL')}/onboarding/refresh`,
      return_url: `${this.config.get('APP_URL')}/onboarding/complete`,
      type: 'account_onboarding',
    });

    merchant.stripeOnboardingUrl = link.url;
    await this.merchantsRepo.save(merchant);

    return { onboardingUrl: link.url };
  }

  async checkOnboardingStatus(merchantId: string) {
    const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
    if (!merchant?.stripeAccountId) throw new BadRequestException('No Stripe account linked');

    const account = await this.stripe.accounts.retrieve(merchant.stripeAccountId);
    const isComplete = account.details_submitted && account.charges_enabled;

    if (isComplete && !merchant.stripeOnboardingComplete) {
      merchant.stripeOnboardingComplete = true;
      merchant.status = MerchantStatus.ACTIVE;
      await this.merchantsRepo.save(merchant);
    }

    return {
      onboardingComplete: isComplete,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      status: merchant.status,
    };
  }

  async createConnectionToken(merchantId: string) {
    const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
    if (!merchant?.stripeAccountId) throw new BadRequestException('No Stripe account linked');
    if (!merchant.stripeOnboardingComplete) throw new BadRequestException('Stripe onboarding not complete');

    const connectionToken = await this.stripe.terminal.connectionTokens.create(
      {},
      { stripeAccount: merchant.stripeAccountId },
    );

    return { secret: connectionToken.secret };
  }
}
