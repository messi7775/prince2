import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * BusinessException — خطأ أعمال يحمل code موحّد.
 *
 * يُلتقط في HttpExceptionFilter ويُحوَّل إلى:
 *   { success: false, message, code }
 */
export class BusinessException extends HttpException {
  public readonly code: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    super({ message, code }, statusCode);
    this.code = code;
  }
}
