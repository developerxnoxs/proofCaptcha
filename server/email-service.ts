import dotenv from 'dotenv';
dotenv.config({ override: true });

import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM_EMAIL;

    if (!host || !user || !pass || !from) {
      console.warn('[EMAIL] SMTP configuration incomplete, email service disabled');
      return;
    }

    this.config = {
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      from,
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        servername: process.env.SMTP_TLS_SERVERNAME || undefined,
      },
    });

    console.log('[EMAIL] Email service initialized successfully');
  }

  async sendVerificationEmail(to: string, code: string, name: string): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('[EMAIL] Email service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `ProofCaptcha <${this.config.from}>`,
        to,
        subject: 'Verifikasi Email Anda - ProofCaptcha',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verifikasi Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">ProofCaptcha</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Halo ${name}!</h2>
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Terima kasih telah mendaftar di ProofCaptcha. Untuk menyelesaikan pendaftaran Anda, silakan masukkan kode verifikasi berikut:
                        </p>
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                          <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Kode Verifikasi</p>
                          <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${code}
                          </p>
                        </div>
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Kode ini akan kadaluarsa dalam <strong>15 menit</strong>. Jika Anda tidak melakukan pendaftaran ini, abaikan email ini.
                        </p>
                        <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                          <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                            Email ini dikirim secara otomatis, mohon tidak membalas email ini.
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #999999; font-size: 12px;">
                          © ${new Date().getFullYear()} ProofCaptcha. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `
Halo ${name}!

Terima kasih telah mendaftar di ProofCaptcha. Untuk menyelesaikan pendaftaran Anda, silakan masukkan kode verifikasi berikut:

KODE VERIFIKASI: ${code}

Kode ini akan kadaluarsa dalam 15 menit. Jika Anda tidak melakukan pendaftaran ini, abaikan email ini.

© ${new Date().getFullYear()} ProofCaptcha. All rights reserved.
        `.trim(),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Verification email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('[EMAIL] Failed to send verification email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, code: string, name: string): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('[EMAIL] Email service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `ProofCaptcha <${this.config.from}>`,
        to,
        subject: 'Reset Password - ProofCaptcha',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">ProofCaptcha</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reset Password</h2>
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Halo ${name}, kami menerima permintaan untuk reset password akun Anda. Gunakan kode berikut untuk melanjutkan:
                        </p>
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                          <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Kode Reset</p>
                          <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${code}
                          </p>
                        </div>
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Kode ini akan kadaluarsa dalam <strong>15 menit</strong>. Jika Anda tidak melakukan permintaan ini, abaikan email ini.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #999999; font-size: 12px;">
                          © ${new Date().getFullYear()} ProofCaptcha. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `
Halo ${name},

Kami menerima permintaan untuk reset password akun Anda. Gunakan kode berikut untuk melanjutkan:

KODE RESET: ${code}

Kode ini akan kadaluarsa dalam 15 menit. Jika Anda tidak melakukan permintaan ini, abaikan email ini.

© ${new Date().getFullYear()} ProofCaptcha. All rights reserved.
        `.trim(),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Password reset email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('[EMAIL] Failed to send password reset email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
