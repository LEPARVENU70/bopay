import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
  ) {}

  async getStats(merchantId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Single raw SQL query for all aggregates + 7-day chart
    const [aggregates, chartRaw] = await Promise.all([
      this.paymentsRepo.query(`
        SELECT
          COALESCE(SUM(CASE WHEN created_at >= $2 AND status = 'succeeded' THEN amount END), 0) AS today_amount,
          COUNT(CASE WHEN created_at >= $2 AND status = 'succeeded' THEN 1 END) AS today_count,
          COALESCE(SUM(CASE WHEN created_at >= $3 AND status = 'succeeded' THEN amount END), 0) AS week_amount,
          COUNT(CASE WHEN created_at >= $3 AND status = 'succeeded' THEN 1 END) AS week_count,
          COALESCE(SUM(CASE WHEN created_at >= $4 AND status = 'succeeded' THEN amount END), 0) AS month_amount,
          COUNT(CASE WHEN created_at >= $4 AND status = 'succeeded' THEN 1 END) AS month_count,
          COALESCE(AVG(CASE WHEN status = 'succeeded' THEN amount END), 0) AS average,
          COUNT(CASE WHEN status = 'succeeded' THEN 1 END) AS succeeded_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count
        FROM payments
        WHERE merchant_id = $1
      `, [merchantId, startOfDay, startOfWeek, startOfMonth]),

      this.paymentsRepo.query(`
        SELECT
          DATE(created_at AT TIME ZONE 'UTC') AS day,
          COALESCE(SUM(amount), 0) AS amount,
          COUNT(*) AS count
        FROM payments
        WHERE merchant_id = $1
          AND status = 'succeeded'
          AND created_at >= $2
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY day ASC
      `, [merchantId, sevenDaysAgo]),
    ]);

    const agg = aggregates[0];
    const succeededCount = Number(agg.succeeded_count);
    const failedCount = Number(agg.failed_count);
    const total = succeededCount + failedCount;

    // Build 7-day chart filling missing days with 0
    const chartByDay: Record<string, { amount: number; count: number }> = {};
    for (const row of chartRaw) {
      chartByDay[row.day] = { amount: Number(row.amount), count: Number(row.count) };
    }

    const chart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(12, 0, 0, 0);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      chart.push({ label, amount: chartByDay[key]?.amount ?? 0, count: chartByDay[key]?.count ?? 0 });
    }

    return {
      today: { amount: Number(agg.today_amount), count: Number(agg.today_count) },
      week: { amount: Number(agg.week_amount), count: Number(agg.week_count) },
      month: { amount: Number(agg.month_amount), count: Number(agg.month_count) },
      average: Math.round(Number(agg.average)),
      successRate: total ? Math.round((succeededCount / total) * 100) : 100,
      chart,
    };
  }
}
