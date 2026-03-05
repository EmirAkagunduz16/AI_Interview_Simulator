import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GrpcUsersController } from "./grpc.controller";
import { UsersService } from "./users.service";
import { User, UserSchema } from "./entities/user.entity";
import { UserRepository } from "./repositories/user.repository";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [GrpcUsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}
