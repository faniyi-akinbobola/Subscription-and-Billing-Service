import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Create a new user account',
    description:
      'Register a new user with email, password, and basic information',
  })
  @ApiBody({
    description: 'User signup information',
    type: SignupDto,
    examples: {
      example1: {
        summary: 'Basic signup',
        value: {
          email: 'user@example.com',
          password: 'securePassword123',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or email already exists',
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in to get JWT token',
    description: 'Authenticate user credentials and return JWT access token',
  })
  @ApiBody({
    description: 'User login credentials',
    type: SigninDto,
    examples: {
      example1: {
        summary: 'User login',
        value: {
          email: 'user@example.com',
          password: 'securePassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully signed in',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT token for API authentication',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  async signin(@Request() req, @Body() signinDto: SigninDto) {
    return this.authService.signin(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Sign out user',
    description: 'Invalidate JWT token and sign out user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully signed out',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully signed out' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  async signout(@Request() req) {
    return this.authService.signout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve current user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        tokenVersion: { type: 'number', example: 1 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
