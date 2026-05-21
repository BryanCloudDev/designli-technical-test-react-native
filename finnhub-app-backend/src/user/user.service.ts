import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { errorHandler } from 'src/common/error/error-handler';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

/**
 * Service responsible for all user-related business logic.
 *
 * Handles registration, look-up, update, and removal of user records.
 * Passwords are never stored in plain text; bcrypt is used with a salt
 * round of 10 before any value reaches the database.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user and returns a signed JWT for immediate authentication.
   *
   * Steps:
   * 1. Verify the email address is not already taken.
   * 2. Hash the plain-text password with bcrypt (10 salt rounds).
   * 3. Persist the new user entity.
   * 4. Sign a JWT containing the user's UUID as `{ id }`.
   * 5. Return the token to the caller.
   *
   * @param createUserDto - Validated and sanitised registration payload.
   * @returns An object containing the signed JWT string.
   * @throws {ConflictException} When the email address is already registered.
   * @throws {InternalServerErrorException} On any unexpected persistence or signing error.
   */
  async register(createUserDto: CreateUserDto): Promise<{ token: string }> {
    try {
      const { password, ...rest } = createUserDto;

      const existing = await this.userRepository.findOne({
        where: { email: rest.email },
      });

      if (existing) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        ...rest,
        password: hashedPassword,
      });

      await this.userRepository.save(user);

      const payload: JwtPayload = { id: user.id };
      const token = this.jwtService.sign(payload);

      return { token };
    } catch (error) {
      errorHandler('Failed to register user', this.logger, error);
    }
  }
}
