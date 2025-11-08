import nodemailer from 'nodemailer';
import { env } from './env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587'),
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  await transporter.sendMail({
    from: `SlotSwapper <${env.SMTP_FROM}>`,
    ...options
  });
};

export const swapRequestEmail = (userName: string, eventTitle: string) => ({
  subject: 'New Swap Request',
  html: `
    <h2>New Swap Request</h2>
    <p>${userName} wants to swap their event for your "${eventTitle}".</p>
    <a href="${env.FRONTEND_URL}/requests">View Request</a>
  `
});

export const swapAcceptedEmail = (userName: string, eventTitle: string) => ({
  subject: 'Swap Request Accepted',
  html: `
    <h2>Swap Request Accepted</h2>
    <p>Your swap request for "${eventTitle}" has been accepted.</p>
    <a href="${env.FRONTEND_URL}/events">View Events</a>
  `
});

export const swapRejectedEmail = (userName: string, eventTitle: string) => ({
  subject: 'Swap Request Rejected',
  html: `
    <h2>Swap Request Rejected</h2>
    <p>Your swap request for "${eventTitle}" has been rejected.</p>
    <a href="${env.FRONTEND_URL}/marketplace">Browse More Events</a>
  `
});

export const welcomeEmail = (userName: string) => ({
  subject: 'Welcome to SlotSwapper!',
  html: `
    <h2>Welcome to SlotSwapper!</h2>
    <p>Hello ${userName},</p>
    <p>Thank you for joining SlotSwapper. You can now start swapping your schedule slots with others.</p>
    <a href="${env.FRONTEND_URL}/dashboard">Get Started</a>
  `
});