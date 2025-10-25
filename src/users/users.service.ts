import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
// import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAllUsers(): Promise<User[]> {
        const users = await this.usersRepository.find();
    if (users.length === 0) {
      throw new NotFoundException('No users found.');
    }
    return users;
  }  

  async findUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: id });
    if (!user) {
      throw new NotFoundException(`No user with id of ${id} found.`);
    }
    return user;
  }

  async findUserByMail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ email: email });
    return user;
  }

  async create(userData: {
    email: string;
    password: string;
    admin?: boolean;
  }): Promise<User> {
    const { email, password, admin = false } = userData;

    // Check if user with this email already exists
    const existingUser = await this.usersRepository.findOneBy({ email: email });
    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists.`);
    }

    const user = this.usersRepository.create({ email, password, admin });
    await this.usersRepository.save(user);
    return user;
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.usersRepository.increment({ id: userId }, 'tokenVersion', 1);
  }

  async updateUser(id: string, body: Partial<User>): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: id });
    if (!user) {
      throw new NotFoundException(`No user with id of ${id} found.`);
    }
    Object.assign(user, body);
    await this.usersRepository.save(user);
    return user;
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: id });
    if (!user) {
      throw new NotFoundException(`No user with id of ${id} found.`);
    }
    return this.usersRepository.remove(user);
  }
}
