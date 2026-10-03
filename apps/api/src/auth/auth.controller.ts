import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  loginSchema,
  changePasswordSchema,
  type LoginInput,
  type ChangePasswordInput,
} from '@prince-net/validation';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { CsrfService } from '../csrf/csrf.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
  ) {}

  @Public()
  @Get('csrf')
  getCsrf(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): { csrfToken: string } {
    const csrfToken = this.csrfService.generateToken(req, res);
    return { csrfToken };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: { id: string; email: string } }> {
    return this.authService.login({
      email: body.email,
      password: body.password,
      req,
      res,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(res);
  }

  @Get('me')
  async me(
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<{ user: { id: string; email: string } }> {
    return this.authService.me(user.userId);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: ChangePasswordInput,
    @CurrentUser() user: { userId: string; email: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.changePassword({
      userId: user.userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      req,
      res,
    });
  }
}
