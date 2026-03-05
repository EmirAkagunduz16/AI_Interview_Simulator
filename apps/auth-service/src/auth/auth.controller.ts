import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  TokenResponseDto,
  ValidateResponseDto,
} from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("validate")
  @HttpCode(HttpStatus.OK)
  async validate(
    @Headers("authorization") authHeader: string,
  ): Promise<ValidateResponseDto> {
    const token = authHeader?.replace("Bearer ", "") || "";
    return this.authService.validate(token);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers("authorization") authHeader: string,
  ): Promise<{ message: string }> {
    const token = authHeader?.replace("Bearer ", "") || "";
    await this.authService.logout(token);
    return { message: "Çıkış yapıldı" };
  }
}
