export type UserRole = "user" | "manager" | "admin";

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
  image: string | null;
}

export interface UpdateUserPayload {
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

export interface UserManagementError {
  success: false;
  error: string;
  details?: string;
}