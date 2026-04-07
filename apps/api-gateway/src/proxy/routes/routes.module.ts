import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { UsersController } from "./users.controller";
import { InterviewsController } from "./interviews.controller";
import { AiController } from "./ai.controller";
import { QuestionsController } from "./questions.controller";

@Module({
  controllers: [
    AuthController,
    UsersController,
    InterviewsController,
    AiController,
    QuestionsController,
  ],
})
export class RoutesModule {}
