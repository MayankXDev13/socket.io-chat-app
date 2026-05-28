import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Verify your email — ChatVault',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7c3aed; margin-bottom: 24px;">Welcome to ChatVault!</h1>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">Click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0;">Verify Email</a>
        <p style="color: #94a3b8; font-size: 14px;">This link expires in 24 hours.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 32px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Reset your password — ChatVault',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7c3aed; margin-bottom: 24px;">Password Reset</h1>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0;">Reset Password</a>
        <p style="color: #94a3b8; font-size: 14px;">This link expires in 1 hour.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 32px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}
