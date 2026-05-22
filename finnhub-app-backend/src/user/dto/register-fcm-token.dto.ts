import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterFcmTokenDto {
  @ApiProperty({
    description: 'FCM device registration token from the React Native client',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
