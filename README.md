# 🚀 Subscription & Billing Service# 🚀 Subscription & Billing Service

A comprehensive **NestJS-based subscription and billing service** with **Stripe integration**, automated email notifications, and robust payment processing capabilities.A comprehensive **NestJS-based subscription and billing service** with **Stripe integration**, automated email notifications, and robust payment processing capabilities.

## ✨ Features## ✨ Features

### 🔐 **Authentication & Security**[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

- JWT-based authentication with secure token management

- Password hashing with bcrypt## Project setup

- Route protection with guards

- Input validation with class-validator```bash

$ npm install

### 💳 **Payment Processing**```

- **Stripe Integration**: Payment intents, checkout sessions, subscriptions

- **Multiple Payment Methods**: Cards, wallets, and more## Compile and run the project

- **Subscription Management**: Create, update, cancel, and renew subscriptions

- **Webhook Support**: Real-time payment event processing```bash

- **Invoice Management**: Automated invoice generation and retrieval# development

$ npm run start

### 📧 **Email Automation**

- **Receipt Emails**: Automated payment confirmation emails# watch mode

- **Renewal Reminders**: Subscription renewal notifications$ npm run start:dev

- **Professional Templates**: Beautiful HTML email templates

- **Multi-provider Support**: Gmail SMTP, SendGrid, and more# production mode

$ npm run start:prod

### 🏗️ **Architecture**```

- **Modular Design**: Clean separation of concerns

- **Database**: PostgreSQL with TypeORM## Run tests

- **Caching**: Redis for improved performance

- **Containerization**: Full Docker support with docker-compose```bash

- **Monitoring**: Comprehensive logging and error handling# unit tests

$ npm run test

### 📊 **Billing System**

- **Billing History**: Track all customer transactions# e2e tests

- **Automated Processing**: Real-time billing record creation$ npm run test:e2e

- **Renewal Management**: Automated subscription renewals

- **Email Notifications**: Payment receipts and renewal reminders# test coverage

$ npm run test:cov

## 🛠️ Technology Stack```

| Component | Technology | Version |## Deployment

|-----------|------------|---------|

| **Framework** | NestJS | ^11.0.1 |When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

| **Language** | TypeScript | ^5.7.3 |

| **Database** | PostgreSQL | 15-alpine |If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

| **ORM** | TypeORM | ^0.3.27 |

| **Cache** | Redis | 7-alpine |```bash

| **Payments** | Stripe | ^19.3.0 |$ npm install -g @nestjs/mau

| **Email** | Nodemailer | ^7.0.10 |$ mau deploy

| **Authentication** | JWT + Passport | Latest |```

| **Validation** | class-validator | ^0.14.2 |

| **Testing** | Jest | ^30.0.0 |With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

| **Containerization** | Docker + docker-compose | Latest |

## Resources

## 🚀 Quick Start

Check out a few resources that may come in handy when working with NestJS:

### Prerequisites

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.

- **Docker** and **Docker Compose** installed- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).

- **Node.js** 18+ (for local development)- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).

- **Stripe Test Account** (free at stripe.com)- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.

- **Gmail Account** (for email functionality)- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).

- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).

### 1. Clone the Repository- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).

- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

````bash

git clone https://github.com/faniyi-akinbobola/Subscription-and-Billing-Service.git## Support

cd Subscription-and-Billing-Service

```Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).



### 2. Environment Setup## Stay in touch



```bash- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)

# Copy the example environment file- Website - [https://nestjs.com](https://nestjs.com/)

