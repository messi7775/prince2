import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { doubleCsrf, type DoubleCsrfUtilities } from 'csrf-csrf';
import type { Request, Response } from 'express';

const CSRF_COOKIE_NAME = 'prince_net_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * CsrfService — يغلّف csrf-csrf@4 (double-submit cookie pattern).
 *
 * قواعد:
 *  - doubleCsrfProtection يُسجّل كـ Express middleware في main.ts.
 *  - generateCsrfToken(req, res) يُستخدم في GET /auth/csrf (D8-B).
 *  - csrf-csrf@4 يقرأ الـ token افتراضيًا من:
 *      • header: x-csrf-token
 *      • أو body._csrf
 *  - getCsrfTokenFromRequest يقرأ قيمة x-csrf-token المرسلة من الواجهة.
 *  - getSessionIdentifier: معرّف ثابت لتطبيق الإدارة؛ token نفسه عشوائي وموقّع.
 *  - cookie-parser يجب أن يُسجّل قبل doubleCsrfProtection (موجود في main.ts).
 */
@Injectable()
export class CsrfService {
  public readonly utilities: DoubleCsrfUtilities;
  public readonly cookieName = CSRF_COOKIE_NAME;
  public readonly headerName = CSRF_HEADER_NAME;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('CSRF_SECRET');
    if (!secret || secret.length < 16) {
      throw new Error(
        'CSRF_SECRET must be set in .env and be at least 16 characters',
      );
    }

    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const sameSite = this.config.get<string>('COOKIE_SAME_SITE', 'lax') as
      | 'lax'
      | 'strict'
      | 'none';
    const secure = this.config.get<string>('COOKIE_SECURE') === 'true';

    this.utilities = doubleCsrf({
      getSecret: () => secret,
      getSessionIdentifier: () => 'prince-net-admin',
      cookieName: CSRF_COOKIE_NAME,
      cookieOptions: {
        httpOnly: true,
        sameSite,
        secure: isProduction ? true : secure,
        path: '/',
      },
      size: 64,
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
      getCsrfTokenFromRequest: (req: Request): string | undefined => {
        const token = req.get(CSRF_HEADER_NAME);
        return token?.trim() || undefined;
      },
      errorConfig: {
        statusCode: 403,
        message: 'CSRF token invalid or missing',
        code: 'CSRF_INVALID',
      },
    });
  }

  generateToken(req: Request, res: Response): string {
    return this.utilities.generateCsrfToken(req, res);
  }

  get protection() {
    return this.utilities.doubleCsrfProtection;
  }
}
