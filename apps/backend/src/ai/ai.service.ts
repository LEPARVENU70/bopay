import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';
import { Customer } from '../database/entities/customer.entity';
import { Merchant } from '../database/entities/merchant.entity';

@Injectable()
export class AiService {
  private anthropic: Anthropic;

  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(Customer)
    private customersRepo: Repository<Customer>,
    @InjectRepository(Merchant)
    private merchantsRepo: Repository<Merchant>,
    private config: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  async chat(merchantId: string, message: string): Promise<string> {
    const context = await this.buildContext(merchantId);

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `Tu es l'assistant IA de ${context.businessName}, une application de paiement mobile (SoftPOS).
Tu aides le commerçant à comprendre ses données de vente et à prendre de meilleures décisions.
Sois concis, direct et bienveillant. Réponds toujours en français. Utilise des chiffres précis quand disponibles.

DONNÉES EN TEMPS RÉEL :
- Revenu aujourd'hui : ${(context.today / 100).toFixed(2)} €  (${context.todayCount} paiements)
- Revenu cette semaine : ${(context.week / 100).toFixed(2)} €
- Revenu ce mois : ${(context.month / 100).toFixed(2)} €
- Ticket moyen : ${(context.average / 100).toFixed(2)} €
- Taux de succès : ${context.successRate}%
- Nombre de clients : ${context.totalCustomers}
- Derniers paiements : ${context.recentPayments}
- Meilleurs clients : ${context.topCustomers}`,
      messages: [{ role: 'user', content: message }],
    });

    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  }

  private async buildContext(merchantId: string) {
    const now = new Date();

    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [merchant, todayPayments, weekPayments, monthPayments, allPayments, customers, topCustomers, recent] = await Promise.all([
      this.merchantsRepo.findOne({ where: { id: merchantId } }),
      this.paymentsRepo.find({ where: { merchantId, status: PaymentStatus.SUCCEEDED, createdAt: Between(startOfDay, now) } }),
      this.paymentsRepo.find({ where: { merchantId, status: PaymentStatus.SUCCEEDED, createdAt: Between(startOfWeek, now) } }),
      this.paymentsRepo.find({ where: { merchantId, status: PaymentStatus.SUCCEEDED, createdAt: Between(startOfMonth, now) } }),
      this.paymentsRepo.find({ where: { merchantId } }),
      this.customersRepo.count({ where: { merchantId } }),
      this.customersRepo.find({ where: { merchantId }, order: { totalSpent: 'DESC' }, take: 3 }),
      this.paymentsRepo.find({ where: { merchantId, status: PaymentStatus.SUCCEEDED }, order: { createdAt: 'DESC' }, take: 5 }),
    ]);

    const sum = (arr: Payment[]) => arr.reduce((s, p) => s + Number(p.amount), 0);
    const succeeded = allPayments.filter(p => p.status === PaymentStatus.SUCCEEDED);
    const failed = allPayments.filter(p => p.status === PaymentStatus.FAILED);
    const total = succeeded.length + failed.length;

    return {
      businessName: merchant?.businessName || 'votre commerce',
      today: sum(todayPayments),
      todayCount: todayPayments.length,
      week: sum(weekPayments),
      month: sum(monthPayments),
      average: succeeded.length ? Math.round(sum(succeeded) / succeeded.length) : 0,
      successRate: total ? Math.round((succeeded.length / total) * 100) : 100,
      totalCustomers: customers,
      recentPayments: recent.map(p =>
        `${(Number(p.amount) / 100).toFixed(2)}€ (${new Date(p.createdAt).toLocaleDateString('fr-FR')}${p.description ? ' - ' + p.description : ''})`
      ).join(', ') || 'aucun',
      topCustomers: topCustomers.map(c =>
        `${c.firstName || c.email || 'anonyme'} (${(Number(c.totalSpent) / 100).toFixed(2)}€, ${c.totalVisits} visites)`
      ).join(', ') || 'aucun',
    };
  }
}
