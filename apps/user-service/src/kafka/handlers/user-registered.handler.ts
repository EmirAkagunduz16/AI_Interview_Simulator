import { Injectable, Logger } from "@nestjs/common";
import { IUserRegisteredPayload } from "@ai-coach/shared-types";
import { UsersService } from "../../users/users.service";

@Injectable()
export class UserRegisteredHandler {
  private readonly logger = new Logger(UserRegisteredHandler.name);

  constructor(private readonly usersService: UsersService) {}

  async handle(payload: IUserRegisteredPayload, metadata?: any): Promise<void> {
    try {
      // Check if user already exists (idempotency)
      const existing = await this.usersService.findByAuthIdSafe(payload.userId);
      if (existing) {
        this.logger.log(
          `User profile already exists for authId: ${payload.userId}`,
        );
        return;
      }

      await this.usersService.createInternal({
        authId: payload.userId,
        email: payload.email,
        name: payload.name,
      });

      this.logger.log(`User profile auto-created for: ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to create user profile for ${payload.email}`,
        error,
      );
    }
  }
}
