import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

// For Docker internal network communication
const isDocker =
  process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true';

export default new DataSource({
  type: 'postgres',
  host: isDocker ? 'postgres' : process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'subscription_db',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
