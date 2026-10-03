import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import type { ApiErrorResponse } from '@prince-net/types';
import { BusinessException } from '../exceptions/business.exception';

/**
 * HttpExceptionFilter — يحوّل كل الأخطاء إلى شكل موحّد:
 *   { success: false, message, code, details? }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<{
      status: (code: number) => {
        json: (body: ApiErrorResponse) => void;
      };
    }>();

    const request = ctx.getRequest<{
      method?: string;
      url?: string;
    }>();

    const payload = this.buildPayload(exception);

    const logMessage = `${request.method ?? '-'} ${request.url ?? '-'} → ${payload.statusCode} ${payload.body.code}`;

    if (payload.statusCode >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(logMessage);
    }

    response.status(payload.statusCode).json(payload.body);
  }

  private buildPayload(exception: unknown): {
    statusCode: number;
    body: ApiErrorResponse;
  } {
    // 1. BusinessException
    if (exception instanceof BusinessException) {
      return {
        statusCode: exception.getStatus(),
        body: {
          success: false,
          message: exception.message,
          code: exception.code,
        },
      };
    }

    // 2. HttpException (Nest)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();

      let message = 'Request failed';
      let code = this.codeFromStatus(status);
      let details: Record<string, unknown> | undefined;

      if (typeof raw === 'string') {
        message = raw;
      } else if (raw !== null && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;

        if (typeof obj.message === 'string') {
          message = obj.message;
        } else if (Array.isArray(obj.message)) {
          message = obj.message.join('; ');
        }

        if (typeof obj.code === 'string') {
          code = obj.code;
        }

        if (obj.details && typeof obj.details === 'object') {
          details = obj.details as Record<string, unknown>;
        }
      }

      return {
        statusCode: status,
        body: {
          success: false,
          message,
          code,
          ...(details ? { details } : {}),
        },
      };
    }

    // 3. http-errors (e.g. csrf-csrf ForbiddenError) — has statusCode & expose
    if (
      exception instanceof Error &&
      typeof (exception as { statusCode?: unknown }).statusCode === 'number' &&
      !(exception instanceof HttpException)
    ) {
      const err = exception as Error & {
        statusCode: number;
        expose?: boolean;
        code?: string;
      };
      const status = err.statusCode;
      const message = err.expose ? err.message : 'حدث خطأ داخلي في الخادم';
      return {
        statusCode: status,
        body: {
          success: false,
          message,
          code: err.code ?? this.codeFromStatus(status),
        },
      };
    }

    // 4. Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaError(exception);
    }

    // 4. Unknown — never expose internal exception details to clients.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        message: 'حدث خطأ داخلي في الخادم',
        code: 'INTERNAL_ERROR',
      },
    };
  }

  private fromPrismaError(
    err: Prisma.PrismaClientKnownRequestError,
  ): {
    statusCode: number;
    body: ApiErrorResponse;
  } {
    switch (err.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          body: {
            success: false,
            message: 'القيمة موجودة مسبقًا',
            code: 'UNIQUE_VIOLATION',
          },
        };

      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          body: {
            success: false,
            message: 'لا يمكن تنفيذ العملية بسبب ارتباط هذا العنصر ببيانات أخرى',
            code: 'FOREIGN_KEY_VIOLATION',
          },
        };

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          body: {
            success: false,
            message: 'العنصر غير موجود',
            code: 'NOT_FOUND',
          },
        };

      default:
        this.logger.error(
          `Unhandled Prisma error code: ${err.code}`,
          err.stack,
        );

        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            success: false,
            message: 'حدث خطأ داخلي في الخادم',
            code: 'DATABASE_ERROR',
          },
        };
    }
  }

  private codeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';

      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';

      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.CONFLICT:
        return 'CONFLICT';

      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';

      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';

      default:
        return 'HTTP_ERROR';
    }
  }
}