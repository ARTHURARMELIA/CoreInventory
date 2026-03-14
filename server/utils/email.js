import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
  return transporter;
}

export async function sendOtpEmail(to, code) {
  const transport = getTransporter();
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'CoreInventory <noreply@coreinventory.com>',
      to,
      subject: 'CoreInventory – Password reset OTP',
      text: `Your OTP for password reset is: ${code}. It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.`,
      html: `<p>Your OTP for password reset is: <strong>${code}</strong>.</p><p>It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>`,
    });
  } catch (e) {
    console.warn('Email send failed (use Ethereal or real SMTP):', e.message);
  }
}
