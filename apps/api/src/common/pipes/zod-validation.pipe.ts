import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

/**
 * ZodValidationPipe — يتحقق من الجسم/الاستعلام باستخدام Zod schema
 * من @prince-net/validation.
 *
 * يُستخدم:
 *   @Body(new ZodValidationPipe(createSaleSchema)) dto: CreateSaleInput
 *   @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.length > 0 ? issue.path.join('.') : '_';
          const existing = details[path] ?? [];
          existing.push(issue.message);
          details[path] = existing;
        }

        throw new BadRequestException({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details,
        });
      }
      throw err;
    }
  }
}
