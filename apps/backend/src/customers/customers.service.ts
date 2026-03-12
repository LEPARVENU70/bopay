import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../database/entities/customer.entity';
import { Payment } from '../database/entities/payment.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepo: Repository<Customer>,
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
  ) {}

  async getCustomers(merchantId: string, page = 1, limit = 30) {
    const [customers, total] = await this.customersRepo.findAndCount({
      where: { merchantId },
      order: { lastVisitAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: customers,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getCustomer(merchantId: string, customerId: string) {
    const customer = await this.customersRepo.findOne({
      where: { id: customerId, merchantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const payments = await this.paymentsRepo.find({
      where: { customerId, merchantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return { ...customer, payments };
  }

  async upsertFromPayment(merchantId: string, email: string, paymentAmount: number) {
    let customer = await this.customersRepo.findOne({ where: { merchantId, email } });

    if (!customer) {
      customer = this.customersRepo.create({ merchantId, email });
    }

    customer.totalVisits += 1;
    customer.totalSpent = Number(customer.totalSpent) + paymentAmount;
    customer.lastVisitAt = new Date();
    return this.customersRepo.save(customer);
  }
}
