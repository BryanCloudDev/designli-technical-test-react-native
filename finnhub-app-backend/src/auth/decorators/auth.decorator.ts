import { applyDecorators, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Protects a route by requiring a valid JWT Bearer token.
 *
 * Apply to a controller class or individual route handler. Requests without
 * a valid token receive a 401 Unauthorized response.
 *
 * @example
 * @Auth()
 * @Get('profile')
 * getProfile() { ... }
 */
export const Auth = () => applyDecorators(UseGuards(JwtAuthGuard));
