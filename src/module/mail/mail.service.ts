import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type SendCredentialsMailOptions = {
  email: string;
  password: string;
  fullName: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(options: SendMailOptions) {
    try {
      await this.mailerService.sendMail(options);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown mail error';

      this.logger.error(
        `Failed to send email to ${options.to}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async sendNewUserCredentialsMail(options: SendCredentialsMailOptions) {
    const packageName =
      this.configService.get<string>('PACKAGE_NAME') || 'Vizual Graphics Ltd';
    const loginUrl =
      this.configService.get<string>('FRONTEND_LOGIN_URL') ||
      'https://visual-graphics-frontend.vercel.app';

    const subject = `Welcome to ${packageName}`;
    const html = this.buildNewUserCredentialsTemplate({
      ...options,
      loginUrl,
      packageName,
    });
    const text = [
      `Hello ${options.fullName},`,
      '',
      `Admin added you to ${packageName}.`,
      'Login with these credentials:',
      `Email: ${options.email}`,
      `Password: ${options.password}`,
      `Login URL: ${loginUrl}`,
    ].join('\n');

    await this.sendMail({
      to: options.email,
      subject,
      html,
      text,
    });

    this.logger.log(`Credentials email sent to ${options.email}`);
  }

  private buildNewUserCredentialsTemplate(options: {
    email: string;
    password: string;
    fullName: string;
    loginUrl: string;
    packageName: string;
  }) {
    const escapedName = this.escapeHtml(options.fullName);
    const escapedEmail = this.escapeHtml(options.email);
    const escapedPassword = this.escapeHtml(options.password);
    const escapedLoginUrl = this.escapeHtml(options.loginUrl);
    const escapedPackageName = this.escapeHtml(options.packageName);

    return `
      <div style="margin:0;padding:32px 16px;background:linear-gradient(135deg,#f4efe7 0%,#e4eef8 100%);font-family:Georgia,'Times New Roman',serif;color:#1d2a38;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 60px rgba(20,32,54,0.16);">
          <div style="padding:40px 40px 28px;background:linear-gradient(135deg,#10324a 0%,#2f6c8f 100%);color:#ffffff;">
            <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:0.78;">${escapedPackageName}</div>
            <h1 style="margin:14px 0 10px;font-size:34px;line-height:1.2;font-weight:700;">Vizual Graphics Ltd </h1>
            <p style="margin:0;font-size:16px;line-height:1.7;opacity:0.92;">
              Admin added you to Vizual Graphics Ltd. Your account is ready.
            </p>
          </div>

          <div style="padding:36px 40px 18px;">
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">Hello ${escapedName},</p>
            <p style="margin:0 0 22px;font-size:16px;line-height:1.8;color:#405162;">
              You can now sign in and start working with the team. Use the credentials below for your first login.
            </p>

            <div style="margin:0 0 28px;padding:24px;border-radius:20px;background:#f7f4ef;border:1px solid #e6ddd1;">
              <div style="margin-bottom:18px;">
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7b6d57;">Email</div>
                <div style="margin-top:6px;font-size:18px;font-weight:700;color:#1d2a38;">${escapedEmail}</div>
              </div>
              <div>
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7b6d57;">Password</div>
                <div style="margin-top:6px;font-size:18px;font-weight:700;color:#1d2a38;">${escapedPassword}</div>
              </div>
            </div>

            <a href="${escapedLoginUrl}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#bf7b30;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.4px;">
              Login Now
            </a>

            <p style="margin:24px 0 0;font-size:14px;line-height:1.8;color:#68798b;">
              For security, please change your password after your first login.
            </p>
          </div>

          <div style="padding:24px 40px 34px;border-top:1px solid #edf1f4;color:#6c7d8d;background:#fcfdfe;">
            <p style="margin:0 0 8px;font-size:13px;line-height:1.7;">
              If the button does not work, use this link:
            </p>
            <p style="margin:0;font-size:13px;line-height:1.7;word-break:break-all;">
              <a href="${escapedLoginUrl}" style="color:#2f6c8f;text-decoration:none;">${escapedLoginUrl}</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
