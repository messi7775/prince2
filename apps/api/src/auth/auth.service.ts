import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { verify, hash } from '@node-rs/argon2';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import type { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly config: ConfigService,
  ) {}

  async login(params: {
    email: string;
    password: string;
    req: Request;
    res: Response;
  }): Promise<{ user: { id: string; email: string } }> {
    const { email, password, req, res } = params;

    const user = await this.usersService.findByEmail(email);

    // الخيار B: لا نُسجّل LOGIN_FAILED لبريد غير موجود
    if (!user) {
      throw new UnauthorizedException({
        message: 'بيانات الدخول غير صحيحة',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isValid = await verify(user.passwordHash, password);

    if (!isValid) {
      await this.auditService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
      });

      throw new UnauthorizedException({
        message: 'بيانات الدخول غير صحيحة',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };

    const token = await this.jwtService.signAsync(payload);

    this.setAuthCookie(res, token);

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    return { user: { id: user.id, email: user.email } };
  }

  async logout(res: Response): Promise<void> {
    this.clearAuthCookie(res);
  }

  async me(userId: string): Promise<{ user: { id: string; email: string } }> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException({
        message: 'الجلسة غير صالحة',
        code: 'UNAUTHORIZED',
      });
    }

    return { user: { id: user.id, email: user.email } };
  }

  async changePassword(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    req: Request;
    res: Response;
  }): Promise<void> {
    const { userId, currentPassword, newPassword, req, res } = params;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        message: 'الجلسة غير صالحة',
        code: 'UNAUTHORIZED',
      });
    }

    const isValid = await verify(user.passwordHash, currentPassword);
    if (!isValid) {
      throw new UnauthorizedException({
        message: 'كلمة المرور الحالية غير صحيحة',
        code: 'INVALID_CURRENT_PASSWORD',
      });
    }

    const newHash = await hash(newPassword);
    await this.usersService.updatePassword(userId, newHash);

    await this.auditService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    // تحديث كلمة المرور زاد tokenVersion، وبالتالي تصبح جميع JWT القديمة غير صالحة.
    // نمسح أيضًا Cookie الحالية حتى يُطلب تسجيل دخول جديد.
    this.clearAuthCookie(res);
  }

  private setAuthCookie(res: Response, token: string): void {
    const cookieName = this.config.get<string>(
      'JWT_COOKIE_NAME',
      'prince_net_token',
    );
    const maxAge = this.parseExpiresIn(
      this.config.get<string>('JWT_EXPIRES_IN', '7d'),
    );
    const isProduction =
      this.config.get<string>('NODE_ENV') === 'production';
    const sameSite = this.config.get<string>('COOKIE_SAME_SITE', 'lax') as
      | 'lax'
      | 'strict'
      | 'none';
    const secure =
      isProduction ||
      this.config.get<string>('COOKIE_SECURE') === 'true';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge,
    });
  }

  private clearAuthCookie(res: Response): void {
    const cookieName = this.config.get<string>(
      'JWT_COOKIE_NAME',
      'prince_net_token',
    );
    const isProduction =
      this.config.get<string>('NODE_ENV') === 'production';
    const sameSite = this.config.get<string>('COOKIE_SAME_SITE', 'lax') as
      | 'lax'
      | 'strict'
      | 'none';
    const secure =
      isProduction ||
      this.config.get<string>('COOKIE_SECURE') === 'true';

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
    });
  }

  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const num = parseInt(match[1] ?? '7', 10);
    const unit = match[2] ?? 'd';

    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return num * (units[unit] ?? units.d!);
  }
}
