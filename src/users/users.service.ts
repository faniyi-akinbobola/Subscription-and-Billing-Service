import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
// import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectPinoLogger(UsersService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAllUsers(): Promise<Partial<User>[]> {
    this.logger.info('Fetching all users');
    const users = await this.usersRepository.find();
    if (users.length === 0) {
      this.logger.warn('No users found in database');
      throw new NotFoundException('No users found.');
    }
    this.logger.info(`Found ${users.length} users`);
    // Remove passwords from response
    return users.map(({ password, ...user }) => user);
  }  

  async findUserById(id: string): Promise<Partial<User>> {
    this.logger.info(`Fetching user by ID: ${id}`);
    const user = await this.usersRepository.findOneBy({ id: id });
    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundException(`No user with id of ${id} found.`);
    }
    this.logger.info(`User found: ${user.email}`);
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserByMail(email: string): Promise<User | null> {
    this.logger.info(`Looking up user by email: ${email}`);
    const user = await this.usersRepository.findOneBy({ email: email });
    if (user) {
      this.logger.info(`User found with email: ${email}`);
    } else {
      this.logger.info(`No user found with email: ${email}`);
    }
    return user;
  }

  async create(userData: {
    email: string;
    password: string;
    admin?: boolean;
  }): Promise<Partial<User>> {
    const { email, password, admin = false } = userData;

    this.logger.info(`Creating new user with email: ${email}, admin: ${admin}`);

    // Check if user with this email already exists
    const existingUser = await this.usersRepository.findOneBy({ email: email });
    if (existingUser) {
      this.logger.warn(`User creation failed - email already exists: ${email}`);
      throw new ConflictException(`User with email ${email} already exists.`);
    }

    const user = this.usersRepository.create({ email, password, admin });
    await this.usersRepository.save(user);
    this.logger.info(`User created successfully: ${user.id} (${email})`);
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    this.logger.info(`Incrementing token version for user: ${userId}`);
    await this.usersRepository.increment({ id: userId }, 'tokenVersion', 1);
    this.logger.info(`Token version incremented for user: ${userId}`);
  }

  async updateUser(id: string, body: Partial<User>): Promise<Partial<User>> {
    this.logger.info(`Updating user: ${id}`, { updates: Object.keys(body) });
    const user = await this.usersRepository.findOneBy({ id: id });
    if (!user) {
      this.logger.warn(`Update failed - user not found: ${id}`);
      throw new NotFoundException(`No user with id of ${id} found.`);
    }
    Object.assign(user, body);
    await this.usersRepository.save(user);
    this.logger.info(`User updated successfully: ${id}`);
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<Partial<User>> {
    this.logger.info(`Deleting user: ${id}`);
    const user = await this.usersRepository.findOneBy({ id: id });
    if (!user) {
      this.logger.warn(`Delete failed - user not found: ${id}`);
      throw new NotFoundException(`No user with id of ${id} found.`);
    }
    // Preserve user data before deletion (remove() strips the id)
    const { password, ...userWithoutPassword } = { ...user };
    await this.usersRepository.remove(user);
    this.logger.info(`User deleted successfully: ${id} (${userWithoutPassword.email})`);
    return userWithoutPassword;
  }
}
