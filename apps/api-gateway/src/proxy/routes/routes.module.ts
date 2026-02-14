import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { QuestionsController } from "./questions.controller";
import { InterviewsController } from "./interviews.controller";
import { AiController } from "./ai.controller";

@Module({
  controllers: [
    UsersController,
    QuestionsController,
    InterviewsController,
    AiController,
  ],
})
export class RoutesModule {}
