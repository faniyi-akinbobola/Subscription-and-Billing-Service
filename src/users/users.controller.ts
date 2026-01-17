import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Query,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard) // Protect all user routes
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AdminGuard)
  @Get()
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get('/by-email/:email')
  async findUserByEmail(@Param('email') email: string) {
    const user = await this.usersService.findUserByMail(email);
    if (!user) {
      throw new NotFoundException(`No user with email of ${email} found.`);
    }
    return user;
  }

  @UseGuards(AdminGuard)
  @Get('/:id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(180) // Cache for 3 minutes (user data changes moderately)
  findUserById(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  @UseGuards(AdminGuard)
  @Post('/create')
  createUser(@Body() body: CreateUserDto) {
    return this.usersService.create({
      email: body.email,
      password: body.password,
      admin: body.admin,
    });
  }

  @UseGuards(AdminGuard)
  @Patch('/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.updateUser(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete('/:id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
