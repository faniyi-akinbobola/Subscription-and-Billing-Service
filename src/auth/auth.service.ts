import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(
    signupDto: SignupDto,
  ): Promise<{ user: Partial<User>; message: string }> {
    const { email, password, admin = false } = signupDto;

    this.logger.info(`Signup attempt for email: ${email}, admin: ${admin}`);

    // Check if user already exists
    const existingUser = await this.usersService.findUserByMail(email);
    if (existingUser) {
      this.logger.warn(`Signup failed - email already exists: ${email}`);
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      admin,
    });

    this.logger.info(`User signed up successfully: ${user.id} (${email})`);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      message: 'User created successfully. Please sign in to get access token.',
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    this.logger.info(`Validating credentials for email: ${email}`);
    const user = await this.usersService.findUserByMail(email);
    if (!user) {
      this.logger.warn(`Validation failed - user not found: ${email}`);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Validation failed - invalid password for: ${email}`);
      return null;
    }

    this.logger.info(`User validated successfully: ${email}`);
    const { password: _, ...result } = user;
    return result;
  }

  async signin(user: any): Promise<{ user: any; access_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
      isAdmin: user.admin, // Include admin flag in JWT
    };

    const token = this.jwtService.sign(payload);
    this.logger.info(`User signed in successfully: ${user.email} (${user.id})`);

    return {
      user,
      access_token: token,
    };
  }

  async signout(userId: string): Promise<{ message: string }> {
    this.logger.info(`User signout initiated: ${userId}`);
    // Increment token version to invalidate all existing JWTs
    await this.usersService.incrementTokenVersion(userId);
    this.logger.info(`User signed out successfully (all tokens invalidated): ${userId}`);

    return { message: 'Successfully signed out' };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    this.logger.info(`Validating JWT payload for user: ${payload.sub}`);
    const user = await this.usersService.findUserById(payload.sub);

    if (!user) {
      this.logger.warn(`JWT validation failed - user not found: ${payload.sub}`);
      return null;
    }

    // Check if token version matches (for instant JWT invalidation)
    if (user.tokenVersion !== payload.tokenVersion) {
      this.logger.warn(`JWT validation failed - token version mismatch for user: ${payload.sub}`);
      return null;
    }

    this.logger.info(`JWT validated successfully for user: ${user.email}`);
    const { password, ...result } = user;
    return result;
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    this.logger.info(`Fetching profile for user: ${userId}`);
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      this.logger.warn(`Profile fetch failed - user not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    const { password, ...profile } = user;
    this.logger.info(`Profile retrieved successfully for user: ${user.email}`);
    return profile;
  }
}
