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
        subject: '🔐 Verifikasi Email Anda - ProofCaptcha',
        html: `
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Verifikasi Email</title>
            <!--[if mso]>
            <style type="text/css">
              body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
            </style>
            <![endif]-->
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
            <!-- Outer wrapper -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 20px;">
              <tr>
                <td align="center">
                  <!-- Main container -->
                  <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
                    
                    <!-- Header with logo and icon -->
                    <tr>
                      <td style="padding: 48px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative;">
                        <!-- Decorative circles -->
                        <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                        
                        <!-- Logo/Brand -->
                        <div style="position: relative; z-index: 1;">
                          <!-- ProofCaptcha Logo -->
                          <svg width="280" height="80" viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                            <!-- Shield Icon -->
                            <g transform="translate(0, 10)">
                              <path d="M30 5L15 10V22C15 30.5 19.8 38.5 30 41C40.2 38.5 45 30.5 45 22V10L30 5Z" fill="white" fill-opacity="0.95"/>
                              <path d="M27 32L21 26L22.4 24.6L27 29.2L37.6 18.6L39 20L27 32Z" fill="#667eea"/>
                              <!-- Decorative glow -->
                              <circle cx="30" cy="23" r="18" fill="white" fill-opacity="0.2" filter="url(#glow)"/>
                            </g>
                            
                            <!-- ProofCaptcha Text -->
                            <text x="65" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="white" letter-spacing="-0.5">
                              Proof<tspan fill="rgba(255,255,255,0.9)">Captcha</tspan>
                            </text>
                            
                            <!-- Tagline -->
                            <text x="65" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">
                              ADVANCED BOT PROTECTION
                            </text>
                            
                            <!-- Glow filter -->
                            <defs>
                              <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                          </svg>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Main content -->
                    <tr>
                      <td style="padding: 48px 40px;">
                        <!-- Greeting -->
                        <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">
                          Halo, ${name}! 👋
                        </h2>
                        <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Terima kasih telah bergabung dengan ProofCaptcha! Kami senang Anda di sini. Untuk mengamankan akun Anda, silakan verifikasi email dengan kode di bawah ini.
                        </p>
                        
                        <!-- Verification code card -->
                        <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%); border: 2px solid #e0e7ff; border-radius: 16px; padding: 32px; text-align: center; margin: 32px 0; position: relative; overflow: hidden;">
                          <!-- Decorative gradient overlay -->
                          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);"></div>
                          
                          <div style="display: inline-block; background: rgba(102, 126, 234, 0.1); padding: 8px 16px; border-radius: 20px; margin-bottom: 16px;">
                            <p style="margin: 0; color: #667eea; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Kode Verifikasi Anda</p>
                          </div>
                          
                          <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin: 16px 0; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);">
                            <p style="margin: 0; color: #667eea; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', Consolas, monospace; text-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);">
                              ${code}
                            </p>
                          </div>
                          
                          <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 4px;">
                              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" fill="#f59e0b"/>
                            </svg>
                            Kode ini akan <strong style="color: #f59e0b;">kadaluarsa dalam 15 menit</strong>
                          </p>
                        </div>
                        
                        <!-- Security notice -->
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                            <strong style="color: #78350f;">🔒 Tips Keamanan:</strong><br>
                            Jangan bagikan kode ini kepada siapa pun. Tim ProofCaptcha tidak akan pernah meminta kode verifikasi Anda melalui email, telepon, atau pesan.
                          </p>
                        </div>
                        
                        <!-- Didn't request notice -->
                        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                            Tidak melakukan pendaftaran ini?<br>
                            <span style="color: #9ca3af;">Abaikan email ini dengan aman. Akun Anda tetap terlindungi.</span>
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 32px 40px; background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%); border-top: 1px solid #e5e7eb;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="text-align: center; padding-bottom: 16px;">
                              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Butuh Bantuan?</p>
                              <a href="mailto:support@proofcaptcha.com" style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: 500;">support@proofcaptcha.com</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="text-align: center; padding: 16px 0; border-top: 1px solid #e5e7eb;">
                              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                © ${new Date().getFullYear()} ProofCaptcha. All rights reserved.<br>
                                Email otomatis, mohon tidak membalas.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Bottom spacing -->
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                    <tr>
                      <td style="padding: 24px 0; text-align: center;">
                        <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 12px;">
                          Powered by ProofCaptcha Security
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
        subject: '🔑 Reset Password - ProofCaptcha',
        html: `
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Reset Password</title>
            <!--[if mso]>
            <style type="text/css">
              body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
            </style>
            <![endif]-->
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
            <!-- Outer wrapper -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 20px;">
              <tr>
                <td align="center">
                  <!-- Main container -->
                  <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
                    
                    <!-- Header with logo and icon -->
                    <tr>
                      <td style="padding: 48px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative;">
                        <!-- Decorative circles -->
                        <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                        
                        <!-- Logo/Brand -->
                        <div style="position: relative; z-index: 1;">
                          <!-- ProofCaptcha Logo -->
                          <svg width="280" height="80" viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                            <!-- Shield Icon -->
                            <g transform="translate(0, 10)">
                              <path d="M30 5L15 10V22C15 30.5 19.8 38.5 30 41C40.2 38.5 45 30.5 45 22V10L30 5Z" fill="white" fill-opacity="0.95"/>
                              <path d="M27 32L21 26L22.4 24.6L27 29.2L37.6 18.6L39 20L27 32Z" fill="#667eea"/>
                              <!-- Decorative glow -->
                              <circle cx="30" cy="23" r="18" fill="white" fill-opacity="0.2" filter="url(#glow2)"/>
                            </g>
                            
                            <!-- ProofCaptcha Text -->
                            <text x="65" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="white" letter-spacing="-0.5">
                              Proof<tspan fill="rgba(255,255,255,0.9)">Captcha</tspan>
                            </text>
                            
                            <!-- Tagline -->
                            <text x="65" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">
                              ADVANCED BOT PROTECTION
                            </text>
                            
                            <!-- Glow filter -->
                            <defs>
                              <filter id="glow2">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                          </svg>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Main content -->
                    <tr>
                      <td style="padding: 48px 40px;">
                        <!-- Greeting -->
                        <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">
                          Reset Password 🔐
                        </h2>
                        <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Halo, <strong>${name}</strong>!
                        </p>
                        <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode verifikasi di bawah ini untuk melanjutkan proses reset password.
                        </p>
                        
                        <!-- Reset code card -->
                        <div style="background: linear-gradient(135deg, #fff4ed 0%, #ffe8d9 100%); border: 2px solid #fed7aa; border-radius: 16px; padding: 32px; text-align: center; margin: 32px 0; position: relative; overflow: hidden;">
                          <!-- Decorative gradient overlay -->
                          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);"></div>
                          
                          <div style="display: inline-block; background: rgba(249, 115, 22, 0.1); padding: 8px 16px; border-radius: 20px; margin-bottom: 16px;">
                            <p style="margin: 0; color: #ea580c; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Kode Reset Password</p>
                          </div>
                          
                          <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin: 16px 0; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);">
                            <p style="margin: 0; color: #ea580c; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', Consolas, monospace; text-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);">
                              ${code}
                            </p>
                          </div>
                          
                          <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 4px;">
                              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" fill="#f59e0b"/>
                            </svg>
                            Kode ini akan <strong style="color: #f59e0b;">kadaluarsa dalam 15 menit</strong>
                          </p>
                        </div>
                        
                        <!-- Action steps -->
                        <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
                          <p style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 15px; font-weight: 700;">
                            📋 Langkah Selanjutnya:
                          </p>
                          <ol style="margin: 0; padding-left: 20px; color: #075985; font-size: 14px; line-height: 1.8;">
                            <li>Masukkan kode 6 digit di atas pada halaman verifikasi</li>
                            <li>Buat password baru yang kuat dan unik</li>
                            <li>Simpan password Anda dengan aman</li>
                          </ol>
                        </div>
                        
                        <!-- Security notice -->
                        <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
                          <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                            <strong style="color: #7f1d1d;">⚠️ Peringatan Keamanan:</strong><br>
                            Jangan bagikan kode ini kepada siapa pun, termasuk staf ProofCaptcha. Kami tidak akan pernah meminta kode reset password Anda.
                          </p>
                        </div>
                        
                        <!-- Didn't request notice -->
                        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                            <strong>Tidak melakukan permintaan reset password?</strong><br>
                            <span style="color: #9ca3af;">Segera amankan akun Anda dengan mengganti password. Abaikan email ini jika Anda sudah mengamankan akun.</span>
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 32px 40px; background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%); border-top: 1px solid #e5e7eb;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="text-align: center; padding-bottom: 16px;">
                              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Butuh Bantuan?</p>
                              <a href="mailto:support@proofcaptcha.com" style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: 500;">support@proofcaptcha.com</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="text-align: center; padding: 16px 0; border-top: 1px solid #e5e7eb;">
                              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                © ${new Date().getFullYear()} ProofCaptcha. All rights reserved.<br>
                                Email otomatis, mohon tidak membalas.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Bottom spacing -->
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                    <tr>
                      <td style="padding: 24px 0; text-align: center;">
                        <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 12px;">
                          Powered by ProofCaptcha Security
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
