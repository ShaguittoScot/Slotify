export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterAdminRequest {
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterClientRequest {
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ExchangeTokenRequest {
  userId: string;
  email: string;
}

export interface AuthResponse {
  user: any;
  session: any;
}
