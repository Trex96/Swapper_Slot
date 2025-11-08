import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  ALLOWED_ORIGINS: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  FRONTEND_URL: string;
}

const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/slotswapper',
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.example.com',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || 'user@example.com',
  SMTP_PASS: process.env.SMTP_PASS || 'password',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@example.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};

export { env };
export type { EnvConfig };