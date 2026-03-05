import { IsString } from "class-validator";

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class TokenResponseDto {
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

export class ValidateResponseDto {
  valid: boolean;

  userId: string;

  email: string;

  role: string;
}
