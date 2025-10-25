import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '.env') });

console.log('Database connection config:', {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  database: process.env.DB_NAME || 'subscription_db',
  password: process.env.DB_PASSWORD ? '***' : 'not found',
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Heavensgate#11',
  database: process.env.DB_NAME || 'subscription_db',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false, // Never use true in production
  logging: true,
});
