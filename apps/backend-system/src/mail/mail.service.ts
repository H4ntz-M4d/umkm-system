import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Pengiriman email lewat SMTP.
 *
 * Kalau kredensial SMTP belum diisi di .env, service ini TIDAK melempar error
 * melainkan mencetak isi email ke log. Dengan begitu alur lupa kata sandi tetap
 * bisa dijalankan dan diuji saat pengembangan, sementara di produksi tinggal
 * mengisi env-nya tanpa mengubah kode.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.from =
      this.config.get<string>('SMTP_FROM') ??
      `"Nurfa Craft" <${user ?? 'no-reply@nurfacraft.local'}>`;

    console.log(host, user, pass);
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
        // Port 465 memakai TLS langsung; 587 memakai STARTTLS.
        secure: Number(this.config.get<string>('SMTP_PORT') ?? 587) === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'SMTP belum dikonfigurasi. Email tidak dikirim sungguhan, isinya dicetak ke log.',
      );
    }
  }

  get isConfigured() {
    return this.transporter !== null;
  }

  private async send(to: string, subject: string, html: string, text: string) {
    if (!this.transporter) {
      this.logger.log(
        `[EMAIL TIDAK TERKIRIM - SMTP belum diatur]\nKepada : ${to}\nSubjek : ${subject}\n${text}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
      html,
    });
  }

  async sendPasswordResetCode(params: {
    to: string;
    name: string;
    code: string;
    expiresInMinutes: number;
  }) {
    const subject = 'Kode Verifikasi Ganti Kata Sandi - Nurfa Craft';

    const text = [
      `Halo ${params.name},`,
      '',
      `Kode verifikasi untuk mengganti kata sandi akun Anda: ${params.code}`,
      '',
      `Kode ini berlaku ${params.expiresInMinutes} menit dan hanya bisa dipakai sekali.`,
      'Abaikan email ini bila Anda tidak meminta penggantian kata sandi.',
    ].join('\n');

    const html = `
      <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2b2b">
        <h2 style="margin:0 0 4px;font-size:20px">Nurfa<span style="color:#cc5933">Craft</span></h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:13px">Kode verifikasi ganti kata sandi</p>
        <p style="font-size:14px">Halo <strong>${params.name}</strong>,</p>
        <p style="font-size:14px">Gunakan kode berikut untuk melanjutkan penggantian kata sandi:</p>
        <div style="margin:20px 0;padding:16px;background:#faf7f4;border:1px solid #e7ddd4;border-radius:12px;text-align:center">
          <span style="font-size:30px;font-weight:700;letter-spacing:8px;color:#cc5933">${params.code}</span>
        </div>
        <p style="font-size:13px;color:#6b7280">
          Kode berlaku <strong>${params.expiresInMinutes} menit</strong> dan hanya bisa dipakai sekali.
        </p>
        <p style="font-size:13px;color:#6b7280">
          Abaikan email ini bila Anda tidak meminta penggantian kata sandi.
        </p>
      </div>
    `;

    try {
      await this.send(params.to, subject, html, text);
    } catch (error) {
      this.logger.error(
        `Gagal mengirim email ke ${params.to}: ${
          error instanceof Error ? error.message : 'kesalahan tidak diketahui'
        }`,
      );
    }
  }
}
