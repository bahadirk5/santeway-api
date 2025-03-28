import { CreateEmailResponse, Resend } from 'resend';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly defaultSender: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.getOrThrow('RESEND_API_KEY'));
    this.defaultSender = this.configService.get(
      'DEFAULT_EMAIL_SENDER',
      'onboarding@resend.dev',
    );
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string,
  ): Promise<CreateEmailResponse> {
    const emailOptions: EmailOptions = {
      to,
      subject: 'E-posta Adresinizi Doğrulayın',
      html: this.generateVerificationTemplate(name, verificationUrl),
    };

    return this.sendEmail(emailOptions);
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<CreateEmailResponse> {
    const emailOptions: EmailOptions = {
      to,
      subject: 'Şifre Sıfırlama Talebi',
      html: this.generatePasswordResetTemplate(name, resetUrl),
    };

    return this.sendEmail(emailOptions);
  }

  private async sendEmail(options: EmailOptions): Promise<CreateEmailResponse> {
    try {
      const { to, subject, html, from = this.defaultSender } = options;

      const data = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent successfully to ${to}`);
      return data;
    } catch (error) {
      this.logger.error(`Email sending failed to ${options.to}:`, error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  private generateVerificationTemplate(
    name: string,
    verificationUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1>Merhaba, ${name}!</h1>
        <p>E-posta adresinizi doğrulamak için lütfen aşağıdaki butona tıklayın:</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            E-posta Adresimi Doğrula
          </a>
        </div>
        <p>Bu e-postayı siz talep etmediyseniz, lütfen dikkate almayın.</p>
        <div style="margin-top: 30px;">
          <strong>Saygılarımızla,</strong><br>
          Uygulama Ekibi
        </div>
      </div>
    `;
  }

  private generatePasswordResetTemplate(
    name: string,
    resetUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1>Merhaba, ${name}!</h1>
        <p>Şifrenizi sıfırlamak için bir istek aldık. Şifrenizi sıfırlamak için lütfen aşağıdaki butona tıklayın:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Şifremi Sıfırla
          </a>
        </div>
        <p>Bu talebi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin ve şifrenizin güvende olduğundan emin olun.</p>
        <p>Bu şifre sıfırlama bağlantısı 24 saat içinde geçerliliğini yitirecektir.</p>
        <div style="margin-top: 30px;">
          <strong>Saygılarımızla,</strong><br>
          Uygulama Ekibi
        </div>
      </div>
    `;
  }
}
