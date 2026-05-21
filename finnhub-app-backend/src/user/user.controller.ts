import { Body, Controller, Logger, Post } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Registers a new user account.
   *
   * Accepts the registration payload, delegates to `UserService.register`,
   * and returns a signed JWT that the client can use immediately.
   *
   * @param createUserDto - Validated registration data from the request body.
   * @returns An object containing the signed JWT string.
   */
  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<{ token: string }> {
    return this.userService.register(createUserDto);
  }
}
