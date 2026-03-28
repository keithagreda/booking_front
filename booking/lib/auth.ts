import { apiClient } from "./api";
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto } from "./types";

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe(): Promise<UserDto> {
  return apiClient<UserDto>("/api/auth/me");
}
