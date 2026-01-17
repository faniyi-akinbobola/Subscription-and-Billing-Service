import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PinoLogger } from 'nestjs-pino';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  // Factory function to create fresh mock users
  const createMockUser = (): User => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashed_password',
    tokenVersion: 0,
    admin: false,
    subscriptions: [],
    createdAt: new Date('2026-01-17T11:48:59.468Z'),
    updatedAt: new Date('2026-01-17T11:48:59.468Z'),
  });

  const mockUser = createMockUser();

  // Expected user without password (what service returns)
  const mockUserWithoutPassword = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    tokenVersion: 0,
    admin: false,
    subscriptions: [],
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  const mockUserRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    increment: jest.fn(),
    remove: jest.fn(),
  };

  const mockPinoLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: `PinoLogger:UsersService`,
          useValue: mockPinoLogger,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllUsers', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAllUsers();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockUserWithoutPassword]);
    });

    it('should throw NotFoundException when no users found', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      await expect(service.findAllUsers()).rejects.toThrow(
        new NotFoundException('No users found.'),
      );
    });
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findUserById(userId);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should throw NotFoundException when user not found by id', async () => {
      const userId = 'non-existent-id';
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findUserById(userId)).rejects.toThrow(
        new NotFoundException(`No user with id of ${userId} found.`),
      );
    });
  });

  describe('findUserByMail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findUserByMail(email);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      const email = 'nonexistent@example.com';
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findUserByMail(email);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        admin: false,
      };

      mockUserRepository.findOneBy.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(userData);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        email: userData.email,
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        admin: false,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should create a user with admin flag when provided', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'password123',
        admin: true,
      };

      mockUserRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ ...mockUser, admin: true });
      mockUserRepository.save.mockResolvedValue({ ...mockUser, admin: true });

      await service.create(userData);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        admin: true,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(service.create(userData)).rejects.toThrow(
        new ConflictException(
          `User with email ${userData.email} already exists.`,
        ),
      );

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('incrementTokenVersion', () => {
    it('should increment token version for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockUserRepository.increment.mockResolvedValue(undefined);

      await service.incrementTokenVersion(userId);

      expect(mockUserRepository.increment).toHaveBeenCalledWith(
        { id: userId },
        'tokenVersion',
        1,
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { email: 'updated@example.com', admin: true };
      const updatedUser = { ...mockUser, ...updateData };
      const updatedUserWithoutPassword = { ...mockUserWithoutPassword, ...updateData };

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateData);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedUserWithoutPassword);
    });

    it('should throw NotFoundException when user to update not found', async () => {
      const userId = 'non-existent-id';
      const updateData = { email: 'updated@example.com' };

      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateData)).rejects.toThrow(
        new NotFoundException(`No user with id of ${userId} found.`),
      );

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      // Create a fresh copy to avoid mutations from previous tests
      const userToDelete = createMockUser();

      mockUserRepository.findOneBy.mockResolvedValue(userToDelete);
      mockUserRepository.remove.mockResolvedValue(userToDelete);

      const result = await service.deleteUser(userId);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(userToDelete);
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should throw NotFoundException when user to delete not found', async () => {
      const userId = 'non-existent-id';

      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(
        new NotFoundException(`No user with id of ${userId} found.`),
      );

      expect(mockUserRepository.remove).not.toHaveBeenCalled();
    });
  });
});
