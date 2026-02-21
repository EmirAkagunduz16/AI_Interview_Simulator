import { Injectable, Logger } from "@nestjs/common";
import { UserRepository } from "./repositories/user.repository";
import { PaginationOptions } from "@ai-coach/database";
import { CreateUserInternalDto, UpdateUserDto } from "./dto";
import { User, UserDocument } from "./entities/user.entity";
import {
  UserNotFoundException,
  UserAlreadyExistsException,
} from "../common/exceptions";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async createInternal(dto: CreateUserInternalDto): Promise<UserDocument> {
    this.logger.log(`Creating user profile for authId: ${dto.authId}`);

    const exists = await this.userRepository.existsByEmail(dto.email);
    if (exists) {
      throw new UserAlreadyExistsException(dto.email);
    }

    const user = await this.userRepository.create({
      authId: dto.authId,
      email: dto.email.toLowerCase(),
      name: dto.name,
    });

    this.logger.log(`User profile created: ${user._id}`);
    return user;
  }

  async findByAuthId(authId: string): Promise<UserDocument> {
    const user = await this.userRepository.findByAuthId(authId);
    if (!user) {
      throw new UserNotFoundException(authId);
    }
    return user;
  }

  async findByAuthIdSafe(authId: string): Promise<UserDocument | null> {
    return this.userRepository.findByAuthId(authId);
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }

  async update(authId: string, dto: UpdateUserDto): Promise<UserDocument> {
    const updateData: Partial<User> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    const updated = await this.userRepository.updateByAuthId(
      authId,
      updateData,
    );
    if (!updated) {
      throw new UserNotFoundException(authId);
    }

    this.logger.log(`User updated: ${authId}`);
    return updated;
  }

  async findAll(options: PaginationOptions): Promise<{
    users: UserDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = options;
    const { items: users, total } = await this.userRepository.findAll(
      {},
      options,
    );
    const totalPages = Math.ceil(total / limit);

    return { users, total, page, totalPages };
  }

  async getDashboardStats(authId: string): Promise<{
    interviewCount: number;
    totalScore: number;
    averageScore: number;
    lastInterviewAt: Date | null;
  }> {
    const user = await this.findByAuthId(authId);
    const averageScore =
      user.interviewCount > 0
        ? Math.round(user.totalScore / user.interviewCount)
        : 0;

    return {
      interviewCount: user.interviewCount,
      totalScore: user.totalScore,
      averageScore,
      lastInterviewAt: user.lastInterviewAt || null,
    };
  }

  async deactivate(authId: string): Promise<void> {
    const user = await this.findByAuthId(authId);
    await this.userRepository.deactivate(user._id.toString());
    this.logger.log(`User deactivated: ${authId}`);
  }
}
