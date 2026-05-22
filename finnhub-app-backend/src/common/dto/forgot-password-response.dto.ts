import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'If that email is registered, a reset link has been sent.',
  })
  message!: string;

  @ApiProperty({
    description: '[Dev only] Raw reset token — remove before production',
    example: 'abc123token',
  })
  resetToken!: string;
}
