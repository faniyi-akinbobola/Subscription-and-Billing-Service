import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashed_password',
    tokenVersion: 0,
    admin: false,
    subscriptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findUserByMail: jest.fn(),
    create: jest.fn(),
    findUserById: jest.fn(),
    incrementTokenVersion: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const signupDto: SignupDto = {
        email: 'new@example.com',
        password: 'password123',
        admin: false,
      };

      mockUsersService.findUserByMail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.signup(signupDto);

      expect(mockUsersService.findUserByMail).toHaveBeenCalledWith(
        signupDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 12);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: signupDto.email,
        password: 'hashed_password',
        admin: false,
      });
      expect(result.user).not.toHaveProperty('password');
      expect(result.message).toBe(
        'User created successfully. Please sign in to get access token.',
      );
    });

    it('should create an admin user when admin flag is true', async () => {
      const signupDto: SignupDto = {
        email: 'admin@example.com',
        password: 'password123',
        admin: true,
      };

      mockUsersService.findUserByMail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      const adminUser = { ...mockUser, admin: true };
      mockUsersService.create.mockResolvedValue(adminUser);

      await service.signup(signupDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: signupDto.email,
        password: 'hashed_password',
        admin: true,
      });
    });

    it('should use default admin value when not provided', async () => {
      const signupDto: SignupDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      mockUsersService.findUserByMail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUsersService.create.mockResolvedValue(mockUser);

      await service.signup(signupDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: signupDto.email,
        password: 'hashed_password',
        admin: false,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      const signupDto: SignupDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUsersService.findUserByMail.mockResolvedValue(mockUser);

      await expect(service.signup(signupDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockUsersService.findUserByMail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findUserByMail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null when user does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockUsersService.findUserByMail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findUserByMail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockUsersService.findUserByMail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findUserByMail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe('signin', () => {
    it('should return user and access token', async () => {
      const user = { ...mockUser };
      delete (user as any).password; // Simulate user without password
      const mockToken = 'jwt_token_123';

      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.signin(user);

      const expectedPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion,
        isAdmin: user.admin,
      };

      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(result.user).toEqual(user);
      expect(result.access_token).toBe(mockToken);
    });

    it('should include admin flag in JWT payload', async () => {
      const adminUser = { ...mockUser, admin: true };
      delete (adminUser as any).password;
      const mockToken = 'admin_jwt_token_123';

      mockJwtService.sign.mockReturnValue(mockToken);

      await service.signin(adminUser);

      const expectedPayload: JwtPayload = {
        sub: adminUser.id,
        email: adminUser.email,
        tokenVersion: adminUser.tokenVersion,
        isAdmin: true,
      };

      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
    });
  });

  describe('signout', () => {
    it('should increment token version and return success message', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUsersService.incrementTokenVersion.mockResolvedValue(undefined);

      const result = await service.signout(userId);

      expect(mockUsersService.incrementTokenVersion).toHaveBeenCalledWith(
        userId,
      );
      expect(result.message).toBe('Successfully signed out');
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user without password when JWT payload is valid', async () => {
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        tokenVersion: mockUser.tokenVersion,
        isAdmin: mockUser.admin,
      };

      mockUsersService.findUserById.mockResolvedValue(mockUser);

      const result = await service.validateJwtPayload(payload);

      expect(mockUsersService.findUserById).toHaveBeenCalledWith(payload.sub);
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null when user does not exist', async () => {
      const payload: JwtPayload = {
        sub: 'non-existent-id',
        email: 'test@example.com',
        tokenVersion: 0,
        isAdmin: false,
      };

      mockUsersService.findUserById.mockResolvedValue(null);

      const result = await service.validateJwtPayload(payload);

      expect(mockUsersService.findUserById).toHaveBeenCalledWith(payload.sub);
      expect(result).toBeNull();
    });

    it('should return null when token version does not match', async () => {
      const payload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        tokenVersion: 5, // Different from user's tokenVersion (0)
        isAdmin: mockUser.admin,
      };

      mockUsersService.findUserById.mockResolvedValue(mockUser);

      const result = await service.validateJwtPayload(payload);

      expect(mockUsersService.findUserById).toHaveBeenCalledWith(payload.sub);
      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUsersService.findUserById.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(mockUsersService.findUserById).toHaveBeenCalledWith(userId);
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.admin).toBe(mockUser.admin);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const userId = 'non-existent-id';
      mockUsersService.findUserById.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );

      expect(mockUsersService.findUserById).toHaveBeenCalledWith(userId);
    });
  });
});