cp .env.example .env- Twitter - [@nestframework](https://twitter.com/nestframework)



# Edit the .env file with your configuration## License

# See Environment Configuration section below for details

```Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).


### 3. Docker Setup (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Application)
docker-compose up -d

# Check if all containers are running
docker-compose ps

# View application logs
docker logs subscription-service -f
````

### 4. Database Migration

```bash
# Run database migrations
docker-compose exec app npm run migration:run

# Or using local npm
npm run docker:migration:run
```

### 5. Test the Service

```bash
# Create a test user
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Sign in to get a JWT token
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_NAME=subscription_db

# Stripe (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (Gmail configuration)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your-email@gmail.com
EMAIL_SECURE=false
```

### Setting up Stripe

1. **Create a Stripe Account**: Visit [stripe.com](https://stripe.com) and create a free account
2. **Get API Keys**: Go to Dashboard → Developers → API keys
3. **Copy Test Keys**: Use test keys (they start with `sk_test_` and `pk_test_`)
4. **Webhook Setup**: Create a webhook endpoint pointing to `http://your-domain/payments/webhooks`

### Setting up Gmail for Email

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**: Google Account → Security → App passwords
3. **Use App Password**: Use the generated 16-character password in `EMAIL_PASS`

## 📚 API Documentation

### Authentication

| Endpoint       | Method | Description               |
| -------------- | ------ | ------------------------- |
| `/auth/signup` | POST   | Create new user account   |
| `/auth/signin` | POST   | Sign in and get JWT token |

### Payments

| Endpoint                      | Method           | Description             |
| ----------------------------- | ---------------- | ----------------------- |
| `/payments/customers`         | POST             | Create Stripe customer  |
| `/payments/payment-intents`   | POST             | Create payment intent   |
| `/payments/checkout-sessions` | POST             | Create checkout session |
| `/payments/subscriptions`     | POST             | Create subscription     |
| `/payments/subscriptions/:id` | GET/PATCH/DELETE | Manage subscriptions    |

### Billing

| Endpoint                          | Method | Description           |
| --------------------------------- | ------ | --------------------- |
| `/billings/history/:customerId`   | GET    | Get billing history   |
| `/billings/test/receipt`          | POST   | Send receipt email    |
| `/billings/test/renewal-reminder` | POST   | Send renewal reminder |

### Comprehensive API Testing

See detailed API testing guides:

- 📋 [Complete Stripe Testing Workflow](./STRIPE_TESTING_WORKFLOW.md)
- 🧪 [Billing System Testing Guide](./BILLING-TESTING-GUIDE.md)
- 📊 [Latest Test Report](./BILLING_TEST_REPORT.md)

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart application only
docker-compose restart app

# View logs
docker logs subscription-service --tail 50

# Run migrations
docker-compose exec app npm run migration:run

# Access container shell
docker-compose exec app sh
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

### Integration Tests

```bash
# Run e2e tests
npm run test:e2e
```

### Manual API Testing

Use the provided HTTP test files:

- `stripe-payments.http` - Complete Stripe payment flows
- `test-billing.http` - Billing system testing
- `test-email.http` - Email functionality testing

## 📁 Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── guards/          # JWT and local auth guards
│   ├── strategies/      # Passport strategies
│   └── dto/            # Data transfer objects
├── billings/            # Billing management
│   ├── billings.service.ts
│   ├── billings.controller.ts
│   └── scheduler.service.ts
├── email/               # Email service
│   ├── email.service.ts
│   └── email.module.ts
├── payments/            # Stripe integration
│   ├── payments.service.ts
│   ├── payments.controller.ts
│   └── dto/            # Payment DTOs
├── subscriptions/       # Subscription management
├── users/              # User management
├── plans/              # Subscription plans
├── database/           # Database configuration
├── migrations/         # Database migrations
└── common/             # Shared utilities
```

## 🔧 Development

### Local Development Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

### Creating Migrations

```bash
# Generate migration from entity changes
npm run migration:generate -- src/migrations/MigrationName

# Create empty migration
npm run migration:create -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npx tsc --noEmit
```

## 🚀 Deployment

### Production Checklist

- [ ] Replace all test Stripe keys with live keys
- [ ] Use production-grade database credentials
- [ ] Set up proper SSL certificates
- [ ] Configure production email service
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up CI/CD pipeline

### Environment Variables for Production

```bash
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
# ... other production configs
```

## 📊 Monitoring & Observability

### Health Checks

- **Application**: `GET /health` (if implemented)
- **Database**: Automatic TypeORM health checks
- **Redis**: Cache availability monitoring

### Logging

- **Request/Response**: Automatic HTTP request logging
- **Error Tracking**: Comprehensive error logging with stack traces
- **Stripe Events**: Webhook event logging
- **Email Events**: Email sending status and errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -m "Add new feature"`
7. Push to the branch: `git push origin feature/new-feature`
8. Submit a pull request

## 📖 Additional Documentation

- 📋 [Complete Stripe Integration Guide](./COMPLETE_STRIPE_GUIDE.md)
- 🔄 [Stripe Testing Workflow](./STRIPE_TESTING_WORKFLOW.md)
- 🧪 [Billing Testing Guide](./BILLING-TESTING-GUIDE.md)
- 📊 [Test Reports](./BILLING_TEST_REPORT.md)
- 🐳 [Docker Commands Reference](./DOCKER_COMMANDS.md)

## 🆘 Troubleshooting

### Common Issues

#### Authentication Issues

```bash
# If JWT tokens are not working
docker logs subscription-service | grep -i "auth"

# Reset user and try again
curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d '{"email":"new@example.com","password":"password123"}'
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker logs subscription-postgres

# Restart database
docker-compose restart postgres
```

#### Stripe Issues

- Verify API keys are correct and for test environment
- Check Stripe dashboard for webhook events
- Ensure webhook URL is accessible from internet (use ngrok for local testing)

#### Email Issues

- Verify Gmail app password is correct
- Check that 2FA is enabled on Gmail account
- Review email service logs for SMTP errors

### Getting Help

1. Check the troubleshooting documentation
2. Review application logs: `docker logs subscription-service`
3. Check Stripe dashboard for payment events
4. Open an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - Environment details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Akinbobola Faniyi** - _Initial work_ - [faniyi-akinbobola](https://github.com/faniyi-akinbobola)

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Stripe for comprehensive payment processing
- Docker for containerization
- All contributors and testers

---

## 🚀 Ready to get started?

1. **Clone the repo**
2. **Copy `.env.example` to `.env`**
3. **Add your Stripe test keys**
4. **Run `docker-compose up -d`**
5. **Start building amazing subscription features!**

For detailed setup instructions, see our [Getting Started Guide](#-quick-start) above.

---

⭐ **If this project helped you, please consider giving it a star on GitHub!**
