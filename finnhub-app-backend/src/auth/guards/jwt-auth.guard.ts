import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that enforces JWT authentication on a route.
 *
 * Extends Passport's built-in `AuthGuard('jwt')`, which validates the Bearer
 * token in the `Authorization` header using {@link JwtStrategy}. The resolved
 * {@link User} is attached to `req.user` on success.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
