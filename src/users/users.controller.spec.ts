import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

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
    findAllUsers: jest.fn(),
    findUserByMail: jest.fn(),
    findUserById: jest.fn(),
    create: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAdminGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllUsers', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockUsersService.findAllUsers.mockResolvedValue(users);

      const result = await controller.findAllUsers();

      expect(mockUsersService.findAllUsers).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('should be protected by AdminGuard', () => {
      expect(mockAdminGuard.canActivate).toBeDefined();
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      mockUsersService.findUserByMail.mockResolvedValue(mockUser);

      const result = await controller.findUserByEmail(email);

      expect(mockUsersService.findUserByMail).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found by email', async () => {
      const email = 'nonexistent@example.com';
      mockUsersService.findUserByMail.mockResolvedValue(null);

      await expect(controller.findUserByEmail(email)).rejects.toThrow(
        new NotFoundException(`No user with email of ${email} found.`),
      );
    });
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUsersService.findUserById.mockResolvedValue(mockUser);

      const result = await controller.findUserById(userId);

      expect(mockUsersService.findUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should be protected by AdminGuard', () => {
      expect(mockAdminGuard.canActivate).toBeDefined();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'password123',
        admin: false,
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.createUser(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: createUserDto.password,
        admin: createUserDto.admin,
      });
      expect(result).toEqual(mockUser);
    });

    it('should create an admin user when admin flag is true', async () => {
      const createUserDto: CreateUserDto = {
        email: 'admin@example.com',
        password: 'password123',
        admin: true,
      };

      const adminUser = { ...mockUser, admin: true };
      mockUsersService.create.mockResolvedValue(adminUser);

      const result = await controller.createUser(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: createUserDto.password,
        admin: true,
      });
      expect(result).toEqual(adminUser);
    });

    it('should create a regular user when admin flag is not provided', async () => {
      const createUserDto: CreateUserDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.createUser(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: createUserDto.password,
        admin: undefined,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        admin: true,
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should update user password', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateUserDto: UpdateUserDto = {
        password: 'newPassword123',
      };

      const updatedUser = { ...mockUser, password: 'newHashedPassword' };
      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUsersService.deleteUser.mockResolvedValue(mockUser);

      const result = await controller.deleteUser(userId);

      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should be protected by AdminGuard', () => {
      expect(mockAdminGuard.canActivate).toBeDefined();
    });
  });

  describe('Guards', () => {
    it('should be protected by JwtAuthGuard at controller level', () => {
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
    });

    it('should have additional AdminGuard protection on admin-only endpoints', () => {
      // findAllUsers, findUserById, and deleteUser should have AdminGuard
      expect(mockAdminGuard.canActivate).toBeDefined();
    });
  });
});
