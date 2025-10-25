import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = {
          type: 'postgres' as const,
          host: configService.get('DB_HOST') || 'localhost',
          port: parseInt(configService.get('DB_PORT') || '5432'),
          username: configService.get('DB_USERNAME') || 'postgres',
          password: configService.get('DB_PASSWORD') || 'Heavensgate#11',
          database: configService.get('DB_NAME') || 'subscription_db',
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: false, // Always use migrations in production
          logging: configService.get('NODE_ENV') === 'development',
        };

        console.log('Database Configuration:', {
          ...config,
          password: config.password ? '***' : 'missing',
        });

        return config;
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
