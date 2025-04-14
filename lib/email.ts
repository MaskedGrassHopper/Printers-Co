import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100,
});

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
      headers: {
        'X-Priority': '3', // Normal priority
      },
    });

    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
} 