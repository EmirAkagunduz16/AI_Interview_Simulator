// ===========================
// Auth Types
// ===========================

export interface ITokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface ITokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}
