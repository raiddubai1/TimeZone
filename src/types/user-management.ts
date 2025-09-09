export type UserRole = "user" | "manager" | "admin";

export interface UserManagementData {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserRequest {
  role?: UserRole;
  isActive?: boolean;
  name?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  user: UserManagementData;
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