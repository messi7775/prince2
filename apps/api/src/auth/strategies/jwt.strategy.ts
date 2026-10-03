import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { UsersService } from '../../users/users.service';
import type { JwtPayload, AuthenticatedUser } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = config.get<string>('JWT_SECRET');

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set in .env and be at least 32 characters',
      );
    }

    const cookieName = config.get<string>(
      'JWT_COOKIE_NAME',
      'prince_net_token',
    );

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const cookies = (
            req as Request & { cookies?: Record<string, string> }
          ).cookies;

          return cookies?.[cookieName] ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (
      !payload?.sub ||
      !payload?.email ||
      !Number.isInteger(payload.tokenVersion)
    ) {
      throw new UnauthorizedException({
        message: 'JWT payload غير صالح',
        code: 'UNAUTHORIZED',
      });
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException({
        message: 'الجلسة غير صالحة',
        code: 'UNAUTHORIZED',
      });
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException({
        message: 'الجلسة غير صالحة',
        code: 'UNAUTHORIZED',
      });
    }

    return {
      userId: user.id,
      email: user.email,
    };
  }
}