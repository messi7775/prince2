/**
 * الشكل الموحد لأي رد من الـ API.
 */

export interface ApiSuccessResponse<T> { success: true; data: T; }
export interface ApiErrorResponse { success: false; message: string; code: string; details?: Record<string, unknown>; }
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export interface PaginationMeta { page: number; limit: number; total: number; totalPages: number; }
export interface PaginatedResponse<T> { success: true; data: T[]; meta: PaginationMeta; }
export interface PaginationQuery { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc'; }
export type UUID = string; export type ISODateString = string; export type MoneyString = string; export type EntityStatus = 'ACTIVE' | 'INACTIVE';
