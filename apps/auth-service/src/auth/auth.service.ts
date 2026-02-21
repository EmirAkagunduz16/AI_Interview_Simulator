import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { Kafka, Producer, logLevel } from "kafkajs";
import { AuthUser, AuthUserDocument } from "./entities/auth-user.entity";
import {
  RegisterDto,
  LoginDto,
  TokenResponseDto,
  ValidateResponseDto,
} from "./dto/auth.dto";
import { RedisService } from "../common/redis/redis.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private producer: Producer | null = null;

  constructor(
    @InjectModel(AuthUser.name)
    private readonly authUserModel: Model<AuthUserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.initKafkaProducer();
  }

  private async initKafkaProducer(): Promise<void> {
    const brokers = this.configService
      .get<string>("KAFKA_BROKERS")
      ?.split(",") || ["localhost:9092"];
    const kafka = new Kafka({
      clientId: "auth-service-producer",
      brokers,
      logLevel: logLevel.WARN,
      retry: { initialRetryTime: 1000, retries: 10 },
    });

    this.producer = kafka.producer();
    try {
      await this.producer.connect();
      this.logger.log("Kafka producer connected");
    } catch (error) {
      this.logger.error("Failed to connect Kafka producer", error);
    }
  }

  async register(dto: RegisterDto): Promise<TokenResponseDto> {
    // Check if user already exists
    const existing = await this.authUserModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException("Bu email adresi zaten kayıtlı");
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create auth user
    const authUser = await this.authUserModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name,
      role: "user",
    });

    // Generate tokens
    const tokens = await this.generateTokens(authUser);

    // Save refresh token
    authUser.refreshToken = tokens.refreshToken;
    await authUser.save();

    // Emit Kafka event: user.registered
    await this.emitUserRegistered(authUser);

    this.logger.log(`User registered: ${authUser.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.configService.get<string>("jwt.accessExpiresIn", "15m"),
      user: {
        id: authUser._id.toString(),
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
      },
    };
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const authUser = await this.authUserModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (!authUser) {
      throw new UnauthorizedException("Email veya şifre hatalı");
    }

    if (!authUser.isActive) {
      throw new UnauthorizedException("Hesap devre dışı bırakılmış");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      authUser.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Email veya şifre hatalı");
    }

    const tokens = await this.generateTokens(authUser);

    // Update refresh token
    authUser.refreshToken = tokens.refreshToken;
    await authUser.save();

    this.logger.log(`User logged in: ${authUser.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.configService.get<string>("jwt.accessExpiresIn", "15m"),
      user: {
        id: authUser._id.toString(),
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    // Check if token is blacklisted
    const isBlacklisted = await this.redisService.get(`bl:${refreshToken}`);
    if (isBlacklisted) {
      throw new UnauthorizedException("Token geçersiz");
    }

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
      });
    } catch {
      throw new UnauthorizedException(
        "Refresh token geçersiz veya süresi dolmuş",
      );
    }

    const authUser = await this.authUserModel.findById(payload.sub);
    if (!authUser || authUser.refreshToken !== refreshToken) {
      throw new UnauthorizedException("Token geçersiz");
    }

    const tokens = await this.generateTokens(authUser);

    // Blacklist old refresh token
    await this.redisService.set(`bl:${refreshToken}`, "1", 7 * 24 * 60 * 60);

    // Save new refresh token
    authUser.refreshToken = tokens.refreshToken;
    await authUser.save();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.configService.get<string>("jwt.accessExpiresIn", "15m"),
      user: {
        id: authUser._id.toString(),
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
      },
    };
  }

  async validate(accessToken: string): Promise<ValidateResponseDto> {
    // Check if token is blacklisted
    const isBlacklisted = await this.redisService.get(`bl:${accessToken}`);
    if (isBlacklisted) {
      return { valid: false, userId: "", email: "", role: "" };
    }

    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: this.configService.get<string>("jwt.accessSecret"),
      });

      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
        role: payload.role || "user",
      };
    } catch {
      return { valid: false, userId: "", email: "", role: "" };
    }
  }

  async logout(accessToken: string): Promise<void> {
    // Blacklist the access token (expires in 15m anyway)
    await this.redisService.set(`bl:${accessToken}`, "1", 15 * 60);

    // Also try to find user and clear refresh token
    try {
      const payload = this.jwtService.decode(accessToken) as {
        sub: string;
      } | null;
      if (payload?.sub) {
        await this.authUserModel.findByIdAndUpdate(payload.sub, {
          refreshToken: null,
        });
      }
    } catch {
      // Ignore decode errors
    }
  }

  private async generateTokens(
    user: AuthUserDocument,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessExpiresIn =
      this.configService.get<string>("jwt.accessExpiresIn") ?? "15m";
    const refreshExpiresIn =
      this.configService.get<string>("jwt.refreshExpiresIn") ?? "7d";

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.accessSecret"),
        expiresIn: accessExpiresIn as unknown as number,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.refreshSecret"),
        expiresIn: refreshExpiresIn as unknown as number,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async emitUserRegistered(user: AuthUserDocument): Promise<void> {
    if (!this.producer) return;

    try {
      await this.producer.send({
        topic: "user.registered",
        messages: [
          {
            key: user._id.toString(),
            value: JSON.stringify({
              eventId: uuidv4(),
              eventType: "user.registered",
              timestamp: new Date().toISOString(),
              source: "auth-service",
              payload: {
                userId: user._id.toString(),
                email: user.email,
                name: user.name,
              },
            }),
          },
        ],
      });
      this.logger.log(`Kafka event emitted: user.registered for ${user.email}`);
    } catch (error) {
      this.logger.error("Failed to emit user.registered event", error);
    }
  }
}
