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
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(
    signupDto: SignupDto,
  ): Promise<{ user: Partial<User>; message: string }> {
    const { email, password, admin = false } = signupDto;

    // Check if user already exists
    const existingUser = await this.usersService.findUserByMail(email);
    if (existingUser) {
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

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      message: 'User created successfully. Please sign in to get access token.',
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findUserByMail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

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

    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async signout(userId: string): Promise<{ message: string }> {
    // Increment token version to invalidate all existing JWTs
    await this.usersService.incrementTokenVersion(userId);

    return { message: 'Successfully signed out' };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findUserById(payload.sub);

    if (!user) {
      return null;
    }

    // Check if token version matches (for instant JWT invalidation)
    if (user.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    const { password, ...result } = user;
    return result;
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...profile } = user;
    return profile;
  }
}
