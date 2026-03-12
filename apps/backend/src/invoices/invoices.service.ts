import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as PDFDocument from 'pdfkit';
import { Payment } from '../database/entities/payment.entity';
import { Merchant } from '../database/entities/merchant.entity';

@Injectable()
export class InvoicesService {
  private resend: Resend;

  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(Merchant)
    private merchantsRepo: Repository<Merchant>,
    private config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async generatePdf(payment: Payment, merchant: Merchant): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const amount = (Number(payment.amount) / 100).toFixed(2);
      const currency = payment.currency.toUpperCase();
      const date = new Date(payment.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      const invoiceNumber = `FAC-${payment.id.substring(0, 8).toUpperCase()}`;

      // Header
      doc.fillColor('#6C47FF').fontSize(28).font('Helvetica-Bold').text('BOPAY', 50, 50);
      doc.fillColor('#111').fontSize(12).font('Helvetica').text('Reçu de paiement', 50, 85);
      doc.fontSize(10).fillColor('#888').text(`N° ${invoiceNumber}`, 400, 50, { align: 'right' });
      doc.text(`Date : ${date}`, 400, 65, { align: 'right' });

      // Divider
      doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#e0e0e0').stroke();

      // Merchant info
      doc.fillColor('#111').fontSize(12).font('Helvetica-Bold').text('Émetteur', 50, 125);
      doc.font('Helvetica').fontSize(11).text(merchant.businessName, 50, 145);
      if (merchant.email) doc.text(merchant.email, 50, 160);
      if (merchant.phone) doc.text(merchant.phone, 50, 175);
      if (merchant.siret) doc.text(`SIRET : ${merchant.siret}`, 50, 190);

      // Payment details box
      doc.rect(50, 240, 495, 120).fillColor('#F8F7FF').fill();
      doc.fillColor('#6C47FF').fontSize(13).font('Helvetica-Bold').text('Détail du paiement', 70, 260);
      doc.fillColor('#444').fontSize(11).font('Helvetica');
      doc.text('Description :', 70, 285);
      doc.text(payment.description || 'Paiement', 200, 285);
      doc.text('Méthode :', 70, 305);
      doc.text('Carte bancaire (Tap to Pay)', 200, 305);
      doc.text('Statut :', 70, 325);
      doc.fillColor('#22c55e').text('Accepté ✓', 200, 325);

      // Total
      doc.moveTo(50, 385).lineTo(545, 385).strokeColor('#e0e0e0').stroke();
      doc.fillColor('#111').fontSize(22).font('Helvetica-Bold');
      doc.text(`${amount} ${currency}`, 50, 400, { align: 'right' });
      doc.fillColor('#888').fontSize(10).font('Helvetica').text('Montant total TTC', 50, 430, { align: 'right' });

      // Footer
      doc.fillColor('#aaa').fontSize(9).text(
        'Ce document est un reçu de paiement généré automatiquement par Bopay.',
        50, 750, { align: 'center', width: 495 },
      );

      doc.end();
    });
  }

  async sendInvoice(merchantId: string, paymentId: string, recipientEmail: string) {
    const payment = await this.paymentsRepo.findOne({
      where: { id: paymentId, merchantId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'succeeded') throw new BadRequestException('Payment not completed');

    const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });

    const pdfBuffer = await this.generatePdf(payment, merchant);

    const amount = (Number(payment.amount) / 100).toFixed(2);
    const invoiceNumber = `FAC-${payment.id.substring(0, 8).toUpperCase()}`;
    const fromEmail = this.config.get('FROM_EMAIL') || 'factures@bopay.fr';

    await this.resend.emails.send({
      from: `${merchant.businessName} <${fromEmail}>`,
      to: [recipientEmail],
      subject: `Votre reçu de paiement ${amount} € — ${merchant.businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto">
          <h2 style="color:#6C47FF">Votre reçu de paiement</h2>
          <p>Bonjour,</p>
          <p>Vous trouverez ci-joint votre reçu <strong>${invoiceNumber}</strong>
             d'un montant de <strong>${amount} €</strong> auprès de <strong>${merchant.businessName}</strong>.</p>
          <p style="color:#888;font-size:12px">Ce reçu a été généré automatiquement par Bopay.</p>
        </div>
      `,
      attachments: [{
        filename: `recu-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      }],
    });

    await this.paymentsRepo.update(paymentId, {
      receiptEmail: recipientEmail,
      receiptSentAt: new Date(),
    });

    return { success: true, email: recipientEmail };
  }
}
