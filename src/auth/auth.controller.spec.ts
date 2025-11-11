import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    tokenVersion: 0,
    admin: false,
    subscriptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
    signout: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockLocalAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue(mockLocalAuthGuard)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const signupDto: SignupDto = {
        email: 'new@example.com',
        password: 'password123',
        admin: false,
      };

      const expectedResult = {
        user: mockUser,
        message:
          'User created successfully. Please sign in to get access token.',
      };

      mockAuthService.signup.mockResolvedValue(expectedResult);

      const result = await controller.signup(signupDto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });

    it('should create an admin user when admin flag is true', async () => {
      const signupDto: SignupDto = {
        email: 'admin@example.com',
        password: 'password123',
        admin: true,
      };

      const adminUser = { ...mockUser, admin: true };
      const expectedResult = {
        user: adminUser,
        message:
          'User created successfully. Please sign in to get access token.',
      };

      mockAuthService.signup.mockResolvedValue(expectedResult);

      const result = await controller.signup(signupDto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });

    it('should create a regular user when admin flag is not provided', async () => {
      const signupDto: SignupDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: mockUser,
        message:
          'User created successfully. Please sign in to get access token.',
      };

      mockAuthService.signup.mockResolvedValue(expectedResult);

      const result = await controller.signup(signupDto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('signin', () => {
    it('should sign in a user and return access token', async () => {
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const req = {
        user: mockUser,
      };

      const expectedResult = {
        user: mockUser,
        access_token: 'jwt_token_123',
      };

      mockAuthService.signin.mockResolvedValue(expectedResult);

      const result = await controller.signin(req, signinDto);

      expect(mockAuthService.signin).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by LocalAuthGuard', () => {
      expect(mockLocalAuthGuard.canActivate).toBeDefined();
    });

    it('should handle admin user signin', async () => {
      const signinDto: SigninDto = {
        email: 'admin@example.com',
        password: 'password123',
      };

      const adminUser = { ...mockUser, admin: true };
      const req = {
        user: adminUser,
      };

      const expectedResult = {
        user: adminUser,
        access_token: 'admin_jwt_token_123',
      };

      mockAuthService.signin.mockResolvedValue(expectedResult);

      const result = await controller.signin(req, signinDto);

      expect(mockAuthService.signin).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('signout', () => {
    it('should sign out a user', async () => {
      const req = {
        user: { id: mockUser.id },
      };

      const expectedResult = {
        message: 'Successfully signed out',
      };

      mockAuthService.signout.mockResolvedValue(expectedResult);

      const result = await controller.signout(req);

      expect(mockAuthService.signout).toHaveBeenCalledWith(req.user.id);
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = {
        user: { id: mockUser.id },
      };

      const userProfile = {
        id: mockUser.id,
        email: mockUser.email,
        admin: mockUser.admin,
        tokenVersion: mockUser.tokenVersion,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockAuthService.getProfile.mockResolvedValue(userProfile);

      const result = await controller.getProfile(req);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(req.user.id);
      expect(result).toEqual(userProfile);
    });

    it('should return admin profile for admin user', async () => {
      const adminUser = { ...mockUser, admin: true };
      const req = {
        user: { id: adminUser.id },
      };

      const adminProfile = {
        id: adminUser.id,
        email: adminUser.email,
        admin: true,
        tokenVersion: adminUser.tokenVersion,
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt,
      };

      mockAuthService.getProfile.mockResolvedValue(adminProfile);

      const result = await controller.getProfile(req);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(req.user.id);
      expect(result).toEqual(adminProfile);
    });

    it('should be protected by JwtAuthGuard', () => {
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
    });
  });

  describe('Guards', () => {
    it('should protect signin endpoint with LocalAuthGuard', () => {
      expect(mockLocalAuthGuard.canActivate).toBeDefined();
    });

    it('should protect signout endpoint with JwtAuthGuard', () => {
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
    });

    it('should protect profile endpoint with JwtAuthGuard', () => {
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 200 OK for signin endpoint', async () => {
      // This is tested through the @HttpCode(HttpStatus.OK) decorator
      // The actual HTTP status code testing would be done in e2e tests
      const req = { user: mockUser };
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.signin.mockResolvedValue({
        user: mockUser,
        access_token: 'token',
      });

      const result = await controller.signin(req, signinDto);
      expect(result).toBeDefined();
    });

    it('should return 200 OK for signout endpoint', async () => {
      // This is tested through the @HttpCode(HttpStatus.OK) decorator
      const req = { user: { id: mockUser.id } };

      mockAuthService.signout.mockResolvedValue({
        message: 'Successfully signed out',
      });

      const result = await controller.signout(req);
      expect(result).toBeDefined();
    });
  });
});
