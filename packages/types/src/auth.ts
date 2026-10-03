import type { UUID } from "./common";
export interface AuthUser { id: UUID; email: string; }
export interface LoginResponse { user: AuthUser; }
export interface MeResponse { user: AuthUser; }
export interface ChangePasswordInput { currentPassword: string; newPassword: string; confirmPassword: string; }
