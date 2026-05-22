import { Body, Controller, Logger, Patch, Post, Request } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ForgotPasswordResponseDto } from 'src/common/dto/forgot-password-response.dto';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';
import { TokenResponseDto } from 'src/common/dto/token-response.dto';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    type: TokenResponseDto,
    description: 'Account created — returns a signed JWT',
  })
  @ApiConflictResponse({ description: 'Email is already registered' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  register(@Body() createUserDto: CreateUserDto): Promise<{ token: string }> {
    return this.userService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and receive a JWT' })
  @ApiOkResponse({
    type: TokenResponseDto,
    description: 'Credentials valid — returns a signed JWT',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  login(@Body() dto: LoginDto): Promise<{ token: string }> {
    return this.userService.login(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Initiate a password-reset flow' })
  @ApiOkResponse({
    type: ForgotPasswordResponseDto,
    description:
      'Reset initiated (same response regardless of whether email exists)',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken: string }> {
    return this.userService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Validate reset token and set a new password' })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Password updated successfully',
  })
  @ApiBadRequestResponse({ description: 'Token expired or validation failed' })
  @ApiNotFoundResponse({ description: 'Token not found or already used' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.userService.resetPassword(dto);
  }

  @Auth()
  @Patch('fcm-token')
  @ApiOperation({ summary: 'Register or refresh the FCM device token' })
  @ApiOkResponse({ type: MessageResponseDto, description: 'FCM token stored' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  registerFcmToken(
    @Request() req: { user: { id: string } },
    @Body() dto: RegisterFcmTokenDto,
  ): Promise<{ message: string }> {
    return this.userService.registerFcmToken(req.user.id, dto);
  }
}
