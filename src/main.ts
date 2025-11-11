import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for development
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Setup Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Subscription & Billing Service API')
    .setDescription(
      `
      A comprehensive subscription and billing service with Stripe integration.
      
      ## Features
      - 🔐 JWT Authentication
      - 💳 Stripe Payment Processing
      - 📧 Email Notifications
      - 📊 Billing Management
      - 🔄 Subscription Lifecycle
      
      ## Authentication
      Most endpoints require JWT authentication. First sign up/sign in to get your access token.
    `,
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User signup, signin, and profile management')
    .addTag('Payments', 'Stripe integration for payments and subscriptions')
    .addTag('Billing', 'Billing history and email notifications')
    .addTag('Users', 'User management operations')
    .addTag('Subscriptions', 'Subscription management')
    .addTag('Plans', 'Subscription plan management')
    .addBearerAuth(
      {
        description: 'JWT Authorization token',
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'bearer',
        type: 'http',
        in: 'header',
      },
      'access-token',
    )
    .addServer('http://localhost:3000', 'Local Development Server')
    .addServer('https://your-production-domain.com', 'Production Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Subscription Service API',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #e8234e }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
  console.log(`❤️  Health Check: http://localhost:${port}/health`);
}
bootstrap();
