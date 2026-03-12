import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
  ) {}

  async getStats(merchantId: string) {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, week, month, all] = await Promise.all([
      this.paymentsRepo.find({ where: { merchantId, status: PaymentStatus.SUCCEEDED, createdAt: Between(startOfDay, now) } }),
      this.paymentsRepo.find({ where: { merchantId, status: PaymentStatus.SUCCEEDED, createdAt: Between(startOfWeek, now) } }),
      this.paymentsRepo.find({ where: { merchantId, status: PaymentStatus.SUCCEEDED, createdAt: Between(startOfMonth, now) } }),
      this.paymentsRepo.find({ where: { merchantId } }),
    ]);

    const sum = (arr: Payment[]) => arr.reduce((s, p) => s + Number(p.amount), 0);

    // 7-day chart
    const days: { label: string; amount: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const dayPayments = await this.paymentsRepo.find({
        where: { merchantId, status: PaymentStatus.SUCCEEDED, createdAt: Between(d, end) },
      });

      days.push({
        label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        amount: sum(dayPayments),
        count: dayPayments.length,
      });
    }

    const succeeded = all.filter(p => p.status === PaymentStatus.SUCCEEDED);
    const failed = all.filter(p => p.status === PaymentStatus.FAILED);
    const totalProcessed = succeeded.length + failed.length;

    return {
      today: { amount: sum(today), count: today.length },
      week: { amount: sum(week), count: week.length },
      month: { amount: sum(month), count: month.length },
      average: succeeded.length ? Math.round(sum(succeeded) / succeeded.length) : 0,
      successRate: totalProcessed ? Math.round((succeeded.length / totalProcessed) * 100) : 100,
      chart: days,
    };
  }
}
