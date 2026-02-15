import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { UsersController } from "./users.controller";
import { QuestionsController } from "./questions.controller";
import { InterviewsController } from "./interviews.controller";
import { AiController } from "./ai.controller";

@Module({
  controllers: [
    AuthController,
    UsersController,
    QuestionsController,
    InterviewsController,
    AiController,
  ],
})
export class RoutesModule {}
