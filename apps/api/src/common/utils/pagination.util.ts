import type { PaginationMeta } from '@prince-net/types';

export const DEFAULT_PAGE_LIMIT = 25;
export const MAX_PAGE_LIMIT = 100;

export interface PaginationInput {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
  search: string | null;
  sort: string | null;
  order: 'asc' | 'desc';
}

/**
 * يُنظّف مدخلات pagination ويحوّلها إلى قيم Prisma-ready.
 */
export function normalizePagination(
  input: PaginationInput = {},
): NormalizedPagination {
  const rawPage = input.page ?? 1;
  const rawLimit = input.limit ?? DEFAULT_PAGE_LIMIT;

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), MAX_PAGE_LIMIT)
      : DEFAULT_PAGE_LIMIT;

  const skip = (page - 1) * limit;
  const take = limit;

  const search = input.search?.trim() ? input.search.trim() : null;
  const sort = input.sort?.trim() ? input.sort.trim() : null;
  const order: 'asc' | 'desc' = input.order === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip, take, search, sort, order };
}

/**
 * يبني meta للردود paginated.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return { page, limit, total, totalPages };
}
